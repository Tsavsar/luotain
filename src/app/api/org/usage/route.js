import { prisma } from '@/lib/prisma'
import { resolveActiveOrg } from '@/lib/resolveActiveOrg'
import { PLANS } from '@/lib/plans'

// GET /api/org/usage
//
// The four metrics plus a year of daily event counts for the heatmap.
export async function GET() {
  const { error, organizationId } = await resolveActiveOrg()
  if (error) return error

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { plan: true },
  })
  if (!org) {
    return Response.json({ error: 'Workspace not found' }, { status: 404 })
  }

  // 52 weeks back, aligned to the start of a week so the heatmap's first column
  // is a full one. Without the alignment the grid starts mid-week and every
  // column after it is offset by the same amount.
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - 364)
  start.setDate(start.getDate() - start.getDay())

  const [linkCount, qrCount, totalEvents, days] = await Promise.all([
    // Trashed links still count against the limit — the plan check on create
    // does the same, so the number here has to agree with the one that blocks
    // you.
    prisma.link.count({ where: { organizationId } }),
    prisma.qrCode.count({ where: { link: { organizationId } } }),
    prisma.click.count({ where: { organizationId } }),
    // Grouped in SQL rather than pulling every row and counting in JS. A busy
    // workspace has hundreds of thousands of clicks and this endpoint would be
    // shipping all of them over the wire to produce 365 numbers.
    prisma.$queryRaw`
      SELECT DATE("createdAt") AS day, COUNT(*)::int AS count
      FROM "Click"
      WHERE "organizationId" = ${organizationId}
        AND "createdAt" >= ${start}
      GROUP BY DATE("createdAt")
      ORDER BY day ASC
    `,
  ])

  // Keyed by ISO date so the client can fill the grid without searching a list
  // for every one of 365 cells.
  const byDay = {}
  let busiest = null
  for (const row of days) {
    const key =
      row.day instanceof Date
        ? row.day.toISOString().slice(0, 10)
        : String(row.day).slice(0, 10)
    const count = Number(row.count)
    byDay[key] = count
    if (!busiest || count > busiest.count) busiest = { date: key, count }
  }

  const plan = PLANS[org.plan] || PLANS.FREE

  return Response.json({
    // maxLinks, not linkLimit — null means unlimited, which the client has to
    // distinguish from zero.
    plan: { id: plan.id, name: plan.name, maxLinks: plan.maxLinks },
    links: linkCount,
    qrCodes: qrCount,
    events: totalEvents,
    busiestDay: busiest,
    // The window the grid covers, so the client doesn't recompute it and risk
    // disagreeing with what was actually queried.
    start: start.toISOString().slice(0, 10),
    byDay,
  })
}
