import { PLANS } from '@/lib/plans'
import { SHORT_DOMAIN } from '@/lib/shortlink'
// ─── Mock analytics data layer ───
//
// Architecture note: this models a pool of individual click/scan
// EVENTS (mirroring what a real `Click` row will look like once the
// tracking pipeline exists — link, country, source, device,
// timestamp), rather than pre-baked totals. Stats/chart/cards are
// computed by pure aggregation functions that take a list of events
// in and return the shape the UI expects.
//
// This is what makes filtering (and the eventual swap to real data)
// cheap: filtering is just `events.filter(...)` before aggregating —
// conceptually identical to a real backend's `WHERE x GROUP BY y`.
// When the real API exists, only getAnalytics's body changes (fetch
// instead of generate); aggregateStats/aggregateChartSlots/
// aggregateCardData and every component that calls this stay as-is.

// Every link that exists in the click pool, live or trashed. TRASHED_URLS
// below splits them: getMockLinksTable serves the ones NOT in it,
// getMockTrash serves the ones that are. A link can't be both, which is
// exactly what was broken before — swift-otter and quick-fox appeared in
// the live table AND the trash, so opening either resolved to the live
// copy and the deleted state could never render.
//
// The last two carry low weights deliberately: they exist mainly to be
// trashed, and heavier weights would noticeably shift every total on
// the analytics pages.
const LINKS = [
  { url: 'luot.link/swift-otter', weight: 15 },
  { url: 'luot.link/quick-fox', weight: 11 },
  { url: 'luot.link/summer-sale', weight: 8 },
  { url: 'luot.link/3xK9fL2', weight: 1 },
  { url: 'luot.link/clever-crow', weight: 6 },
  { url: 'luot.link/beta-launch', weight: 5 },
]
// Destination + creation date for each link above — the links table
// needs both, and neither is something the click-event pool tracks
// (a link's destination and the day it was made don't change based
// on which date range you're viewing), so this lives as its own
// small fixed table instead of being derived from events.
const LINK_METADATA = {
  'luot.link/swift-otter': {
    destination: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    createdAt: '2026-07-03',
  },
  'luot.link/quick-fox': {
    destination: 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ',
    createdAt: '2025-08-12',
  },
  'luot.link/summer-sale': {
    destination: 'https://luotain.app/campaigns/summer-sale',
    createdAt: '2026-06-01',
  },
  'luot.link/3xK9fL2': {
    destination: 'https://example.com/private-promo',
    createdAt: '2026-05-15',
  },
  'luot.link/clever-crow': {
    destination: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
    createdAt: '2026-04-18',
  },
  'luot.link/beta-launch': {
    destination: 'https://luotain.app/beta',
    createdAt: '2026-03-22',
  },
}
const QR_LINKS = [
  { url: 'Store window QR', weight: 18 },
  { url: 'Business card QR', weight: 9 },
]
const COUNTRIES = [
  { name: 'Norway', weight: 15 },
  { name: 'United States', weight: 11 },
  { name: 'United Kingdom', weight: 8 },
  { name: 'Singapore', weight: 1 },
]
const REGIONS = [
  { name: 'Oslo', country: 'Norway', weight: 20 },
  { name: 'Bergen', country: 'Norway', weight: 8 },
]
const CITIES = [
  { name: 'Oslo', country: 'Norway', weight: 20 },
  { name: 'Berlin', country: 'Germany', weight: 6 },
]
const SOURCES = [
  { domain: 't.co', weight: 15 },
  { domain: 'i.instagram.com', weight: 11 },
  { domain: 'linkedin.com', weight: 8 },
  { domain: 'direct', weight: 1 },
]
const DEVICE_TYPES = [
  { name: 'Desktop', weight: 15 },
  { name: 'Mobile', weight: 11 },
  { name: 'Tablet', weight: 8 },
]
const BROWSERS = [
  { name: 'Chrome', weight: 48 },
  { name: 'Safari', weight: 29 },
]

// Rough daily shape (hour -> relative weight) — quiet overnight,
// rising through the morning, midday dip, afternoon/evening peak.
// Used to place event timestamps realistically within a day.
const HOURLY_WEIGHTS = [
  2, 1, 1, 0.5, 0.5, 1, 3, 6, 10, 14, 18, 16, 12, 15, 22, 26, 20, 24, 32, 28,
  19, 12, 7, 4,
]

