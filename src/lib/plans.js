// ─── Plans ───
// One definition, read by both the server (enforcement) and the UI (the plan
// card, usage counters, disabled states).
//
// That matters more than it sounds: the moment limits live in two places,
// the interface starts offering something the API refuses, or worse, the API
// allows something the interface says is paid. Everything below derives from
// this file.
//
// Plain .js with no 'use client' so server routes and client components can
// both import it.

export const PLANS = {
  FREE: {
    id: 'FREE',
    name: 'Free plan',
    tagline: 'Try it properly before you commit to anything.',
    priceMonthly: 0,
    priceAnnual: 0,
    priceNote: 'No card required',
    // null means unlimited. Deliberately null rather than Infinity, which
    // doesn't survive JSON — the limit crosses the network on every page.
    maxLinks: 5,
    customSlugs: false,
    csvExport: false,
    customDomain: false,
    support: 'Community support',
  },
  STARTER: {
    id: 'STARTER',
    name: 'Starter',
    tagline: "Run campaigns, once you've outgrown testing.",
    priceMonthly: 5,
    // TODO: confirm. "Save 20%" on $5/month is $48/year — a placeholder
    // until you give me the real number, and the annual toggle shouldn't
    // ship showing a figure nobody has signed off.
    priceAnnual: 48,
    priceNote: 'Billed monthly',
    maxLinks: 50,
    customSlugs: false,
    csvExport: false,
    customDomain: false,
    support: 'Email support',
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    tagline: 'Run it like a real product, own your domain!',
    priceMonthly: 12,
    // TODO: same — 20% off $12/month is $115/year, unconfirmed.
    priceAnnual: 115,
    priceNote: 'Billed monthly',
    maxLinks: null,
    customSlugs: true,
    csvExport: true,
    customDomain: true,
    support: 'Email support',
  },
}

// Display order, and the order the card renders in. Explicit rather than
// Object.values, which depends on key insertion order.
export const PLAN_ORDER = ['FREE', 'STARTER', 'PRO']

export const DEFAULT_PLAN = 'FREE'

// The feature rows on the plan card, in order. Derived from the plan objects
// rather than hardcoded per column, so a plan gaining a capability updates
// all three columns at once and they can't drift out of sync.
export const PLAN_FEATURES = [
  {
    label: (p) =>
      p.maxLinks === null ? 'Unlimited links' : `${p.maxLinks} links`,
    included: () => true,
  },
  { label: () => 'QR code with every link', included: () => true },
  { label: () => 'Full click and scan analytics', included: () => true },
  { label: (p) => p.support, included: () => true },
  { label: () => 'CSV export', included: (p) => p.csvExport },
  { label: () => 'Custom slugs', included: (p) => p.customSlugs },
  { label: () => 'Custom domain', included: (p) => p.customDomain },
]

// Falls back rather than throwing. An unknown plan string — a typo in the
// database, or a tier that's been removed — should degrade to the free tier's
// limits, not take down every page that reads it.
export function planFor(id) {
  return PLANS[id] || PLANS[DEFAULT_PLAN]
}

export function isUnlimited(plan) {
  return planFor(plan?.id || plan).maxLinks === null
}

// ─── Limit checks ───
// Both return a reason string when blocked and null when allowed, so callers
// read as `const reason = check(...); if (reason) return error(reason)`.

export function linkLimitReason(planId, currentCount) {
  const plan = planFor(planId)
  if (plan.maxLinks === null) return null
  if (currentCount < plan.maxLinks) return null
  return `${plan.name} includes ${plan.maxLinks} links. Upgrade for more.`
}

export function customSlugReason(planId) {
  const plan = planFor(planId)
  if (plan.customSlugs) return null
  return `Custom slugs are a Pro feature. ${plan.name} generates one for you.`
}

// For the usage line on the plan card and anywhere else that shows progress
// against a limit. Returns null for unlimited plans — there's no meaningful
// fraction of infinity, and rendering "3 of ∞" is worse than rendering
// nothing.
export function usageLabel(planId, currentCount) {
  const plan = planFor(planId)
  if (plan.maxLinks === null) return null
  return `${currentCount} of ${plan.maxLinks} links used`
}
