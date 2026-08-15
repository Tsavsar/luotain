 // ─── Billing provider ───
// Polar, behind a deliberately thin adapter.
//
// Everything Polar-specific lives in THIS file. The routes and the billing page
// only ever call createCheckout, openPortal and readWebhook, so changing
// provider is a rewrite of one file rather than a hunt through the app. That
// matters more than usual here: Polar was chosen partly because Stripe doesn't
// onboard Nigerian merchants, and that constraint could push a later move.
//
// Polar is a Merchant of Record — it's the legal seller, and it collects and
// remits VAT, GST and US state sales tax. That's the reason to accept a higher
// percentage than a bare processor would charge.
import { Polar } from '@polar-sh/sdk'
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks'

// Sandbox unless explicitly in production, so a mis-set env var fails toward
// the harmless one.
function client() {
  if (!process.env.POLAR_ACCESS_TOKEN) {
    throw new Error('POLAR_ACCESS_TOKEN is not set')
  }
  return new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN,
    server: process.env.POLAR_SERVER === 'production' ? 'production' : 'sandbox',
  })
}

function baseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    'https://luotain.app'
  ).replace(/\/$/, '')
}

// Our plan and interval to Polar's product ids. Two products per paid tier,
// because Polar prices monthly and yearly separately.
//
// FREE has none on purpose: downgrading is a cancellation, not a purchase, and
// sending someone to checkout for a £0 product would take a payment method for
// nothing.
export function productIdFor(planId, annual) {
  const map = {
    STARTER: {
      month: process.env.POLAR_PRODUCT_STARTER_MONTHLY,
      year: process.env.POLAR_PRODUCT_STARTER_YEARLY,
    },
    PRO: {
      month: process.env.POLAR_PRODUCT_PRO_MONTHLY,
      year: process.env.POLAR_PRODUCT_PRO_YEARLY,
    },
  }
  return map[planId]?.[annual ? 'year' : 'month'] || null
}

// Creates a hosted checkout and returns its URL.
export async function createCheckout({ planId, annual, email, organizationId, userId }) {
  const productId = productIdFor(planId, annual)
  if (!productId) {
    return { error: `No Polar product configured for ${planId} ${annual ? 'yearly' : 'monthly'}` }
  }

  try {
    const checkout = await client().checkouts.create({
      products: [productId],
      customerEmail: email || undefined,
      successUrl: `${baseUrl()}/dashboard/settings/billing?checkout=success`,
      // WITHOUT this the webhook arrives with no idea which workspace paid.
      // Polar knows its own customer; only we know the organization, and an
      // email is the wrong key — one person can own several workspaces.
      metadata: {
        organizationId: String(organizationId),
        userId: String(userId || ''),
        planId: String(planId),
        interval: annual ? 'year' : 'month',
      },
    })
    return { url: checkout.url }
  } catch (err) {
    console.error('[billing.createCheckout]', err)
    return { error: err?.message || 'Could not start checkout' }
  }
}

// The customer portal, where someone updates a card or cancels. Polar hosts it,
// which is why this app never sees a card number.
export async function openPortal({ customerId }) {
  if (!customerId) return { error: 'This workspace has no billing customer yet' }
  try {
    const session = await client().customerSessions.create({ customerId })
    return { url: session.customerPortalUrl }
  } catch (err) {
    console.error('[billing.openPortal]', err)
    return { error: err?.message || 'Could not open the billing portal' }
  }
}

// Verifies the signature and returns a normalised event, or throws.
//
// The signature check is the whole security model for the webhook: the endpoint
// is public, and without it anyone who knows the URL can grant themselves Pro.
export function readWebhook(rawBody, headers) {
  if (!process.env.POLAR_WEBHOOK_SECRET) {
    throw new Error('POLAR_WEBHOOK_SECRET is not set')
  }
  return validateEvent(rawBody, headers, process.env.POLAR_WEBHOOK_SECRET)
}

export { WebhookVerificationError }

// Polar's subscription shape to ours. Kept here so the webhook route reads as
// business logic rather than as field mapping.
export function planFromProductId(productId) {
  const pairs = [
    ['STARTER', process.env.POLAR_PRODUCT_STARTER_MONTHLY, 'month'],
    ['STARTER', process.env.POLAR_PRODUCT_STARTER_YEARLY, 'year'],
    ['PRO', process.env.POLAR_PRODUCT_PRO_MONTHLY, 'month'],
    ['PRO', process.env.POLAR_PRODUCT_PRO_YEARLY, 'year'],
  ]
  for (const [planId, id, interval] of pairs) {
    if (id && id === productId) return { planId, interval }
  }
  return null
}