// ─── Seeded RNG (mulberry32) ───
// Deterministic so the mock dataset is stable across re-renders and
// reloads within a session, instead of jittering on every render.
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function weightedPick(rng, items) {
  const total = items.reduce((sum, i) => sum + i.weight, 0)
  let r = rng() * total
  for (const item of items) {
    r -= item.weight
    if (r <= 0) return item
  }
  return items[items.length - 1]
}

// ─── Event pool generation ───
// One flat array of individual events spanning the last 91 days
// (today + 90 back), enough to serve every date-range filter and
// still leave a full prior period for trend comparison.
let cachedPool = null

function generateEventPool() {
  const rng = mulberry32(42) // fixed seed = stable dataset
  const now = new Date()
  const events = []
  const DAYS_BACK = 97 // 90-day range + a prior 7-day trend window of headroom

  for (let dayOffset = DAYS_BACK; dayOffset >= 0; dayOffset--) {
    const dayDate = new Date(now.getTime() - dayOffset * 24 * 3600 * 1000)
    // Recent days get more activity than older ones — a growing
    // product's traffic shape, not flat noise
    const recencyMultiplier = 0.4 + 0.6 * (1 - dayOffset / DAYS_BACK)

    for (let hour = 0; hour < 24; hour++) {
      const hourWeight = HOURLY_WEIGHTS[hour]
      const expectedCount = hourWeight * recencyMultiplier * 0.8
      const count = Math.round(expectedCount * (0.7 + rng() * 0.6))

      for (let i = 0; i < count; i++) {
        const isQr = rng() < 0.32 // ~32% of events are scans, rest clicks
        const link = weightedPick(rng, isQr ? QR_LINKS : LINKS)
        const country = weightedPick(rng, COUNTRIES)
        const region = weightedPick(rng, REGIONS)
        const city = weightedPick(rng, CITIES)
        const source = weightedPick(rng, SOURCES)
        const deviceType = weightedPick(rng, DEVICE_TYPES)
        const browser = weightedPick(rng, BROWSERS)
        const minute = Math.floor(rng() * 60)

        const timestamp = new Date(dayDate)
        timestamp.setHours(hour, minute, 0, 0)

        events.push({
          id: `${dayOffset}-${hour}-${i}`,
          type: isQr ? 'scan' : 'click',
          linkUrl: link.url,
          country: country.name,
          region: region.name,
          regionCountry: region.country,
          city: city.name,
          cityCountry: city.country,
          source: source.domain,
          device: deviceType.name,
          browser: browser.name,
          timestamp,
        })
      }
    }
  }

  // A deleted link can't keep accruing clicks after it was deleted.
  // The generator above doesn't know about deletion, so without this a
  // link trashed 28 days ago would still show traffic from yesterday —
  // and its archived detail page would render a chart running right up
  // to today, which is nonsense.
  return events.filter((e) => {
    const cutoff = TRASHED_AT.get(e.linkUrl)
    return !cutoff || e.timestamp <= cutoff
  })
}

function getEventPool() {
  if (!cachedPool) cachedPool = generateEventPool()
  return cachedPool
}

// ─── Filtering ───
// Composable: date-range filter and dimension filter both just
// narrow the events array before aggregation runs.

function filterByRange(events, range, now) {
  const startOfDay = (d) => {
    const x = new Date(d)
    x.setHours(0, 0, 0, 0)
    return x
  }
  const today0 = startOfDay(now)

  switch (range) {
    case 'Today':
      // Rolling 24h window ending now, not calendar-day — matches
      // the chart's rolling-window behavior
      return events.filter(
        (e) =>
          e.timestamp > new Date(now.getTime() - 24 * 3600 * 1000) &&
          e.timestamp <= now
      )
    case 'Yesterday': {
      const yStart = new Date(today0.getTime() - 24 * 3600 * 1000)
      return events.filter((e) => e.timestamp >= yStart && e.timestamp < today0)
    }
    case 'Last 30 days':
      return events.filter(
        (e) => e.timestamp > new Date(now.getTime() - 30 * 24 * 3600 * 1000)
      )
    case 'Last 90 days':
      return events.filter(
        (e) => e.timestamp > new Date(now.getTime() - 90 * 24 * 3600 * 1000)
      )
    case 'Custom':
      return events.filter(
        (e) => e.timestamp > new Date(now.getTime() - 14 * 24 * 3600 * 1000)
      )
    case 'Last 7 days':
    default:
      return events.filter(
        (e) => e.timestamp > new Date(now.getTime() - 7 * 24 * 3600 * 1000)
      )
  }
}

