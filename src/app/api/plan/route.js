import { prisma } from '@/lib/prisma'
import { resolveActiveOrg } from '@/lib/resolveActiveOrg'
import { PLANS, planFor } from '@/lib/plans'

// GET /api/plan
// The active org's plan plus its current usage, so the UI can show limits and
// progress without each page counting links itself.
export async function GET() {
  const { error, organizationId } = await resolveActiveOrg()
  if (error) return error

  const [org, linkCount] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { plan: true },
    }),
    // Trashed links included, matching what the create endpoint counts
    // against the limit — the number shown has to be the number enforced.
    prisma.link.count({ where: { organizationId } }),
  ])

  const plan = planFor(org?.plan)

  return Response.json({
    plan: plan.id,
    linkCount,
    // Reported here rather than discovered by firing a PATCH that's meant to
    // 404. That probe worked but was a bad idea twice over: it logged a network
    // error in the console on every page load, and it used a write request to
    // answer a read question.
    toggleAvailable: process.env.ALLOW_PLAN_TOGGLE === 'true',
    // Sent alongside rather than expecting the client to import the limits
    // and stay in step. Same source either way (src/lib/plans.js), but this
    // means a stale client can't render a limit the server isn't enforcing.
    limits: {
      maxLinks: plan.maxLinks,
      customSlugs: plan.customSlugs,
      csvExport: plan.csvExport,
      customDomain: plan.customDomain,
    },
  })
}

// PATCH /api/plan  { plan }
//
// A testing switch, not a billing path. Real upgrades have to go through a
// payment provider — this exists so plan-gated UI can be exercised without
// one, which is otherwise impossible to test.
//
// Gated behind ALLOW_PLAN_TOGGLE. Without that variable set the route 404s,
// because an endpoint that grants a paid plan to anyone who asks is exactly
// the kind of thing that gets left switched on. Set it while testing and
// remove it before you take payments.
export async function PATCH(request) {
  if (process.env.ALLOW_PLAN_TOGGLE !== 'true') {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const { error, organizationId } = await resolveActiveOrg()
  if (error) return error

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const next = String(body?.plan || '')
  if (!PLANS[next]) {
    return Response.json(
      {
        error: `Unknown plan. Expected one of: ${Object.keys(PLANS).join(', ')}`,
      },
      { status: 400 }
    )
  }

  // Scoped to the caller's own active org, so this can't be pointed at
  // someone else's even with the flag on.
  const org = await prisma.organization.update({
    where: { id: organizationId },
    data: { plan: next },
    select: { plan: true },
  })

  return Response.json({ plan: org.plan })
}
