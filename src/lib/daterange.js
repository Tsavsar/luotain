// ─── Date ranges ───
// What the analytics picker can be set to, and the window each one covers.
//
// A range is a preset label ('Today', 'Last 7 days', …) or a custom
// { start, end } of YYYY-MM-DD days, both ends included. Every page with the
// picker turns it into a window here, so "Yesterday" can't mean one thing on
// the links list and another on the dashboard.

export const DATE_PRESETS = [
  'Today',
  'Yesterday',
  'Last 7 days',
  'Last 30 days',
  'Last 90 days',
]

const PRESET_DAYS = { 'Last 7 days': 7, 'Last 30 days': 30, 'Last 90 days': 90 }

// The longest custom range, ends included. The API refuses anything over a
// year, so the calendar stops there rather than offering a range that fails.
export const MAX_RANGE_DAYS = 366

export function isCustomRange(range) {
  return typeof range === 'object' && range !== null
}

// Local midnight, `offset` days from `date`'s day. Built from the calendar
// fields rather than by adding 24 hours, which drifts off midnight across a
// clock change.
export function startOfDay(date, offset = 0) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset)
}

const pad = (n) => String(n).padStart(2, '0')

export function dayKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function parseDayKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// The window a range covers: [from, to), both local midnights. "Last 7 days"
// is today and the six days before it, so its chart has seven columns and the
// cards count exactly what those columns hold.
export function rangeWindow(range, now = new Date()) {
  if (isCustomRange(range)) {
    return {
      from: parseDayKey(range.start),
      to: startOfDay(parseDayKey(range.end), 1),
    }
  }
  if (range === 'Today') return { from: startOfDay(now), to: startOfDay(now, 1) }
  if (range === 'Yesterday') {
    return { from: startOfDay(now, -1), to: startOfDay(now) }
  }
  const days = PRESET_DAYS[range] || 7
  return { from: startOfDay(now, 1 - days), to: startOfDay(now, 1) }
}

function viewerZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

// The window as the analytics routes take it. The zone goes along so the
// server can find the viewer's midnights inside the range, and label the
// chart in their hours rather than its own.
export function rangeQuery(range, now = new Date()) {
  const { from, to } = rangeWindow(range, now)
  return new URLSearchParams({
    from: from.toISOString(),
    to: to.toISOString(),
    tz: viewerZone(),
  })
}

// What the picker's trigger says. Presets are their own label; a custom range
// reads "Oct 1 – 15", with years only when it isn't this one.
export function rangeLabel(range, now = new Date()) {
  if (!isCustomRange(range)) return range
  const start = parseDayKey(range.start)
  const end = parseDayKey(range.end)
  const thisYear =
    start.getFullYear() === now.getFullYear() &&
    end.getFullYear() === now.getFullYear()
  const format = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    ...(thisYear ? {} : { year: 'numeric' }),
  })
  return range.start === range.end
    ? format.format(start)
    : format.formatRange(start, end)
}

// The mock generator only knows its own labels, so a custom range is its
// 'Custom'. Demo data, not a window anyone measures.
export function mockRangeLabel(range) {
  return isCustomRange(range) ? 'Custom' : range
}
