// ─── Analytics windows ───
// The span of time an analytics request covers, and the chart slots inside it.
//
// The picker speaks in the viewer's days. "Today" is their midnight to their
// next one, not the server's, so the page sends the window as two instants
// plus its IANA time zone, and everything here that has to know where a day
// starts asks that zone. Shared by both analytics routes and the CSV export,
// so the cards, the chart, the comparison and the file can't disagree about
// which clicks they mean.

const HOUR = 3600 * 1000
const DAY = 24 * HOUR

// A year of days, leap years included, plus an hour for a window that crosses
// a clock change.
const MAX_SPAN = 366 * DAY + HOUR
// Nothing in Luotain is older than this, so an earlier start is a typo.
const EARLIEST = Date.UTC(2020, 0, 1)
// "Today" ends at the viewer's next midnight, which can be most of a day ahead
// of the server's clock. Anything further out than this is a broken request.
const LATEST_AHEAD = 2 * DAY

// The ranges the routes took before windows existed. Still accepted, read as
// "the last N days in UTC, today included", so anything calling with ?days
// keeps working.
const LEGACY_DAYS = [7, 30, 60, 90, 365]

function invalid(message) {
  return Response.json({ error: message }, { status: 400 })
}

// The zone if the runtime knows it. A zone it doesn't know only costs the
// labels their local reading, which isn't worth refusing the request over.
function zoneOrUtc(tz) {
  if (!tz) return 'UTC'
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return tz
  } catch {
    return 'UTC'
  }
}

// GET params -> the window, or { error } holding a ready 400.
//
//   ?from=<ISO>&to=<ISO>&tz=<IANA zone>   [from, to), read in tz
//   ?days=30                              the legacy form
export function parseWindow(params, now = new Date()) {
  const fromParam = params.get('from')
  const toParam = params.get('to')

  let from, to, tz
  if (fromParam || toParam) {
    from = new Date(fromParam)
    to = new Date(toParam)
    if (!fromParam || !toParam || isNaN(from) || isNaN(to)) {
      return { error: invalid('from and to have to be dates') }
    }
    if (from >= to) return { error: invalid('from has to come before to') }
    if (to - from > MAX_SPAN) {
      return { error: invalid('A range can cover a year at most') }
    }
    if (from < EARLIEST || to - now > LATEST_AHEAD) {
      return { error: invalid('That range is out of bounds') }
    }
    tz = zoneOrUtc(params.get('tz'))
  } else {
    const requested = Number(params.get('days'))
    const days = LEGACY_DAYS.includes(requested) ? requested : 30
    const today = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    )
    from = new Date(today - (days - 1) * DAY)
    to = new Date(today + DAY)
    tz = 'UTC'
  }

  const span = to - from
  // The comparison is the same stretch one window earlier, cut off where this
  // one has got to. Today at 14:00 compares against yesterday until 14:00, not
  // all of yesterday: half a day measured against a whole one reads as a drop
  // every morning.
  const elapsed = Math.max(0, Math.min(to, now) - from)

  return {
    from,
    to,
    tz,
    now,
    prevFrom: new Date(from - span),
    prevTo: new Date(from - span + elapsed),
    // Hours for a day or two, days up to a quarter, weeks past that. A year of
    // daily columns is a chart you scroll for a minute to read.
    granularity:
      span <= 2 * DAY + HOUR ? 'hour' : span <= 92 * DAY + HOUR ? 'day' : 'week',
  }
}

// Building a formatter is the slow part and a request makes hundreds of calls
// into the same two or three, so they're kept.
const formatters = new Map()
function formatter(tz, options) {
  const key = `${tz}|${JSON.stringify(options)}`
  let f = formatters.get(key)
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone: tz, ...options })
    formatters.set(key, f)
  }
  return f
}

// h23, not hour12: false. The latter writes midnight as 24 on some runtimes.
const WALL = {
  hourCycle: 'h23',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
}