// Shared by filterByPriorRange and getMockLinksStats — both need to
// know how many ms a given range label actually spans.
const RANGE_SPAN_MS = {
  Today: 24 * 3600 * 1000,
  Yesterday: 24 * 3600 * 1000,
  'Last 7 days': 7 * 24 * 3600 * 1000,
  'Last 30 days': 30 * 24 * 3600 * 1000,
  'Last 90 days': 90 * 24 * 3600 * 1000,
  Custom: 14 * 24 * 3600 * 1000,
}

// The comparison period immediately before the selected range — what
// trend badges compare against.
function filterByPriorRange(events, range, now) {
  const spanMs = RANGE_SPAN_MS[range] || 7 * 24 * 3600 * 1000

  const rangeEnd =
    range === 'Yesterday' ? new Date(now.getTime() - spanMs) : now
  const priorStart = new Date(rangeEnd.getTime() - spanMs * 2)
  const priorEnd = new Date(rangeEnd.getTime() - spanMs)
  return events.filter(
    (e) => e.timestamp >= priorStart && e.timestamp < priorEnd
  )
}

// filters: array of { type: 'link'|'country'|'source'|'device', label }
// Stackable with faceted semantics — the standard e-commerce-filter
// pattern: OR *within* a type (selecting two links means "either
// link" — a comparison), AND *across* types (a link filter plus a
// country filter means "this link AND this country" together).
const DIMENSION_VALUE = {
  link: (e) => e.linkUrl,
  country: (e) => e.country,
  source: (e) => e.source,
  device: (e) => e.device,
}

export function filterByDimension(events, filters) {
  if (!filters || filters.length === 0) return events

  const byType = {}
  filters.forEach((f) => {
    if (!byType[f.type]) byType[f.type] = []
    byType[f.type].push(f.label)
  })

  return events.filter((e) =>
    Object.entries(byType).every(([type, labels]) => {
      const getValue = DIMENSION_VALUE[type]
      return getValue ? labels.includes(getValue(e)) : true
    })
  )
}

// ─── Aggregation ───
// Pure functions: events in, UI-shaped data out. This is the part
// that gets replaced by server-side GROUP BY queries later — the
// call sites (getAnalytics, and everything downstream) don't change.

function pctChange(current, prior) {
  if (prior === 0)
    return current > 0 ? { label: '+100%', positive: true } : null
  const change = ((current - prior) / prior) * 100
  const rounded = Math.round(change)
  return {
    label: `${rounded >= 0 ? '+' : ''}${rounded}%`,
    positive: rounded >= 0,
  }
}

function trendObject(current, prior) {
  const pc = pctChange(current, prior)
  if (!pc) return null
  return {
    label: pc.label,
    color: pc.positive ? 'var(--success-base)' : 'var(--error-base)',
    dotColor: pc.positive ? 'var(--success-base)' : 'var(--error-base)',
  }
}

function aggregateStats(events, priorEvents) {
  const clicks = events.filter((e) => e.type === 'click')
  const scans = events.filter((e) => e.type === 'scan')
  const priorClicks = priorEvents.filter((e) => e.type === 'click')
  const priorScans = priorEvents.filter((e) => e.type === 'scan')

  // "Unique visitors" approximated as unique link+country+device
  // combinations — a reasonable proxy without real visitor IDs
  const visitorKey = (e) => `${e.linkUrl}|${e.country}|${e.device}`
  const uniqueVisitors = new Set(events.map(visitorKey)).size
  const priorUniqueVisitors = new Set(priorEvents.map(visitorKey)).size

  const countryCounts = {}
  events.forEach((e) => {
    countryCounts[e.country] = (countryCounts[e.country] || 0) + 1
  })
  const topCountryEntry = Object.entries(countryCounts).sort(
    (a, b) => b[1] - a[1]
  )[0]
  const topCountry = topCountryEntry
    ? {
        name: topCountryEntry[0],
        percentage: Math.round(
          (topCountryEntry[1] / Math.max(events.length, 1)) * 100
        ),
      }
    : null

  return {
    totalClicks: clicks.length,
    clicksTrend: trendObject(clicks.length, priorClicks.length),
    totalScans: scans.length,
    scansTrend: trendObject(scans.length, priorScans.length),
    uniqueVisitors,
    visitorsTrend: trendObject(uniqueVisitors, priorUniqueVisitors),
    topCountry,
  }
}

