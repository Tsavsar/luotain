import { prisma } from '@/lib/prisma'
import { resolveActiveOrg } from '@/lib/resolveActiveOrg'
import { countryName } from '@/lib/countries'
import { buildSlots } from '@/lib/chartslots'
import { parseWindow } from '@/lib/analyticswindow'
import { matcher, parseFilters } from '@/lib/clickfilters'

// GET /api/analytics?from=<ISO>&to=<ISO>&tz=<zone>   (or the legacy ?days=30)
//
// The whole workspace, not one link. The dashboard read from mockAnalytics and
// fell to null with mock off, so every card there was empty.
//
// Shapes match what the page already passes down:
//   stats, chartData, cardData.{clicks,sources,geography,devices}, filterOptions
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
  const win = parseWindow(url.searchParams)
  if (win.error) return win.error

  // The endpoint ignored filters entirely at first, so clicking a filter pill
  // changed the URL state in the page and nothing else — the numbers never
  // moved. The rules are in src/lib/clickfilters.js.
  const filters = parseFilters(url.searchParams)
  const matches = matcher(filters)

  const prevWhere = {
    organizationId,
    createdAt: { gte: win.prevFrom, lt: win.prevTo },
  }

  // ?summary=1: the headline figures alone, counted in SQL. For the links
  // page, which shows clicks and visitors for the range and has no use for
  // 50,000 rows pulled into memory to count them. Filters don't apply: that
  // page has none.
  if (url.searchParams.get('summary')) {
    try {
      const [[current], prevCount] = await Promise.all([
        prisma.$queryRaw`
          SELECT COUNT(*)::int AS clicks,
                 COUNT(DISTINCT "visitorHash")::int AS visitors
          FROM "Click"
          WHERE "organizationId" = ${organizationId}
            AND "createdAt" >= ${win.from}
            AND "createdAt" < ${win.to}
        `,
        prisma.click.count({ where: prevWhere }),
      ])
      return Response.json({
        range: {
          from: win.from,
          to: win.to,
          tz: win.tz,
          granularity: win.granularity,
        },
        stats: {
          totalClicks: current.clicks,
          clicksTrend: trend(current.clicks, prevCount),
          // COUNT(DISTINCT) skips nulls, the same rule as the full path:
          // clicks from before the hash existed aren't one shared visitor.
          uniqueVisitors: current.visitors,
          visitorsTrend: null,
        },
      })
    } catch (err) {
      console.error('[GET /api/analytics?summary]', err)
      return Response.json(
        { error: 'Could not load analytics' },
        { status: 500 }
      )
    }
  }

  try {
    const [rows, prev] = await Promise.all([
      prisma.click.findMany({
        // organizationId, not a list of link ids. Clicks carry the org, so
        // this is one indexed range scan rather than a query per link.
        where: { organizationId, createdAt: { gte: win.from, lt: win.to } },
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
      // With a filter on, the comparison has to be filtered the same way. It
      // was always the whole workspace's count, so narrowing to one country
      // measured that country against everything and read as a steep drop.
      // Filters run in JS (see `matches`), so that takes rows, not a count.
      filters.length
        ? prisma.click.findMany({
            where: prevWhere,
            select: {
              country: true,
              region: true,
              city: true,
              device: true,
              browser: true,
              referrer: true,
              link: { select: { shortCode: true } },
            },
            take: 50000,
          })
        : prisma.click.count({ where: prevWhere }),
    ])

    // Existing rows still hold ISO codes from before the redirect stored
    // names, so they're normalised here too. countryName is idempotent, a
    // name maps to itself, so this is safe on new rows as well.
    for (const r of rows) r.country = countryName(r.country)

    let prevCount = prev
    if (Array.isArray(prev)) {
      for (const r of prev) r.country = countryName(r.country)
      prevCount = prev.filter(matches).length
    }

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

    return Response.json({
      // The window as the server read it, so a client can check it got the
      // range it asked for.
      range: {
        from: win.from,
        to: win.to,
        tz: win.tz,
        granularity: win.granularity,
      },
      stats: {
        totalClicks,
        clicksTrend: trend(totalClicks, prevCount),
        totalScans,
        scansTrend: null,
        uniqueVisitors,
        visitorsTrend: null,
        topCountry,
      },
      chartData: buildSlots(shown, win, compareLinks),
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
