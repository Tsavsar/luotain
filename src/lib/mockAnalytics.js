// ─── Mock analytics dataset ───
// Range-aware, slot-based. getMockAnalytics(range) returns stats,
// chart slots, and card data shaped for the selected filter:
// - Today: rolling 24-hour window reaching back into yesterday, with
//   "now" anchored at index 15 (~2/3) and future hours empty
// - Yesterday: that full calendar day, hourly
// - 7/30/90 days: daily buckets ending today
// Only called client-side after the mock toggle (post-hydration), so
// new Date() here is safe.

const HOURLY_CLICKS = [
  2, 1, 1, 0, 0, 1, 3, 6, 10, 14, 18, 16, 12, 15, 22, 26, 20, 24, 32, 28, 19,
  12, 7, 4,
]
const DAILY_TOTAL = HOURLY_CLICKS.reduce((a, b) => a + b, 0)

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

const RANGE_PRESETS = {
  Today: {
    mult: 0.18,
    clicksTrend: {
      label: '+8%',
      color: 'var(--success-base)',
      dotColor: 'var(--success-base)',
    },
    scansTrend: {
      label: '+3%',
      color: 'var(--success-base)',
      dotColor: 'var(--success-base)',
    },
    visitorsTrend: {
      label: '+15%',
      color: 'var(--success-base)',
      dotColor: 'var(--success-base)',
    },
    topCountryPct: 41,
  },
  Yesterday: {
    mult: 0.24,
    clicksTrend: {
      label: '-12%',
      color: 'var(--error-base)',
      dotColor: 'var(--error-base)',
    },
    scansTrend: {
      label: '+6%',
      color: 'var(--success-base)',
      dotColor: 'var(--success-base)',
    },
    visitorsTrend: {
      label: '-4%',
      color: 'var(--error-base)',
      dotColor: 'var(--error-base)',
    },
    topCountryPct: 38,
  },
  'Last 7 days': {
    mult: 1,
    clicksTrend: {
      label: '-54%',
      color: 'var(--error-base)',
      dotColor: 'var(--error-base)',
    },
    scansTrend: {
      label: '-42%',
      color: 'var(--error-base)',
      dotColor: 'var(--error-base)',
    },
    visitorsTrend: {
      label: '+12%',
      color: 'var(--success-base)',
      dotColor: 'var(--success-base)',
    },
    topCountryPct: 34,
  },
  'Last 30 days': {
    mult: 4.3,
    clicksTrend: {
      label: '+21%',
      color: 'var(--success-base)',
      dotColor: 'var(--success-base)',
    },
    scansTrend: {
      label: '+9%',
      color: 'var(--success-base)',
      dotColor: 'var(--success-base)',
    },
    visitorsTrend: {
      label: '+18%',
      color: 'var(--success-base)',
      dotColor: 'var(--success-base)',
    },
    topCountryPct: 29,
  },
  'Last 90 days': {
    mult: 12.6,
    clicksTrend: {
      label: '+64%',
      color: 'var(--success-base)',
      dotColor: 'var(--success-base)',
    },
    scansTrend: {
      label: '+37%',
      color: 'var(--success-base)',
      dotColor: 'var(--success-base)',
    },
    visitorsTrend: {
      label: '+52%',
      color: 'var(--success-base)',
      dotColor: 'var(--success-base)',
    },
    topCountryPct: 31,
  },
  Custom: {
    mult: 2.1,
    clicksTrend: {
      label: '+5%',
      color: 'var(--success-base)',
      dotColor: 'var(--success-base)',
    },
    scansTrend: {
      label: '-2%',
      color: 'var(--error-base)',
      dotColor: 'var(--error-base)',
    },
    visitorsTrend: {
      label: '+7%',
      color: 'var(--success-base)',
      dotColor: 'var(--success-base)',
    },
    topCountryPct: 36,
  },
}

const scale = (value, mult) => Math.max(1, Math.round(value * mult))

const pad = (n) => String(n).padStart(2, '0')