function topLinksBreakdown(events) {
  const counts = {}
  events.forEach((e) => {
    counts[e.linkUrl] = (counts[e.linkUrl] || 0) + 1
  })
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const top = sorted.slice(0, 2).map(([url, clicks]) => ({ url, clicks }))
  const topTotal = top.reduce((sum, l) => sum + l.clicks, 0)
  const othersClicks = events.length - topTotal
  return { topLinks: top, othersClicks: Math.max(0, othersClicks) }
}

// Per-slot click counts for each link being compared, so the chart
// can draw one curve per link instead of only the combined total.
// Keyed by link URL — that's also what ChartContainer expects as
// each series' `id`. Runs on the same already-filtered event subset
// as everything else in the slot, so an active country/source/device
// filter narrows these curves the same way it narrows totalClicks.
function seriesClicksForSlot(slotEvents, compareLinks) {
  if (!compareLinks || compareLinks.length === 0) return undefined
  const counts = {}
  compareLinks.forEach((url) => {
    counts[url] = 0
  })
  slotEvents.forEach((e) => {
    if (e.linkUrl in counts) counts[e.linkUrl] += 1
  })
  return counts
}

const pad = (n) => String(n).padStart(2, '0')
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]
const formatDate = (d) =>
  `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`

function aggregateChartSlots(events, range, now, compareLinks) {
  if (range === 'Today') {
    const NOW_INDEX = 15
    const slots = []
    for (let i = 0; i < 24; i++) {
      const offset = i - NOW_INDEX
      const slotDate = new Date(now.getTime() + offset * 3600 * 1000)
      const isFuture = offset > 0
      const isNow = offset === 0
      const hourEvents = isFuture
        ? []
        : events.filter(
            (e) =>
              e.timestamp.getHours() === slotDate.getHours() &&
              e.timestamp.toDateString() === slotDate.toDateString()
          )
      const { topLinks, othersClicks } = topLinksBreakdown(hourEvents)

      slots.push({
        key: `h-${i}`,
        label: isNow
          ? `${pad(now.getHours())}:${pad(now.getMinutes())}`
          : `${pad(slotDate.getHours())}:00`,
        timeLabel: `${pad(slotDate.getHours())}:00`,
        date: formatDate(slotDate),
        totalClicks: hourEvents.length,
        topLinks,
        othersClicks,
        seriesClicks: seriesClicksForSlot(hourEvents, compareLinks),
        isNow,
        isFuture,
      })
    }
    return slots
  }

  if (range === 'Yesterday') {
    const yesterday = new Date(now.getTime() - 24 * 3600 * 1000)
    const slots = []
    for (let hour = 0; hour < 24; hour++) {
      const hourEvents = events.filter((e) => e.timestamp.getHours() === hour)
      const { topLinks, othersClicks } = topLinksBreakdown(hourEvents)
      slots.push({
        key: `y-${hour}`,
        label: `${pad(hour)}:00`,
        timeLabel: `${pad(hour)}:00`,
        date: formatDate(yesterday),
        totalClicks: hourEvents.length,
        topLinks,
        othersClicks,
        seriesClicks: seriesClicksForSlot(hourEvents, compareLinks),
        isNow: false,
        isFuture: false,
      })
    }
    return slots
  }

  // Daily buckets — 7/30/90/Custom
  const days =
    { 'Last 30 days': 30, 'Last 90 days': 90, Custom: 14 }[range] || 7
  const slots = []
  for (let i = 0; i < days; i++) {
    const offset = i - (days - 1)
    const slotDate = new Date(now.getTime() + offset * 24 * 3600 * 1000)
    const dayEvents = events.filter(
      (e) => e.timestamp.toDateString() === slotDate.toDateString()
    )
    const { topLinks, othersClicks } = topLinksBreakdown(dayEvents)

    slots.push({
      key: `d-${i}`,
      label: `${MONTHS[slotDate.getMonth()]} ${slotDate.getDate()}`,
      timeLabel: null,
      date: formatDate(slotDate),
      totalClicks: dayEvents.length,
      topLinks,
      othersClicks,
      seriesClicks: seriesClicksForSlot(dayEvents, compareLinks),
      isNow: i === days - 1,
      isFuture: false,
    })
  }
  return slots
}

function rankedRows(events, keyFn, extraFn) {
  const counts = {}
  const extras = {}
  events.forEach((e) => {
    const key = keyFn(e)
    counts[key] = (counts[key] || 0) + 1
    if (extraFn && !extras[key]) extras[key] = extraFn(e)
  })
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value, ...(extras[label] || {}) }))
}

