import { prisma } from '@/lib/prisma'
import { resolveActiveOrg } from '@/lib/resolveActiveOrg'
import { countryName } from '@/lib/countries'
import { buildSlots } from '@/lib/chartslots'

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

export async function GET(request) {
  const { error, organizationId } = await resolveActiveOrg()
  if (error) return error
  if (!organizationId) {
    return Response.json({ error: 'No workspace' }, { status: 403 })
  }

  const url = new URL(request.url)
  const requested = Number(url.searchParams.get('days'))
  const days = RANGES.includes(requested) ? requested : 30

  // Filters arrive as repeated params: ?f=country:Norway&f=device:Mobile
  //
  // The endpoint ignored them entirely, so clicking a filter pill changed the
  // URL state in the page and nothing else — the numbers never moved.
  //
  // Applied AFTER fetching rather than in the where clause, on purpose: the
  // cards have to keep showing every option so you can still see what you're
  // filtering away, and a filtered query would hide the rest.
  const filters = url.searchParams
    .getAll('f')
    .map((f) => {
      const i = f.indexOf(':')
      return i < 0 ? null : { type: f.slice(0, i), label: f.slice(i + 1) }
    })
    .filter(Boolean)

  // Same type ORs together, different types AND. Picking Norway and Ghana
  // means "either", picking Norway and Mobile means "both" — which is what
  // someone expects from two different questions.
  function matches(r) {
    const byType = new Map()
    for (const f of filters) {
      if (!byType.has(f.type)) byType.set(f.type, [])
      byType.get(f.type).push(f.label)
    }
    for (const [type, labels] of byType) {
      const value =
        type === 'country'
          ? r.country
          : type === 'device'
            ? r.device
            : type === 'source'
              ? r.referrer || 'Direct'
              : type === 'link'
                ? r.link?.shortCode
                : null
      if (!labels.includes(value)) return false
    }
    return true
  }

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

    // Normalised first, so a country filter compares names to names.
    const all = rows
    const shown = filters.length ? all.filter(matches) : all

    // Selected link filters double as the chart's comparison lines, one curve
    // per link. Same list, read as "which curves" rather than "which rows".
    const compareLinks = filters
      .filter((f) => f.type === 'link')
      .map((f) => f.label)

    const totalClicks = shown.length
    const totalScans = shown.filter((r) => r.qrCodeId).length
    const uniqueVisitors = new Set(
      shown.filter((r) => r.visitorHash).map((r) => r.visitorHash)
    ).size

    const countries = ranked(shown, 'country')
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
      chartData: buildSlots(shown, days, now, compareLinks),
      // The chart only switches to multi-line mode at 2+, and that threshold
      // lives in the component rather than here.
      chartCompareSeries: compareLinks.map((code) => ({
        id: code,
        label: code,
      })),
      cardData: {
        clicks: {
          // The column names have to match the Card's columnOptions exactly —
          // 'Short links' and 'QR codes'. I'd returned one column called
          // 'Links', which matched neither, so the card rendered empty.
          //
          // Split by whether the click arrived through a code: the same link
          // appears in both columns with different numbers, which is the
          // comparison the product is built around.
          'Short links': ranked(
            shown
              .filter((r) => !r.qrCodeId)
              .map((r) => ({ code: r.link?.shortCode || 'Unknown' })),
            'code'
          ),
          'QR codes': ranked(
            shown
              .filter((r) => r.qrCodeId)
              .map((r) => ({ code: r.link?.shortCode || 'Unknown' })),
            'code'
          ),
        },
        sources: {
          Visitors: ranked(
            shown.map((r) => ({ ...r, referrer: r.referrer || 'Direct' })),
            'referrer'
          ),
        },
        geography: {
          Countries: countries,
          Regions: ranked(shown, 'region', (r) => ({ country: r.country })),
          Cities: ranked(shown, 'city', (r) => ({ country: r.country })),
        },
        devices: {
          Type: ranked(shown, 'device'),
          Browser: ranked(shown, 'browser'),
        },
      },
      // Built from the UNFILTERED rows on purpose. Narrowing the options to
      // what survives the current filter would mean selecting Norway removes
      // every other country from the list, and you could never add a second
      // one or see what you'd excluded.
      filterOptions: {
        country: ranked(all, 'country').map((c) => c.label),
        device: ranked(all, 'device').map((d) => d.label),
        source: ranked(
          all.map((r) => ({ ...r, referrer: r.referrer || 'Direct' })),
          'referrer'
        ).map((s) => s.label),
      },
    })
  } catch (err) {
    console.error('[GET /api/analytics]', err)
    return Response.json({ error: 'Could not load analytics' }, { status: 500 })
  }
}
