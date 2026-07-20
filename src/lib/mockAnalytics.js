// ─── Mock analytics dataset ───
// Range-aware: getMockAnalytics(range) returns a full dataset scaled
// and shaped for the selected date filter, so the filter dropdown
// visibly changes every number on the page. 'Last 7 days' is the
// baseline matching the Figma reference values.

const HOURLY_CLICKS = [
  2, 1, 1, 0, 0, 1, 3, 6, 10, 14, 18, 16, 12, 15, 22, 26, 20, 24, 32, 28, 19,
  12, 7, 4,
]

// Per-range multipliers and trend overrides — longer ranges mean
// bigger totals; trends vary so switching ranges feels like real,
// different periods rather than the same numbers scaled.
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

export function getMockAnalytics(range = 'Last 7 days') {
  const preset = RANGE_PRESETS[range] || RANGE_PRESETS['Last 7 days']
  const { mult } = preset

  const stats = {
    totalClicks: scale(142, mult),
    clicksTrend: preset.clicksTrend,
    totalScans: scale(68, mult),
    scansTrend: preset.scansTrend,
    uniqueVisitors: scale(72, mult),
    visitorsTrend: preset.visitorsTrend,
    topCountry: { name: 'Norway', percentage: preset.topCountryPct },
  }

  // Chart stays hourly ("today's" shape) regardless of range for now —
  // multi-day chart buckets are already tracked as future work.
  const chartData = HOURLY_CLICKS.map((totalClicks) => ({
    date: 'July 20, 2026',
    totalClicks,
    topLinks:
      totalClicks > 0
        ? [
            {
              url: 'luo.io/swift-otter',
              clicks: Math.round(totalClicks * 0.4),
            },
            { url: 'luo.io/quick-fox', clicks: Math.round(totalClicks * 0.25) },
          ]
        : [],
    othersClicks:
      totalClicks > 0
        ? Math.max(0, totalClicks - Math.round(totalClicks * 0.65))
        : 0,
  }))

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
