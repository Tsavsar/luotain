import { windowSlots } from './analyticswindow'

// ─── Chart slots ───
// One slot per hour, day or week of the window, in the shape ChartContainer
// reads.
//
// Shared by /api/analytics and /api/links/[id]/analytics rather than copied.
// The component reads specific keys — totalClicks, topLinks, othersClicks,
// seriesClicks — and an earlier version returned { date, clicks, scans },
// which shares none of them, so the chart drew nothing. One copy means that
// can only be wrong in one place.

// Per-link counts for one slot. Every selected link gets a key even at zero,
// so a quiet day draws the line down to the axis rather than breaking it.
//
// undefined when nothing's being compared, matching the mock: the chart reads
// that as "single series" and draws the total instead.
function seriesFor(slotRows, compareLinks) {
  if (!compareLinks.length) return undefined
  const counts = {}
  for (const code of compareLinks) counts[code] = 0
  for (const r of slotRows) {
    const code = r.link?.shortCode
    if (code in counts) counts[code] += 1
  }
  return counts
}

// The slot an instant falls in, or -1 outside the window. A binary search over
// the starts: rows come in the tens of thousands and a year has 53 weeks or a
// quarter 92 days, so comparing every row to every slot adds up.
function slotIndex(slots, t) {
  if (!slots.length || t < slots[0].start || t >= slots.at(-1).end) return -1
  let lo = 0
  let hi = slots.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (slots[mid].start <= t) lo = mid
    else hi = mid - 1
  }
  return lo
}

// compareLinks: the shortCodes currently selected as link filters. They
// double as the chart's comparison lines — one curve per link — so each slot
// needs a count per link, not just a total.
//
// Zero-filled across the window on purpose. A chart that only plots days with
// traffic draws a straight line between two points a fortnight apart and
// implies steady activity in between.
export function buildSlots(rows, win, compareLinks = []) {
  const slots = windowSlots(win)
  const buckets = slots.map(() => [])
  for (const r of rows) {
    const i = slotIndex(slots, r.createdAt.getTime())
    if (i !== -1) buckets[i].push(r)
  }

  return slots.map((slot, i) => {
    const slotRows = buckets[i]

    // The two busiest links are named and the rest fold into "others", so the
    // tooltip stays a few lines long rather than unreadable on a busy day.
    const counts = new Map()
    for (const r of slotRows) {
      const u = r.link?.shortCode || 'Unknown'
      counts.set(u, (counts.get(u) || 0) + 1)
    }
    const topLinks = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([url, clicks]) => ({ url, clicks }))
    const topTotal = topLinks.reduce((sum, l) => sum + l.clicks, 0)

    return {
      key: slot.key,
      label: slot.label,
      timeLabel: slot.timeLabel,
      date: slot.date,
      totalClicks: slotRows.length,
      topLinks,
      othersClicks: Math.max(0, slotRows.length - topTotal),
      seriesClicks: seriesFor(slotRows, compareLinks),
      isNow: slot.isNow,
      isFuture: slot.isFuture,
    }
  })
}
