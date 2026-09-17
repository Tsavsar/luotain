// ─── Chart slots ───
// One slot per day in the shape ChartContainer reads.
//
// Shared by /api/analytics and /api/links/[id]/analytics rather than copied.
// The component reads specific keys — totalClicks, topLinks, othersClicks,
// seriesClicks — and an earlier version returned { date, clicks, scans },
// which shares none of them, so the chart drew nothing. One copy means that
// can only be wrong in one place.

const pad = (n) => String(n).padStart(2, '0')

// One slot per day, in the shape ChartContainer actually reads. An earlier
// version returned { date, clicks, scans }, which shares no keys with what the
// component wants, so the chart drew nothing.
//
// A module-scope helper taking `days` as an argument, NOT inlined in the
// handler: the loop reads `days`, and when this lived at module scope without
// the parameter the build failed on `days is not defined`.
export function buildSlots(rows, days, now) {
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