function formatDate(d) {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

function slotLinks(total) {
  if (total <= 0) return { topLinks: [], othersClicks: 0 }
  const a = Math.round(total * 0.4)
  const b = Math.round(total * 0.25)
  return {
    topLinks: [
      { url: 'luo.io/swift-otter', clicks: a },
      { url: 'luo.io/quick-fox', clicks: b },
    ],
    othersClicks: Math.max(0, total - a - b),
  }
}

// Rolling hourly window: 24 slots, now at index 15 (~2/3), reaching
// back into yesterday evening when the day is young.
function buildTodaySlots(now) {
  const NOW_INDEX = 15
  const slots = []
  for (let i = 0; i < 24; i++) {
    const offset = i - NOW_INDEX // hours relative to now
    const slotDate = new Date(now.getTime() + offset * 3600 * 1000)
    const hod = slotDate.getHours()
    const isFuture = offset > 0
    const isNow = offset === 0
    const totalClicks = isFuture ? 0 : HOURLY_CLICKS[hod]

    slots.push({
      key: `h-${i}`,
      label: isNow
        ? `${pad(now.getHours())}:${pad(now.getMinutes())}`
        : `${pad(hod)}:00`,
      timeLabel: `${pad(hod)}:00`,
      date: formatDate(slotDate),
      totalClicks,
      ...slotLinks(totalClicks),
      isNow,
      isFuture,
    })
  }
  return slots
}

function buildYesterdaySlots(now) {
  const yesterday = new Date(now.getTime() - 24 * 3600 * 1000)
  return HOURLY_CLICKS.map((totalClicks, hour) => ({
    key: `y-${hour}`,
    label: `${pad(hour)}:00`,
    timeLabel: `${pad(hour)}:00`,
    date: formatDate(yesterday),
    totalClicks,
    ...slotLinks(totalClicks),
    isNow: false,
    isFuture: false,
  }))
}

// Daily buckets ending today — deterministic wave so it looks like
// real traffic patterns rather than random noise.
function buildDailySlots(now, days, mult) {
  const slots = []
  for (let i = 0; i < days; i++) {
    const offset = i - (days - 1) // days relative to today
    const slotDate = new Date(now.getTime() + offset * 24 * 3600 * 1000)
    const wave = 0.7 + 0.3 * Math.sin(i * 0.9) + 0.15 * Math.sin(i * 2.3)
    const totalClicks = Math.max(
      1,
      Math.round(DAILY_TOTAL * wave * (mult / days) * 3)
    )
    const isNow = i === days - 1

    slots.push({
      key: `d-${i}`,
      label: `${MONTHS[slotDate.getMonth()]} ${slotDate.getDate()}`,
      timeLabel: null,
      date: formatDate(slotDate),
      totalClicks,
      ...slotLinks(totalClicks),
      isNow,
      isFuture: false,
    })
  }
  return slots
}

export function getMockAnalytics(range = 'Last 7 days') {
  const preset = RANGE_PRESETS[range] || RANGE_PRESETS['Last 7 days']
  const { mult } = preset
  const now = new Date()

  const stats = {
    totalClicks: scale(142, mult),
    clicksTrend: preset.clicksTrend,
    totalScans: scale(68, mult),
    scansTrend: preset.scansTrend,
    uniqueVisitors: scale(72, mult),
    visitorsTrend: preset.visitorsTrend,
    topCountry: { name: 'Norway', percentage: preset.topCountryPct },
  }

  let chartData
  switch (range) {
    case 'Today':
      chartData = buildTodaySlots(now)
      break
    case 'Yesterday':
      chartData = buildYesterdaySlots(now)
      break
    case 'Last 30 days':
      chartData = buildDailySlots(now, 30, mult)
      break
    case 'Last 90 days':
      chartData = buildDailySlots(now, 90, mult)
      break
    case 'Custom':
      chartData = buildDailySlots(now, 14, mult)
      break
    case 'Last 7 days':
    default:
      chartData = buildDailySlots(now, 7, mult)
      break
  }

  const cardData = {
    clicks: {
      'Short links': [
        { label: 'luo.io/swift-otter', value: scale(15, mult) },
        { label: 'luo.io/quick-fox', value: scale(11, mult) },
        { label: 'luo.io/summer-sale', value: scale(8, mult) },
        { label: 'luo.io/3xK9fL2', value: scale(1, mult) },
      ],
      'QR codes': [
        { label: 'Store window QR', value: scale(18, mult) },
        { label: 'Business card QR', value: scale(9, mult) },
      ],
    },
    sources: {
      Visitors: [
        { label: 't.co', value: scale(15, mult) },
        { label: 'i.instagram.com', value: scale(11, mult) },
        { label: 'linkedin.com', value: scale(8, mult) },
        { label: 'direct', value: scale(1, mult) },
      ],
    },
    geography: {
      Countries: [
        { label: 'Norway', value: scale(15, mult) },
        { label: 'United States', value: scale(11, mult) },
        { label: 'United Kingdom', value: scale(8, mult) },
        { label: 'Singapore', value: scale(1, mult) },
      ],
      Regions: [
        { label: 'Oslo', value: scale(20, mult), country: 'Norway' },
        { label: 'Bergen', value: scale(8, mult), country: 'Norway' },
      ],
      Cities: [
        { label: 'Oslo', value: scale(20, mult), country: 'Norway' },
        { label: 'Berlin', value: scale(6, mult), country: 'Germany' },
      ],
    },
    devices: {
      Type: [
        { label: 'Desktop', value: scale(15, mult) },
        { label: 'Mobile', value: scale(11, mult) },
        { label: 'Tablet', value: scale(8, mult) },
      ],
      Browser: [
        { label: 'Chrome', value: scale(48, mult) },
        { label: 'Safari', value: scale(29, mult) },
      ],
    },
  }

  return { stats, chartData, cardData }
}
