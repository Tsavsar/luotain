import { prisma } from '@/lib/prisma'
import {
  readWebhook,
  getSubscription,
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
  // bytes, so parsing and re-serialising invalidates it.
  const raw = await request.text()

  let event
  try {
    event = readWebhook(raw, Object.fromEntries(request.headers))
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      // 400, which Bachs treats as final rather than retrying: a signature
      // that doesn't match never will. This endpoint is public, and without
      // the check anyone who found the URL could grant themselves Pro.
      console.error('[billing.webhook] bad signature')
      return new Response('', { status: 400 })
    }
    console.error('[billing.webhook]', err)
    return new Response('', { status: 500 })
  }

  try {
    await handle(event)
  } catch (err) {
    // 500 so Bachs retries. Swallowing this would lose a paid upgrade
    // permanently, and a duplicate delivery is harmless because every write
    // below saves the subscription's current state rather than a change.
    console.error('[billing.webhook] handler failed', event?.type, err)
    return new Response('', { status: 500 })
  }

  return new Response('', { status: 200 })
}

async function handle(event) {
  const { type, data } = event

  switch (type) {
    // Created on checkout, updated on renewal, plan change, scheduled
    // cancellation, card change or a status change; deleted once it's over.
    // All three get the same answer: read the subscription and save it whole.
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      return syncSubscription(data)

    // The card on file, so the billing page can show it. Brand and last four
    // only — Bachs holds the card, and that's all a UI needs and all this app
    // should ever store.
    case 'collection.succeeded':
      return saveCard(data)

    default:
      // Everything else is acknowledged and ignored. Erroring on an event we
      // don't handle would make Bachs retry it until it gives up.
      return
  }
}

// Statuses that mean the plan is over. past_due is deliberately NOT here: a
// card that expires on a Tuesday shouldn't cost someone their links before
// they've had a chance to update it — Bachs retries, then sends unpaid.
const ENDED = ['unpaid', 'canceled', 'paused']

async function syncSubscription(data) {
  const id = data?.id || data?.subscription_id
  if (!id) return

  // Fresh, not the payload: deliveries can come out of order, and an old
  // "active" landing after "canceled" must not re-grant the plan.
  const sub = await getSubscription(id)

  const organizationId =
    data?.metadata?.organizationId ||
    sub.metadata?.organizationId ||
    (await orgIdFor(sub))
  if (!organizationId) {
    console.error('[billing.webhook] no workspace for subscription', id)
    return
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { subscriptionId: true },
  })
  if (!org) return

  if (ENDED.includes(sub.status)) {
    // Only the subscription on record can end the plan. Without this, an old
    // subscription winding down after a plan change would take the workspace
    // back to Free while its new one is still paid.
    if (org.subscriptionId && org.subscriptionId !== sub.id) return

    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        plan: 'FREE',
        billingPeriodEnd: null,
        billingInterval: null,
        cancelAtPeriodEnd: false,
        subscriptionId: null,
        // customerId stays: the next checkout and the portal reuse it.
      },
    })
    return
  }

  const mapped = planFromProductId(sub.productId)
  if (!mapped) {
    console.error('[billing.webhook] unmapped product', sub.productId)
    return
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      plan: mapped.planId,
      billingInterval: mapped.interval,
      billingPeriodEnd: sub.currentPeriodEnd
        ? new Date(sub.currentPeriodEnd)
        : null,
      // cancelAtPeriodEnd, not the status. A cancelled subscription keeps
      // working until the period ends, and the billing page has to say "ends
      // on" rather than "renews on" for that whole window.
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      customerId: sub.customerId || undefined,
      subscriptionId: sub.id,
    },
  })
}

// Metadata is the main key; this is the fallback for a subscription created
// without it — matched on the ids saved from an earlier event.
async function orgIdFor(sub) {
  const org = await prisma.organization.findFirst({
    where: {
      OR: [
        { subscriptionId: sub.id },
        ...(sub.customerId ? [{ customerId: sub.customerId }] : []),
      ],
    },
    select: { id: true },
  })
  return org?.id || null
}

async function saveCard(payment) {
  // The checkout's metadata rides on the payment as `meta`, so the workspace
  // is known even on the first payment, before any subscription event has
  // landed. The subscription id is the fallback for payments without it.
  const organizationId =
    payment?.meta?.organizationId || payment?.metadata?.organizationId
  const subscriptionId =
    payment?.subscription_id || payment?.invoice?.subscription_id
  if (!organizationId && !subscriptionId) return

  // A card payment reports brand and last four on payment_method; the
  // documented payment_method_details shape is the fallback. Sandbox cards
  // leave both empty, which is why test workspaces show no card.
  const details = payment?.payment_method_details
  const card =
    payment?.payment_method?.last4 || payment?.payment_method?.brand
      ? payment.payment_method
      : details?.card || details?.[details?.type]
  const brand = card?.brand || card?.scheme
  const last4 = card?.last4 || card?.last_four
  if (!brand && !last4) return

  const { count } = await prisma.organization.updateMany({
    where: organizationId ? { id: organizationId } : { subscriptionId },
    data: {
      cardBrand: brand || undefined,
      cardLast4: last4 || undefined,
    },
  })
  // Matched only by subscription, this can land before the subscription event
  // that records it. Throwing gets a retry, by which point it has; Bachs gives
  // up eventually if it never matches.
  if (count === 0 && !organizationId) {
    throw new Error(`No workspace has subscription ${subscriptionId} yet`)
  }
}
