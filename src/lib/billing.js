// ─── Billing provider ───
// Bachs, behind a deliberately thin adapter.
//
// Everything provider-specific lives in THIS file. The routes and the billing
// page only ever call createCheckout, openPortal, readWebhook, getSubscription
// and listInvoices, so changing provider is a rewrite of one file rather than a
// hunt through the app — which is how this moved off Polar. Polar pays out only
// through Stripe, and Stripe doesn't onboard Nigerian merchants; Bachs is a
// Nigerian company that pays out to a Nigerian bank in naira, with the same
// shape of API (catalog products, hosted checkout, signed webhooks, a hosted
// customer portal).
//
// Two differences worth knowing:
// - Subscriptions bill USD cards only, for now. Bachs takes naira for one-off
//   payments, not recurring ones, so every plan is priced in dollars.
// - Polar was the merchant of record and collected sales tax itself. Bachs's
//   docs don't say it does, so treat tax as ours until they confirm otherwise.
//
// Plain fetch rather than an SDK: six endpoints don't justify a dependency,
// and every request and response shape is documented at docs.bachs.io.
import crypto from 'node:crypto'

function apiKey() {
  const key = process.env.BACHS_API_KEY
  if (!key) throw new Error('BACHS_API_KEY is not set')
  return key
}

// The key decides the environment. A sandbox key only works against the
// sandbox and a live key only against live, so deriving the URL from the key
// makes a mismatch impossible rather than one more thing to remember — and an
// unrecognised key fails toward the sandbox, where nothing real moves.
function apiBase() {
  return apiKey().startsWith('sk_live_')
    ? 'https://api.bachs.io'
    : 'https://sandbox-api.bachs.io'
}

async function bachs(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${apiBase()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      `Bachs ${method} ${path} failed (${res.status})`
    throw new Error(message)
  }
  return data
}

function baseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    'https://www.luotain.app'
  ).replace(/\/$/, '')
}

// Bachs refuses redirects to localhost and private addresses, sandbox
// included. Left out locally, so a dev checkout still opens — you come back to
// the app by hand after paying, and the webhook does the rest either way.
function returnUrl(path) {
  const base = baseUrl()
  return /\/\/(localhost|127\.|10\.|192\.168\.)/.test(base)
    ? undefined
    : `${base}${path}`
}

// Our plan and interval to Bachs's product ids. Two products per paid tier,
// because a product's billing cycle is fixed when it's created.
//
// FREE has none on purpose: downgrading is a cancellation, not a purchase, and
// sending someone to checkout for a $0 product would take a card for nothing.
export function productIdFor(planId, annual) {
  const map = {
    STARTER: {
      month: process.env.BACHS_PRODUCT_STARTER_MONTHLY,
      year: process.env.BACHS_PRODUCT_STARTER_YEARLY,
    },
    PRO: {
      month: process.env.BACHS_PRODUCT_PRO_MONTHLY,
      year: process.env.BACHS_PRODUCT_PRO_YEARLY,
    },
  }
  return map[planId]?.[annual ? 'year' : 'month'] || null
}

export function planFromProductId(productId) {
  const pairs = [
    ['STARTER', process.env.BACHS_PRODUCT_STARTER_MONTHLY, 'month'],
    ['STARTER', process.env.BACHS_PRODUCT_STARTER_YEARLY, 'year'],
    ['PRO', process.env.BACHS_PRODUCT_PRO_MONTHLY, 'month'],
    ['PRO', process.env.BACHS_PRODUCT_PRO_YEARLY, 'year'],
  ]
  for (const [planId, id, interval] of pairs) {
    if (id && id === productId) return { planId, interval }
  }
  return null
}

// Creates a hosted checkout and returns its URL.
export async function createCheckout({
  planId,
  annual,
  email,
  customerId,
  organizationId,
  userId,
}) {
  const productId = productIdFor(planId, annual)
  if (!productId) {
    return {
      error: `No Bachs product configured for ${planId} ${annual ? 'yearly' : 'monthly'}`,
    }
  }

  try {
    const session = await bachs('/v1/checkout-sessions', {
      method: 'POST',
      body: {
        product_cart: [{ product_id: productId, quantity: 1 }],
        // A subscription needs a customer. The saved one when this workspace
        // has paid before, so renewals, the portal and the invoices stay on
        // one record; otherwise the owner's email, and Bachs creates it.
        customer: customerId ? { customer_id: customerId } : { email },
        billing_currency: 'USD',
        // Copied onto the subscription, so every subscription webhook says
        // which workspace it's for. Only we know that — Bachs knows its own
        // customer, and an email is the wrong key since one person can own
        // several workspaces.
        metadata: {
          organizationId: String(organizationId),
          userId: String(userId || ''),
          planId: String(planId),
          interval: annual ? 'year' : 'month',
        },
        success_url: returnUrl('/dashboard/settings/billing?checkout=success'),
        cancel_url: returnUrl('/dashboard/settings/billing'),
      },
    })
    return { url: session.checkout_url }
  } catch (err) {
    console.error('[billing.createCheckout]', err)
    return { error: err?.message || 'Could not start checkout' }
  }
}