function aggregateCardData(events) {
  const clicks = events.filter((e) => e.type === 'click')
  const scans = events.filter((e) => e.type === 'scan')

  return {
    clicks: {
      'Short links': rankedRows(clicks, (e) => e.linkUrl),
      'QR codes': rankedRows(scans, (e) => e.linkUrl),
    },
    sources: {
      Visitors: rankedRows(events, (e) => e.source),
    },
    geography: {
      Countries: rankedRows(events, (e) => e.country),
      Regions: rankedRows(
        events,
        (e) => e.region,
        (e) => ({ country: e.regionCountry })
      ),
      Cities: rankedRows(
        events,
        (e) => e.city,
        (e) => ({ country: e.cityCountry })
      ),
    },
    devices: {
      Type: rankedRows(events, (e) => e.device),
      Browser: rankedRows(events, (e) => e.browser),
    },
  }
}

// ─── Public API ───
// This is the one function every component calls. Swapping mock for
// real data later means replacing this function's body with a fetch
// — everything that calls it (page components, filter state) doesn't
// need to change, since the return shape is identical either way.
export function getMockAnalytics(
  range = 'Last 7 days',
  filters = [],
  sessionDeleted = []
) {
  const now = new Date()
  // Deleted links leave the pool before anything else happens, so every
  // number downstream — stats, chart, cards — is computed without them.
  const pool = visibleEvents(getEventPool(), filters, sessionDeleted)

  const rangeEvents = filterByRange(pool, range, now)
  const priorEvents = filterByPriorRange(pool, range, now)

  const filteredRangeEvents = filterByDimension(rangeEvents, filters)
  const filteredPriorEvents = filterByDimension(priorEvents, filters)

  // Links currently selected as filters double as the chart's
  // comparison lines — same list, just read as "which curves" rather
  // than "which events." ChartContainer only turns on multi-line
  // mode at 2+, but that threshold lives there, not here.
  const compareSeries = filters
    .filter((f) => f.type === 'link')
    .map((f) => ({ id: f.label, label: f.label }))
  const compareLinks = compareSeries.map((s) => s.id)

  return {
    stats: aggregateStats(filteredRangeEvents, filteredPriorEvents),
    chartData: aggregateChartSlots(
      filteredRangeEvents,
      range,
      now,
      compareLinks
    ),
    // Ready to pass straight to <ChartContainer compareSeries={...} />
    chartCompareSeries: compareSeries,
    cardData: aggregateCardData(filteredRangeEvents),
    // Full universe of pickable options for this range — deliberately
    // NOT dimension-filtered, so the "+" picker can always show every
    // link/country/etc. that exists, including ones not currently
    // selected. Using cardData here instead would mean, once you've
    // filtered to one link, every OTHER link has already been
    // filtered out of the data the picker reads from.
    filterOptions: aggregateCardData(rangeEvents),
  }
}

// ─── Links page ───
// Same event pool and filters as everything above, just aggregated
// differently: one row per link (not per time slot), and folded in
// with the fixed destination/createdAt metadata since those aren't
// things a click event carries.

export function getMockLinksTable(
  range = 'Last 7 days',
  filters = [],
  sessionDeleted = []
) {
  const now = new Date()
  const pool = getEventPool()
  const rangeEvents = filterByRange(pool, range, now)
  const filteredEvents = filterByDimension(rangeEvents, filters)
  const clicksOnly = filteredEvents.filter((e) => e.type === 'click')

  // Trashed links are excluded — they belong to getMockTrash, and a link
  // showing up in both lists is what stopped the deleted state working.
  // sessionDeleted covers anything deleted since the page loaded.
  const hidden = hiddenUrls(sessionDeleted)
  return LINKS.filter((link) => !hidden.has(link.url)).map((link) => {
    const meta = LINK_METADATA[link.url] || {}
    return {
      id: link.url,
      shortUrl: link.url,
      destination: meta.destination || '',
      clicks: clicksOnly.filter((e) => e.linkUrl === link.url).length,
      createdAt: meta.createdAt || now.toISOString(),
    }
  })
}

