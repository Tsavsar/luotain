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

const LINKS = [
  { url: 'luo.io/swift-otter', weight: 15 },
  { url: 'luo.io/quick-fox', weight: 11 },
  { url: 'luo.io/summer-sale', weight: 8 },
  { url: 'luo.io/3xK9fL2', weight: 1 },
]
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

  return events
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

// The comparison period immediately before the selected range — what
// trend badges compare against.
function filterByPriorRange(events, range, now) {
  const spanMs =
    {
      Today: 24 * 3600 * 1000,
      Yesterday: 24 * 3600 * 1000,
      'Last 7 days': 7 * 24 * 3600 * 1000,
      'Last 30 days': 30 * 24 * 3600 * 1000,
      'Last 90 days': 90 * 24 * 3600 * 1000,
      Custom: 14 * 24 * 3600 * 1000,
    }[range] || 7 * 24 * 3600 * 1000

  const rangeEnd =
    range === 'Yesterday' ? new Date(now.getTime() - spanMs) : now
  const priorStart = new Date(rangeEnd.getTime() - spanMs * 2)
  const priorEnd = new Date(rangeEnd.getTime() - spanMs)
  return events.filter(
    (e) => e.timestamp >= priorStart && e.timestamp < priorEnd
  )
}

// filter: { type: 'link'|'country'|'source'|'device', label } | null
export function filterByDimension(events, filter) {
  if (!filter) return events
  const matchers = {
    link: (e) => e.linkUrl === filter.label,
    country: (e) => e.country === filter.label,
    source: (e) => e.source === filter.label,
    device: (e) => e.device === filter.label,
  }
  const matcher = matchers[filter.type]
  return matcher ? events.filter(matcher) : events
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

function aggregateChartSlots(events, range, now) {
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
export function getMockAnalytics(range = 'Last 7 days', filter = null) {
  const now = new Date()
  const pool = getEventPool()

  const rangeEvents = filterByRange(pool, range, now)
  const priorEvents = filterByPriorRange(pool, range, now)

  const filteredRangeEvents = filterByDimension(rangeEvents, filter)
  const filteredPriorEvents = filterByDimension(priorEvents, filter)

  return {
    stats: aggregateStats(filteredRangeEvents, filteredPriorEvents),
    chartData: aggregateChartSlots(filteredRangeEvents, range, now),
    cardData: aggregateCardData(filteredRangeEvents),
  }
}
