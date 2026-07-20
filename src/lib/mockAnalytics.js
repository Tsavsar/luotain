// ─── Mock analytics dataset ───
// Dev-only test data for previewing the populated dashboard state
// before the real click-tracking pipeline exists. Numbers match the
// Figma reference where known (stats card values, Norway/34%); chart
// hours are hand-shaped to a plausible daily wave rather than random
// noise, so it actually looks like real traffic instead of jitter.

export const mockStats = {
  totalClicks: 142,
  clicksTrend: {
    label: '-54%',
    color: 'var(--error-base)',
    dotColor: 'var(--error-base)',
  },
  totalScans: 68,
  scansTrend: {
    label: '-42%',
    color: 'var(--error-base)',
    dotColor: 'var(--error-base)',
  },
  uniqueVisitors: 72,
  visitorsTrend: {
    label: '+12%',
    color: 'var(--success-base)',
    dotColor: 'var(--success-base)',
  },
  topCountry: { name: 'Norway', percentage: 34 },
}

// Rough daily wave: quiet overnight, rising through the morning, a
// midday dip, an afternoon/evening peak — 24 entries, index = hour.
const HOURLY_CLICKS = [
  2, 1, 1, 0, 0, 1, 3, 6, 10, 14, 18, 16, 12, 15, 22, 26, 20, 24, 32, 28, 19,
  12, 7, 4,
]

export const mockChartData = HOURLY_CLICKS.map((totalClicks, hour) => ({
  date: 'July 20, 2026',
  totalClicks,
  topLinks:
    totalClicks > 0
      ? [
          { url: 'luo.io/swift-otter', clicks: Math.round(totalClicks * 0.4) },
          { url: 'luo.io/quick-fox', clicks: Math.round(totalClicks * 0.25) },
        ]
      : [],
  othersClicks:
    totalClicks > 0
      ? Math.max(0, totalClicks - Math.round(totalClicks * 0.65))
      : 0,
}))

// Placeholder for DashboardCards — not Figma-matched, just enough to
// make the toggle show a consistent, non-broken-looking page.
export const mockCardData = {
  clicks: {
    'Short links': [
      { label: 'luo.io/swift-otter', value: 57 },
      { label: 'luo.io/quick-fox', value: 36 },
      { label: 'luo.io/calm-river', value: 21 },
    ],
    'QR codes': [
      { label: 'Store window QR', value: 18 },
      { label: 'Business card QR', value: 9 },
    ],
  },
  sources: {
    Visitors: [
      { label: 'Direct', value: 44 },
      { label: 'Twitter / X', value: 19 },
      { label: 'Google', value: 9 },
    ],
  },
  geography: {
    Countries: [
      { label: 'Norway', value: 34 },
      { label: 'United States', value: 22 },
      { label: 'Germany', value: 11 },
    ],
    Regions: [
      { label: 'Oslo', value: 20 },
      { label: 'Bergen', value: 8 },
    ],
    Cities: [
      { label: 'Oslo', value: 20 },
      { label: 'Berlin', value: 6 },
    ],
  },
  devices: {
    Type: [
      { label: 'Mobile', value: 61 },
      { label: 'Desktop', value: 32 },
      { label: 'Tablet', value: 7 },
    ],
    Browser: [
      { label: 'Chrome', value: 48 },
      { label: 'Safari', value: 29 },
    ],
  },
}
