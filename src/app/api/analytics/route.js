import { prisma } from '@/lib/prisma'
import { resolveActiveOrg } from '@/lib/resolveActiveOrg'
import { countryName } from '@/lib/countries'

// GET /api/analytics?days=30
//
// The whole workspace, not one link. The dashboard read from mockAnalytics and
// fell to null with mock off, so every card there was empty.
//
// Shapes match what the page already passes down:
//   stats, chartData, cardData.{clicks,sources,geography,devices}, filterOptions
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RANGES = [7, 30, 60, 90, 365]

function ranked(rows, key, extra) {
  const counts = new Map()
  const extras = new Map()
  for (const r of rows) {
    // Nulls are real data: a click we couldn't geolocate still happened.
    // Labelled rather than dropped, or the card totals wouldn't add up to the
    // headline number.
    const label = r[key] || 'Unknown'
    counts.set(label, (counts.get(label) || 0) + 1)
    if (extra && !extras.has(label)) extras.set(label, extra(r))
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value, ...(extras.get(label) || {}) }))
}

function trend(current, previous) {
  // null, not 0%, when there's nothing to compare against. "No change" and
  // "no prior data" are different statements.
  if (!previous) return null
  const pct = Math.round(((current - previous) / previous) * 100)
  return {
    label: `${pct > 0 ? '+' : ''}${pct}%`,
    color: pct >= 0 ? 'var(--success-base)' : 'var(--error-base)',
  }
}

const pad = (n) => String(n).padStart(2, '0')

// One slot per day, in the shape ChartContainer actually reads. An earlier
// version returned { date, clicks, scans }, which shares no keys with what the
// component wants, so the chart drew nothing.
//
// A module-scope helper taking `days` as an argument, NOT inlined in the
// handler: the loop reads `days`, and when this lived at module scope without
// the parameter the build failed on `days is not defined`.
function buildSlots(rows, days, now) {
  const slots = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    const key = d.toISOString().slice(0, 10)
    const dayRows = rows.filter(
      (r) => r.createdAt.toISOString().slice(0, 10) === key
    )

    // The two busiest links, rest collapsed. The tooltip shows a breakdown
    // rather than only a total, and listing every link would be unreadable on
    // a busy day.
    const counts = new Map()
    for (const r of dayRows) {
      const u = r.link?.shortCode || 'Unknown'
      counts.set(u, (counts.get(u) || 0) + 1)
    }
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])
    const topLinks = sorted
      .slice(0, 2)
      .map(([url, clicks]) => ({ url, clicks }))
    const topTotal = topLinks.reduce((sum, l) => sum + l.clicks, 0)

    slots.push({
      key: `d-${key}`,
      label: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`,
      timeLabel: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`,
      date: key,
      totalClicks: dayRows.length,
      topLinks,
      othersClicks: Math.max(0, dayRows.length - topTotal),
      // Empty rather than undefined: the component indexes into this.
      seriesClicks: {},
      isNow: i === 0,
      isFuture: false,
    })
  }
  // Zero-filled across the range on purpose. A chart that only plots days with
  // traffic draws a straight line between two points a fortnight apart and
  // implies steady activity in between.
  return slots
}

export async function GET(request) {
  const { error, organizationId } = await resolveActiveOrg()
  if (error) return error
  if (!organizationId) {
    return Response.json({ error: 'No workspace' }, { status: 403 })
  }

  const url = new URL(request.url)
  const requested = Number(url.searchParams.get('days'))
  const days = RANGES.includes(requested) ? requested : 30

  try {
    const now = new Date()
    const from = new Date(now.getTime() - days * 86400000)
    const prevFrom = new Date(from.getTime() - days * 86400000)

    const [rows, prevCount] = await Promise.all([
      prisma.click.findMany({
        // organizationId, not a list of link ids. Clicks carry the org, so
        // this is one indexed range scan rather than a query per link.
        where: { organizationId, createdAt: { gte: from } },
        select: {
          country: true,
          region: true,
          city: true,
          device: true,
          browser: true,
          referrer: true,
          qrCodeId: true,
          visitorHash: true,
          createdAt: true,
          link: { select: { shortCode: true } },
        },
        take: 50000,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.click.count({
        where: { organizationId, createdAt: { gte: prevFrom, lt: from } },
      }),
    ])

    // Existing rows still hold ISO codes from before the redirect stored
    // names, so they're normalised here too. countryName is idempotent, a
    // name maps to itself, so this is safe on new rows as well.
    for (const r of rows) r.country = countryName(r.country)

    const totalClicks = rows.length
    const totalScans = rows.filter((r) => r.qrCodeId).length
    const uniqueVisitors = new Set(
      rows.filter((r) => r.visitorHash).map((r) => r.visitorHash)
    ).size

    const countries = ranked(rows, 'country')
    const topCountry = countries[0]
      ? {
          name: countries[0].label,
          percentage: Math.round(
            (countries[0].value / (totalClicks || 1)) * 100
          ),
        }
      : null

    // One bucket per day across the range, zero-filled. Filling matters: a
    // chart that only plots days with traffic draws a line between two points
    // a fortnight apart and implies steady activity in between.
    const buckets = new Map()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000)
        .toISOString()
        .slice(0, 10)
      buckets.set(d, { date: d, clicks: 0, scans: 0 })
    }
    for (const r of rows) {
      const d = r.createdAt.toISOString().slice(0, 10)
      const b = buckets.get(d)
      if (!b) continue
      b.clicks += 1
      if (r.qrCodeId) b.scans += 1
    }

    return Response.json({
      days,
      stats: {
        totalClicks,
        clicksTrend: trend(totalClicks, prevCount),
        totalScans,
        scansTrend: null,
        uniqueVisitors,
        visitorsTrend: null,
        topCountry,
      },
      chartData: buildSlots(rows, days, now),
      cardData: {
        clicks: {
          // Which link earned them, which is the comparison the product is
          // built around.
          Links: ranked(
            rows.map((r) => ({ code: r.link?.shortCode || 'Unknown' })),
            'code'
          ),
        },
        sources: {
          Visitors: ranked(
            rows.map((r) => ({ ...r, referrer: r.referrer || 'Direct' })),
            'referrer'
          ),
        },
        geography: {
          Countries: countries,
          Regions: ranked(rows, 'region', (r) => ({ country: r.country })),
          Cities: ranked(rows, 'city', (r) => ({ country: r.country })),
        },
        devices: {
          Type: ranked(rows, 'device'),
          Browser: ranked(rows, 'browser'),
        },
      },
      // The filter pills are built from what's actually present, so filtering
      // can't offer a value with no rows behind it.
      filterOptions: {
        country: countries.map((c) => c.label),
        device: ranked(rows, 'device').map((d) => d.label),
        source: ranked(rows, 'referrer').map((s) => s.label),
      },
    })
  } catch (err) {
    console.error('[GET /api/analytics]', err)
    return Response.json({ error: 'Could not load analytics' }, { status: 500 })
  }
}
