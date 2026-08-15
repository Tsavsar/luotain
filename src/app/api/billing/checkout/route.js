import { prisma } from '@/lib/prisma'
import { resolveActiveOrg } from '@/lib/resolveActiveOrg'
import { createCheckout } from '@/lib/billing'
import { PLANS, PLAN_ORDER } from '@/lib/plans'

// POST /api/billing/checkout  { planId, annual }
export async function POST(request) {
  const { error, organizationId, userId } = await resolveActiveOrg()
  if (error) return error

  // Only an owner. Billing is the one area where an admin shouldn't be able to
  // commit the workspace to a recurring charge.
  const membership = await prisma.membership.findFirst({
    where: { organizationId, userId },
    select: { role: true, user: { select: { email: true } } },
  })
  if (membership?.role !== 'OWNER') {
    return Response.json(
      { error: 'Only the workspace owner can change the plan' },
      { status: 403 }
    )
  }

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const planId = String(body?.planId || '')
  if (!PLANS[planId]) {
    return Response.json({ error: 'Unknown plan' }, { status: 400 })
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { plan: true, customerId: true },
  })

  if (planId === org?.plan) {
    return Response.json(
      { error: "You're already on that plan" },
      { status: 400 }
    )
  }

  // Downgrades don't go through checkout — there's nothing to pay for, and
  // sending someone to a payment form to spend less is nonsense. They go to the
  // portal, where Polar handles the cancellation and the period end.
  const goingDown =
    PLAN_ORDER.indexOf(planId) < PLAN_ORDER.indexOf(org?.plan || 'FREE')
  if (planId === 'FREE' || goingDown) {
    return Response.json(
      {
        error: 'Downgrades are handled in the billing portal',
        usePortal: true,
      },
      { status: 400 }
    )
  }

  const result = await createCheckout({
    planId,
    annual: Boolean(body?.annual),
    email: membership?.user?.email,
    organizationId,
    userId,
  })

  if (result.error) {
    return Response.json({ error: result.error }, { status: 500 })
  }
  return Response.json({ url: result.url })
}
