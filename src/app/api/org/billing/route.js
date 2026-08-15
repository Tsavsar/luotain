import { prisma } from '@/lib/prisma'
import { resolveActiveOrg } from '@/lib/resolveActiveOrg'
import { PLANS } from '@/lib/plans'
import { listInvoices } from '@/lib/billing'

// GET /api/org/billing
export async function GET() {
  const { error, organizationId, userId } = await resolveActiveOrg()
  if (error) return error

  const [org, membership, linkCount] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        plan: true,
        billingPeriodEnd: true,
        billingInterval: true,
        cancelAtPeriodEnd: true,
        cardBrand: true,
        cardLast4: true,
        customerId: true,
      },
    }),
    prisma.membership.findFirst({
      where: { organizationId, userId },
      select: { role: true },
    }),
    // Trashed links count, matching what the create endpoint enforces — the
    // usage line here has to agree with the limit that actually blocks you.
    prisma.link.count({ where: { organizationId } }),
  ])

  if (!org) {
    return Response.json({ error: 'Workspace not found' }, { status: 404 })
  }

  const plan = PLANS[org.plan] || PLANS.FREE

  return Response.json({
    // Only an owner can change billing. Returned so the page can render the
    // buttons as absent rather than showing them and 403ing on click.
    role: membership?.role || null,
    plan: {
      id: plan.id,
      name: plan.name,
      maxLinks: plan.maxLinks,
    },
    linkCount,
    periodEnd: org.billingPeriodEnd,
    interval: org.billingInterval,
    cancelAtPeriodEnd: org.cancelAtPeriodEnd,
    card:
      org.cardBrand && org.cardLast4
        ? { brand: org.cardBrand, last4: org.cardLast4 }
        : null,
    // Fetched live from Polar rather than stored. A mirrored invoice that
    // disagrees with the provider's is worse than no invoice at all, and
    // there's nothing here worth caching.
    invoices: await listInvoices({ customerId: org.customerId }),
  })
}