// The customer portal, where someone updates a card, switches plan or
// cancels. Bachs hosts it, which is why this app never sees a card number.
// Sessions are short-lived, so this makes a new one on every click.
export async function openPortal({ customerId }) {
  if (!customerId)
    return { error: 'This workspace has no billing customer yet' }
  try {
    const session = await bachs(
      `/v1/customers/${encodeURIComponent(customerId)}/portal-sessions`,
      { method: 'POST' }
    )
    return { url: session.url }
  } catch (err) {
    console.error('[billing.openPortal]', err)
    return { error: err?.message || 'Could not open the billing portal' }
  }
}

// ─── Webhooks ───

export class WebhookVerificationError extends Error {}

// Verifies the signature and returns the parsed event, or throws.
//
// The signature check is the whole security model for the webhook: the
// endpoint is public, and without it anyone who knows the URL can grant
// themselves Pro.
export function readWebhook(rawBody, headers) {
  const secret = process.env.BACHS_WEBHOOK_SECRET
  if (!secret) throw new Error('BACHS_WEBHOOK_SECRET is not set')
  if (!verifySignature(headers['x-bachs-signature-v2'], rawBody, secret)) {
    throw new WebhookVerificationError('Invalid signature')
  }
  return JSON.parse(rawBody)
}

// X-Bachs-Signature-V2 reads "t=1760000000,v1=abc…,v1=def…": an HMAC-SHA256
// of "<t>.<raw body>" in hex. There's one v1 per valid secret while a secret
// is being rotated, so any match passes. Five minutes of tolerance on the
// timestamp, so a captured delivery can't be replayed later.
function verifySignature(header, rawBody, secret, toleranceSeconds = 300) {
  if (!header) return false
  // On the first "=" only, as Bachs's own reference does: a value split on
  // every "=" would come apart the day one contained one.
  const parts = header.split(',').map((part) => {
    const i = part.indexOf('=')
    return [part.slice(0, i).trim(), part.slice(i + 1).trim()]
  })
  const timestamp = Number(parts.find(([key]) => key === 't')?.[1])
  if (!timestamp || Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds)
    return false

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')

  return parts
    .filter(([key]) => key === 'v1')
    .some(
      ([, sig]) =>
        sig?.length === expected.length &&
        crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    )
}

// The subscription as Bachs has it now, flattened to what the app stores.
// Read fresh rather than taken from the webhook: deliveries can arrive out of
// order and more than once, and the current state is right either way.
export async function getSubscription(subscriptionId) {
  const sub = await bachs(
    `/v1/subscriptions/${encodeURIComponent(subscriptionId)}`
  )
  return {
    id: sub.id,
    status: sub.status,
    customerId: sub.customer?.customer_id || null,
    productId: sub.product?.id || sub.items?.[0]?.price?.product_id || null,
    currentPeriodEnd: sub.current_period_end || null,
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
    metadata: sub.metadata || {},
  }
}

// Past payments, for the invoices table. Bachs holds these — we don't keep a
// copy, because a mirrored invoice that disagrees with the provider's is worse
// than no invoice at all.
//
// Payments rather than invoices: Bachs has no invoice list, and its payments
// list can't filter by customer. Each payment carries the checkout's metadata
// as `meta`, so the workspace id we put there picks out this workspace's
// payments; the subscription id is the fallback for any that lack it. Once
// the whole account passes a hundred payments the oldest stop showing here;
// the portal keeps them all.
//
// Read field by field with fallbacks: the list's real shape (id, meta,
// completed_at) differs from the documented one (payment_id, subscription_id,
// created_at), and either may be what a later version returns.
export async function listInvoices({ organizationId, subscriptionId, limit = 10 }) {
  if (!organizationId && !subscriptionId) return []
  try {
    const res = await bachs('/v1/payments?limit=100&status_filter=succeeded')
    return (res?.items || [])
      .filter(
        (p) =>
          (organizationId && p.meta?.organizationId === organizationId) ||
          (subscriptionId &&
            (p.subscription_id === subscriptionId ||
              p.invoice?.subscription_id === subscriptionId))
      )
      .slice(0, limit)
      .map((p) => ({
        id:
          p.invoice?.number || p.invoice?.invoice_id || p.id || p.payment_id,
        date: p.completed_at || p.transaction_date || p.created_at,
        // A decimal string in major units ("4.99"), unlike Polar's cents.
        amount: p.amount != null ? Number(p.amount) : null,
        currency: (p.currency || 'USD').toUpperCase(),
        status: p.status === 'succeeded' ? 'paid' : p.status || 'pending',
        // No hosted receipt in the API. The billing page sends a real invoice
        // without a URL to the portal, where Bachs shows it.
        url: null,
      }))
  } catch (err) {
    // Never throws. A failed invoice fetch should leave the rest of the
    // billing page working, not blank it — the plan and card matter more.
    console.error('[billing.listInvoices]', err)
    return []
  }
}
