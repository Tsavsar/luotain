import { prisma } from '@/lib/prisma'
import {
  readWebhook,
  planFromProductId,
  WebhookVerificationError,
} from '@/lib/billing'

// ─── Billing webhook ───
// The ONLY thing that changes a workspace's plan.
//
// Not the checkout route, and not a success redirect. A redirect can be
// visited by anyone typing the URL, and it doesn't arrive at all if the person
// closes the tab after paying — so trusting it would both grant plans that
// weren't bought and miss ones that were. The webhook is the payment
// provider telling us what actually happened.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request) {
  // The RAW body, not request.json(). The signature is computed over the exact
  // bytes, so parsing and re-serialising invalidates it — this is the single
  // most common reason Polar signature checks fail.
  const raw = await request.text()

  let event
  try {
    event = readWebhook(raw, Object.fromEntries(request.headers))
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      // 403, and nothing else. This endpoint is public, and without the
      // signature check anyone who found the URL could grant themselves Pro.
      console.error('[billing.webhook] bad signature')
      return new Response('', { status: 403 })
    }
    console.error('[billing.webhook]', err)
    return new Response('', { status: 500 })
  }

  try {
    await handle(event)
  } catch (err) {
    // 500 so Polar retries. Swallowing this would lose a paid upgrade
    // permanently, and a duplicate delivery is harmless because every write
    // below is idempotent.
    console.error('[billing.webhook] handler failed', event?.type, err)
    return new Response('', { status: 500 })
  }

  return new Response('', { status: 202 })
}

// The organization id travels in checkout metadata and comes back on the
// subscription. Polar knows its own customer; only we know which workspace
// paid, and email is the wrong key since one person can own several.
function orgIdFrom(data) {
  return (
    data?.metadata?.organizationId ||
    data?.checkout?.metadata?.organizationId ||
    data?.subscription?.metadata?.organizationId ||
    null
  )
}

async function handle(event) {
  const { type, data } = event

  switch (type) {
    // active covers a new subscription and a recovered one. created alone
    // would miss a past_due subscription coming back to life.
    case 'subscription.created':
    case 'subscription.active':
    case 'subscription.updated':
    case 'subscription.uncanceled': {
      const organizationId = orgIdFrom(data)
      if (!organizationId) {
        console.error('[billing.webhook] no organizationId on', type)
        return
      }

      const mapped = planFromProductId(data?.productId || data?.product?.id)
      if (!mapped) {
        console.error('[billing.webhook] unmapped product', data?.productId)
        return
      }

      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          plan: mapped.planId,
          billingInterval: mapped.interval,
          billingPeriodEnd: data?.currentPeriodEnd
            ? new Date(data.currentPeriodEnd)
            : null,
          // cancelAtPeriodEnd, not the status. A cancelled subscription keeps
          // working until the period ends, and the billing page has to say
          // "ends on" rather than "renews on" for that whole window.
          cancelAtPeriodEnd: Boolean(data?.cancelAtPeriodEnd),
          customerId: data?.customerId || data?.customer?.id || undefined,
          subscriptionId: data?.id || undefined,
        },
      })
      return
    }

    // Revoked means access is gone NOW: cancelled and the period has ended, or
    // payment retries exhausted. Distinct from canceled, which is still paid up.
    case 'subscription.revoked': {
      const organizationId = orgIdFrom(data)
      if (!organizationId) return

      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          plan: 'FREE',
          billingPeriodEnd: null,
          billingInterval: null,
          cancelAtPeriodEnd: false,
          subscriptionId: null,
        },
      })
      return
    }

    // Payment failed but recoverable. The plan is deliberately NOT downgraded:
    // a card that expires on a Tuesday shouldn't cost someone their links
    // before they've had a chance to update it. Polar handles the retries and
    // sends revoked if they're exhausted.
    case 'subscription.past_due':
      return

    // The card on file, so the billing page can show it. Polar holds the card;
    // this is brand and last four only, which is all a UI needs and all this
    // app should ever store.
    case 'order.paid': {
      const organizationId = orgIdFrom(data)
      if (!organizationId) return

      const card = data?.paymentMethod || data?.payment_method
      if (!card?.brand && !card?.last4) return

      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          cardBrand: card.brand || undefined,
          cardLast4: card.last4 || card.lastFour || undefined,
        },
      })
      return
    }

    default:
      // Everything else is acknowledged and ignored. Returning an error for an
      // event we don't handle would make Polar retry it forever.
      return
  }
}