export function getMockLinksStats(
  range = 'Last 7 days',
  filters = [],
  sessionDeleted = []
) {
  const now = new Date()
  const pool = visibleEvents(getEventPool(), filters, sessionDeleted)
  const rangeEvents = filterByRange(pool, range, now)
  const priorEvents = filterByPriorRange(pool, range, now)
  const filteredRangeEvents = filterByDimension(rangeEvents, filters)
  const filteredPriorEvents = filterByDimension(priorEvents, filters)

  const clicks = filteredRangeEvents.filter((e) => e.type === 'click')
  const priorClicks = filteredPriorEvents.filter((e) => e.type === 'click')

  const visitorKey = (e) => `${e.linkUrl}|${e.country}|${e.device}`
  const uniqueVisitors = new Set(filteredRangeEvents.map(visitorKey)).size
  const priorUniqueVisitors = new Set(filteredPriorEvents.map(visitorKey)).size

  // How many of the known links were created within the selected
  // window — reuses the same range-to-milliseconds table
  // filterByPriorRange already relies on, rather than a second copy.
  const spanMs = RANGE_SPAN_MS[range] || RANGE_SPAN_MS['Last 7 days']
  const rangeStart = new Date(now.getTime() - spanMs)
  // Deleted links don't count as created either — the same rule as
  // above, applied to the count rather than the events.
  const hidden = hiddenUrls(sessionDeleted)
  const liveMeta = Object.entries(LINK_METADATA)
    .filter(([url]) => !hidden.has(url))
    .map(([, m]) => m)
  const linksCreated = liveMeta.filter(
    (m) => new Date(m.createdAt) >= rangeStart
  ).length
  const priorRangeStart = new Date(rangeStart.getTime() - spanMs)
  const priorLinksCreated = liveMeta.filter((m) => {
    const created = new Date(m.createdAt)
    return created >= priorRangeStart && created < rangeStart
  }).length

  return {
    totalClicks: clicks.length,
    clicksTrend: trendObject(clicks.length, priorClicks.length),
    uniqueVisitors,
    visitorsTrend: trendObject(uniqueVisitors, priorUniqueVisitors),
    linksCreated,
    linksTrend: trendObject(linksCreated, priorLinksCreated),
  }
}

// ─── Trash ───
// Trashed links are real links from the pool above, not a separate
// hardcoded list. That matters for two reasons: nothing appears in both
// the live table and the trash (a link can't be both), and a deleted
// link still has its click history, so its detail page shows real
// numbers greyed out rather than an empty shell — which is what the
// design for that state actually shows.
//
// Clicks are counted over the whole pool rather than a date range: a
// deleted link's total is frozen at what it was, not something you
// re-filter.
const TRASHED = [
  { url: 'luot.link/swift-otter', deletedDaysAgo: 28 },
  { url: 'luot.link/clever-crow', deletedDaysAgo: 21 },
  { url: 'luot.link/beta-launch', deletedDaysAgo: 12 },
]

const TRASHED_URLS = new Set(TRASHED.map((t) => t.url))

// url -> the Date it was deleted. Read by generateEventPool to cut a
// trashed link's events off at its deletion. Declared here rather than
// at the top of the file because it derives from TRASHED; that's safe
// because the pool is built lazily on first call, by which point the
// whole module has evaluated.
const TRASHED_AT = new Map(
  TRASHED.map((t) => [
    t.url,
    new Date(Date.now() - t.deletedDaysAgo * 24 * 3600 * 1000),
  ])
)

// ─── What a deleted link does to the numbers ───
// Deleting a link takes its history out of the totals: no link, nothing
// to report. So a trashed link's events are dropped from every
// aggregate — the analytics dashboard, the links page stats bar,
// links-created counts.
//
// The one exception is asking about that link directly. A link filter
// naming a trashed url means someone is looking at its own detail page,
// where the whole point is seeing what it did before it was deleted.
// Without this exception that page would grey out an empty shell.
//
// `sessionDeleted` is whatever has been deleted during the current mock
// session, on top of the baseline TRASHED list.
function hiddenUrls(sessionDeleted = []) {
  return new Set([...TRASHED_URLS, ...sessionDeleted])
}

function visibleEvents(events, filters = [], sessionDeleted = []) {
  const hidden = hiddenUrls(sessionDeleted)
  if (hidden.size === 0) return events
  const askedForDirectly = new Set(
    (filters || []).filter((f) => f.type === 'link').map((f) => f.label)
  )
  return events.filter(
    (e) => !hidden.has(e.linkUrl) || askedForDirectly.has(e.linkUrl)
  )
}

