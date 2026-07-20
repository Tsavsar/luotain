// ─── Mock analytics dataset ───
// Dev-only test data for previewing the populated dashboard state
// before the real click-tracking pipeline exists. Values mirror the
// Figma reference designs where they're specified.

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

// Card rows — labels in Sources are DOMAINS (they drive the favicon
// lookup); labels in Geography are country names (they drive the flag
// lookup from /public/assets/flags/).
export const mockCardData = {
  clicks: {
    'Short links': [
      { label: 'luo.io/swift-otter', value: 15 },
      { label: 'luo.io/quick-fox', value: 11 },
      { label: 'luo.io/summer-sale', value: 8 },
      { label: 'luo.io/3xK9fL2', value: 1 },
    ],
    'QR codes': [
      { label: 'Store window QR', value: 18 },
      { label: 'Business card QR', value: 9 },
    ],
  },
  sources: {
    Visitors: [
      { label: 't.co', value: 15 },
      { label: 'i.instagram.com', value: 11 },
      { label: 'linkedin.com', value: 8 },
      { label: 'direct', value: 1 },
    ],
  },
  geography: {
    Countries: [
      { label: 'Norway', value: 15 },
      { label: 'United States', value: 11 },
      { label: 'United Kingdom', value: 8 },
      { label: 'Singapore', value: 1 },
    ],
    Regions: [
      { label: 'Oslo', value: 20, country: 'Norway' },
      { label: 'Bergen', value: 8, country: 'Norway' },
    ],
    Cities: [
      { label: 'Oslo', value: 20, country: 'Norway' },
      { label: 'Berlin', value: 6, country: 'Germany' },
    ],
  },
  devices: {
    Type: [
      { label: 'Desktop', value: 15 },
      { label: 'Mobile', value: 11 },
      { label: 'Tablet', value: 8 },
    ],
    Browser: [
      { label: 'Chrome', value: 48 },
      { label: 'Safari', value: 29 },
    ],
  },
}