// What a clock in `tz` reads at instant `t`, as numbers.
function wallClock(t, tz) {
  const out = {}
  for (const { type, value } of formatter(tz, WALL).formatToParts(t)) {
    if (type !== 'literal') out[type] = Number(value)
  }
  return out
}

function offsetAt(t, tz) {
  const w = wallClock(t, tz)
  const wall = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second)
  return wall - Math.floor(t / 1000) * 1000
}

// The instant local midnight starts a calendar day in `tz`. Two passes, because
// the offset at the first guess can differ from the one at the answer when a
// clock change sits between them.
function midnightIn(year, month, day, tz) {
  const wall = Date.UTC(year, month - 1, day)
  const guess = wall - offsetAt(wall, tz)
  return wall - offsetAt(guess, tz)
}

const pad = (n) => String(n).padStart(2, '0')
const isoDay = (w) => `${w.year}-${pad(w.month)}-${pad(w.day)}`

// The window cut into chart slots: each slot's instants, and how it reads in
// the viewer's zone. Counting the clicks into them is chartslots.js's job.
export function windowSlots(win) {
  const { from, to, tz, granularity } = win
  const now = +win.now
  const starts = [+from]

  if (granularity === 'hour') {
    // Plain hours from the start. A clock change shows up as a repeated or
    // skipped label, which is what the viewer's clock actually did.
    for (let t = +from + HOUR; t < +to; t += HOUR) starts.push(t)
  } else {
    // Local midnights by calendar arithmetic, not by adding 24 hours. A day
    // with a clock change in it is 23 or 25 hours long, and stepping by 24
    // would sit an hour off midnight for the rest of the range.
    const step = granularity === 'week' ? 7 : 1
    const first = wallClock(+from, tz)
    for (let i = step; ; i += step) {
      const d = new Date(Date.UTC(first.year, first.month - 1, first.day + i))
      const t = midnightIn(
        d.getUTCFullYear(),
        d.getUTCMonth() + 1,
        d.getUTCDate(),
        tz
      )
      if (t >= +to) break
      starts.push(t)
    }
  }

  const dayName = formatter(tz, { month: 'short', day: 'numeric' })
  const fullDate = formatter(tz, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return starts.map((start, i) => {
    const end = starts[i + 1] ?? +to
    const w = wallClock(start, tz)
    const isNow = start <= now && now < end
    const base = {
      start,
      end,
      label: dayName.format(start),
      timeLabel: null,
      date: fullDate.format(start),
      isNow,
      isFuture: start > now,
    }

    if (granularity === 'hour') {
      const hour = `${pad(w.hour)}:00`
      // The live hour is labelled with the time, the way the chart's
      // empty state labels its now line.
      const n = isNow ? wallClock(now, tz) : null
      return {
        ...base,
        key: `h-${start}`,
        label: n ? `${pad(n.hour)}:${pad(n.minute)}` : hour,
        timeLabel: hour,
      }
    }
    if (granularity === 'day') return { ...base, key: `d-${isoDay(w)}` }
    // A week names its first day on the axis and its whole span in the
    // tooltip, so "Oct 6" can't be read as one day's total.
    return {
      ...base,
      key: `w-${isoDay(w)}`,
      date: fullDate.formatRange(start, end - 1),
    }
  })
}

// The first and last calendar day the window covers, in its zone, as
// YYYY-MM-DD. What the export names its file after.
export function windowDays(win) {
  return {
    first: isoDay(wallClock(+win.from, win.tz)),
    last: isoDay(wallClock(+win.to - 1, win.tz)),
  }
}

// "2026-11-03 14:05:09" on the window's clock. The space rather than ISO's T
// and Z is what spreadsheets parse as a date instead of leaving as text.
export function localTimestamp(t, tz) {
  const w = wallClock(+t, tz)
  return `${isoDay(w)} ${pad(w.hour)}:${pad(w.minute)}:${pad(w.second)}`
}