// ─── Domains ───
// Test data for the create form's domain picker. `verified` mirrors the
// design's own copy ("Only verified domains show up here"), so an
// unverified one is included specifically to prove the picker filters
// rather than just listing everything it's handed.
//
// Temporary: real domains belong in a Domain table, which is what the
// schema change alongside this adds.
const DOMAINS = [
  { hostname: 'luot.link', verified: true, isDefault: true },
  { hostname: 'go.acme.com', verified: true, isDefault: false },
  { hostname: 'links.notionhq.com', verified: true, isDefault: false },
  { hostname: 'l.shatermt.com', verified: true, isDefault: false },
  { hostname: 'pending.example.com', verified: false, isDefault: false },
]

// ─── QR codes ───
// Attached to links from the pool above rather than invented, so a mock QR
// always points at a link that exists — and two of them share a link, which is
// the case the whole design exists for: separate placements tracking
// independently.
//
// Scans are a share of that link's clicks rather than a made-up number, so the
// totals on this page can't contradict the ones on the links page.
// Ten codes across all five links, which is enough to exercise the things this
// page is actually for:
//
//   summer-sale has four   — the comparison the separate slug exists for, four
//                            placements on one link with wildly different pull
//   nine point at live links, one at a trashed one — beta-launch, clever-crow
//     and swift-otter are ALL in the mock trash, so spreading codes across them
//     made most of the page render as dead links. One is enough to show that
//     state; more just makes the page look broken.
//   every pattern appears  — square, rounded, dots, classy, diamond, cross,
//                            so the renderer's six shapes all get seen
//   scan shares vary a lot — 0.04 to 0.61, because a page where everything
//                            performs similarly hides whether the numbers work
const QR_CODES = [
  // summer-sale: four placements, the spread of a real campaign.
  {
    id: 'qr-store-window',
    label: 'Store window',
    shortCode: 'sw-summer',
    linkUrl: 'luot.link/summer-sale',
    color: '#fa7319',
    markerColor: '#fa7319',
    pattern: 'rounded',
    branding: true,
    scanShare: 0.42,
  },
  {
    id: 'qr-business-card',
    label: 'Business card',
    shortCode: 'bc-summer',
    linkUrl: 'luot.link/summer-sale',
    color: '#000000',
    markerColor: '#000000',
    pattern: 'square',
    branding: true,
    scanShare: 0.09,
  },
  {
    id: 'qr-receipt-footer',
    label: 'Receipt footer',
    shortCode: 'rf-summer',
    linkUrl: 'luot.link/summer-sale',
    color: '#000000',
    markerColor: '#fa7319',
    pattern: 'classy',
    branding: false,
    scanShare: 0.61,
  },
  {
    id: 'qr-tote-bag',
    label: 'Tote bag print',
    shortCode: 'tb-summer',
    linkUrl: 'luot.link/summer-sale',
    color: '#1fc16b',
    markerColor: '#1fc16b',
    pattern: 'diamond',
    branding: true,
    scanShare: 0.04,
  },

  // quick-fox: two, one branded and one not.
  {
    id: 'qr-conference',
    label: 'Conference booth',
    shortCode: 'cb-quick',
    linkUrl: 'luot.link/quick-fox',
    color: '#7d52f4',
    markerColor: '#47c2ff',
    pattern: 'dots',
    branding: true,
    scanShare: 0.31,
  },
  {
    id: 'qr-lanyard',
    label: 'Lanyard back',
    shortCode: 'lb-quick',
    linkUrl: 'luot.link/quick-fox',
    color: '#335cff',
    markerColor: '#335cff',
    pattern: 'cross',
    branding: false,
    scanShare: 0.12,
  },

  {
    id: 'qr-poster',
    label: 'Office poster',
    shortCode: 'op-3xk9',
    linkUrl: 'luot.link/3xK9fL2',
    color: '#22d3bb',
    markerColor: '#000000',
    pattern: 'rounded',
    branding: true,
    scanShare: 0.38,
  },
  {
    id: 'qr-slide',
    label: 'Deck end slide',
    shortCode: 'ds-3xk9',
    linkUrl: 'luot.link/3xK9fL2',
    color: '#000000',
    markerColor: '#000000',
    pattern: 'dots',
    branding: true,
    scanShare: 0.07,
  },

  {
    id: 'qr-packaging',
    label: 'Packaging insert',
    shortCode: 'pi-quick',
    linkUrl: 'luot.link/quick-fox',
    color: '#f6b51e',
    markerColor: '#fa7319',
    pattern: 'classy',
    branding: true,
    scanShare: 0.24,
  },

  // swift-otter is in the trash, so this one renders the "Link deleted" state
  // on load rather than needing something deleted first.
  {
    id: 'qr-otter-flyer',
    label: 'Event flyer',
    shortCode: 'ef-otter',
    linkUrl: 'luot.link/swift-otter',
    color: '#fb4ba3',
    markerColor: '#fb4ba3',
    pattern: 'diamond',
    branding: true,
    scanShare: 0.19,
  },
]

