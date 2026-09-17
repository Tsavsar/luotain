import { prisma } from '@/lib/prisma'
import { resolveActiveOrg } from '@/lib/resolveActiveOrg'

// GET /api/links/[id]/analytics?days=30
//
// Real numbers for one link. The page was reading from mockAnalytics and
// returning null whenever mock mode was off, so with it off every card was
// empty. There was no analytics endpoint at all.
//
// Everything here aggregates the Click table. Shapes match what the page
// already expects, so nothing downstream changes:
//
//   stats.totalClicks / totalScans / uniqueVisitors / topCountry
//   cardData.sources.Visitors
//   cardData.geography.{Countries,Regions,Cities}
//   cardData.devices.{Type,Browser}
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RANGES = [7, 30, 60, 90, 365]

// Rows as { label, value }, highest first. Same shape as the mock's
// rankedRows, so the Card component needs no changes.
function ranked(rows, key, extra) {
  const counts = new Map()
  const extras = new Map()
  for (const r of rows) {
    // Nulls are real data: a click with no country is a click we couldn't
    // geolocate, not one that didn't happen. Labelled rather than dropped, or
    // the totals in the cards wouldn't add up to the headline number.
    const label = r[key] || 'Unknown'
    counts.set(label, (counts.get(label) || 0) + 1)
    if (extra && !extras.has(label)) extras.set(label, extra(r))
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value, ...(extras.get(label) || {}) }))
}

// Percentage change against the preceding window of equal length. Returns null
// rather than 0 when there's no prior data: "no change" and "nothing to
// compare against" are different statements and the card shouldn't imply the
// first when it means the second.
function trend(current, previous) {
  if (!previous) return null
  const pct = Math.round(((current - previous) / previous) * 100)
  return {
    label: `${pct > 0 ? '+' : ''}${pct}%`,
    color: pct >= 0 ? 'var(--success-base)' : 'var(--error-base)',
  }
}

export async function GET(request, { params }) {
  const { id } = await params

  // resolveActiveOrg reads the session itself and hands back a ready Response
  // for the unauthenticated case, which is how every other route here does it.
  const { error, organizationId } = await resolveActiveOrg()
  if (error) return error
  if (!organizationId) {
    return Response.json({ error: 'No workspace' }, { status: 403 })
  }

  const url = new URL(request.url)
  const requested = Number(url.searchParams.get('days'))
  const days = RANGES.includes(requested) ? requested : 30

  try {
    // Scoped by organizationId as well as id. Without it, anyone signed in
    // could read any link's analytics by guessing an id.
    const link = await prisma.link.findFirst({
      where: { id, organizationId },
      select: { id: true },
    })
    if (!link) {
      return Response.json({ error: 'Link not found' }, { status: 404 })
    }

    const now = new Date()
    const from = new Date(now.getTime() - days * 86400000)
    // The window immediately before this one, same length, for the trend.
    const prevFrom = new Date(from.getTime() - days * 86400000)

    const [rows, prevCount] = await Promise.all([
      prisma.click.findMany({
        where: { linkId: id, createdAt: { gte: from } },
        select: {
          country: true,
          region: true,
          city: true,
          device: true,
          browser: true,
          referrer: true,
          qrCodeId: true,
          createdAt: true,
        },
        // Capped. A link with a million clicks would otherwise pull all of
        // them into memory to count them. At 50k the aggregate is
        // representative and the request still returns.
        take: 50000,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.click.count({
        where: { linkId: id, createdAt: { gte: prevFrom, lt: from } },
      }),
    ])

    const totalClicks = rows.length
    // A scan is a click that arrived through a QR code. It's a subset of
    // clicks, not a separate event, which is why totalClicks includes them.
    const totalScans = rows.filter((r) => r.qrCodeId).length

    const countries = ranked(rows, 'country')
    const topCountry = countries[0]
      ? {
          name: countries[0].label,
          percentage: Math.round(
            (countries[0].value / (totalClicks || 1)) * 100
          ),
        }
      : null

    return Response.json({
      days,
      stats: {
        totalClicks,
        clicksTrend: trend(totalClicks, prevCount),
        totalScans,
        // No prior scan count queried separately, so no trend for it rather
        // than a trend borrowed from clicks.
        scansTrend: null,
        // Not computable. The Click table stores no visitor identifier — no
        // IP hash, no cookie — so there is nothing to count distinctly.
        // Returning null rather than reusing totalClicks, which would read as
        // every click being a different person.
        uniqueVisitors: null,
        visitorsTrend: null,
        topCountry,
      },
      cardData: {
        sources: {
          // referrer is null for direct traffic, which is a meaningful label
          // rather than missing data.
          Visitors: ranked(
            rows.map((r) => ({ ...r, referrer: r.referrer || 'Direct' })),
            'referrer'
          ),
        },
        geography: {
          Countries: countries,
          // Regions and cities carry their country, which is what the Card
          // uses to draw the right flag beside a region name.
          Regions: ranked(rows, 'region', (r) => ({ country: r.country })),
          Cities: ranked(rows, 'city', (r) => ({ country: r.country })),
        },
        devices: {
          Type: ranked(rows, 'device'),
          Browser: ranked(rows, 'browser'),
        },
      },
    })
  } catch (err) {
    console.error('[GET /api/links/[id]/analytics]', err)
    return Response.json({ error: 'Could not load analytics' }, { status: 500 })
  }
}