export function getMockQrCodes(sessionDeleted = []) {
  const clicksOnly = getEventPool().filter((e) => e.type === 'click')
  const hidden = hiddenUrls(sessionDeleted)

  return QR_CODES.map((q) => {
    const meta = LINK_METADATA[q.linkUrl] || {}
    const linkClicks = clicksOnly.filter((e) => e.linkUrl === q.linkUrl).length
    return {
      id: q.id,
      label: q.label,
      shortCode: q.shortCode,
      scanUrl: `${SHORT_DOMAIN}/${q.shortCode}`,
      color: q.color,
      markerColor: q.markerColor,
      pattern: q.pattern,
      branding: q.branding,
      scans: Math.round(linkClicks * q.scanShare),
      createdAt: meta.createdAt || new Date().toISOString(),
      link: {
        id: q.linkUrl,
        shortUrl: q.linkUrl,
        destination: meta.destination || '',
        // A QR outlives the link it points at — it's printed on things. The
        // page shows that state rather than hiding the code.
        deleted: hidden.has(q.linkUrl),
      },
    }
  })
}

export function getMockDomains({ verifiedOnly = true } = {}) {
  return DOMAINS.filter((d) => (verifiedOnly ? d.verified : true)).map((d) => ({
    ...d,
  }))
}

export function getMockTrash(sessionDeleted = []) {
  const now = new Date()
  const clicksOnly = getEventPool().filter((e) => e.type === 'click')

  // Baseline trash, plus anything deleted during this session. Session
  // deletions are dated now, so they sort to the top of the list, which
  // is where you'd look for something you just deleted.
  const all = [
    ...TRASHED,
    ...sessionDeleted
      .filter((url) => !TRASHED_URLS.has(url))
      .map((url) => ({ url, deletedDaysAgo: 0 })),
  ]

  return all.map((item) => {
    const meta = LINK_METADATA[item.url] || {}
    return {
      id: item.url,
      shortUrl: item.url,
      destination: meta.destination || '',
      clicks: clicksOnly.filter((e) => e.linkUrl === item.url).length,
      createdAt: meta.createdAt || now.toISOString(),
      deletedAt: new Date(
        now.getTime() - item.deletedDaysAgo * 24 * 3600 * 1000
      ).toISOString(),
    }
  })
}

// ─── Billing ───
// What each tier's billing page looks like, so the paid states can be seen
// without a real subscription. A live workspace has no card and no invoices
// until a provider is connected, which means Starter and Pro were unreachable
// designs — this is the only way to look at them.
export function getMockBilling(planId = 'FREE') {
  const plan = PLANS[planId] || PLANS.FREE

  if (plan.id === 'FREE') {
    return {
      role: 'OWNER',
      plan: { id: plan.id, name: plan.name, maxLinks: plan.maxLinks },
      linkCount: 4,
      periodEnd: null,
      interval: null,
      cancelAtPeriodEnd: false,
      // No card on Free, which is the state the design shows — "No payment
      // method added" with an Add link. Someone who downgrades keeps their card
      // on file, but that's a different state and mocking it here would hide
      // the empty one.
      card: null,
      invoices: [],
    }
  }

  // Renews a month out, so the date reads as a real upcoming renewal rather
  // than a fixed day that drifts into the past.
  const periodEnd = new Date()
  periodEnd.setMonth(periodEnd.getMonth() + 1)

  const amount = plan.priceMonthly
  const invoices = [0, 1, 2].map((i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    return {
      id: `mock-inv-${i}`,
      date: date.toISOString(),
      amount,
      currency: 'US$',
      status: 'paid',
      // mock one has nothing to link to, and the missing url is what tells the
      // page to generate a receipt in the browser instead.
      url: null,
    }
  })

  return {
    role: 'OWNER',
    plan: { id: plan.id, name: plan.name, maxLinks: plan.maxLinks },
    // Near the Starter limit on purpose, so the usage line has something to
    // say; Pro is unlimited and hides it anyway.
    linkCount: plan.maxLinks == null ? 138 : Math.max(1, plan.maxLinks - 8),
    periodEnd: periodEnd.toISOString(),
    interval: 'month',
    cancelAtPeriodEnd: false,
    card: { brand: 'Visa', last4: '6767' },
    invoices,
  }
}
