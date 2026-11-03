'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  MAX_RANGE_DAYS,
  dayKey,
  parseDayKey,
  rangeLabel,
  startOfDay,
} from '@/lib/daterange'

// ─── DateRangeCalendar ───
// What the date picker's Custom opens into. Two clicks make a range, in
// either order, and a day clicked twice is a range of that one day. Picking
// the second day finishes it: onSelect gets { start, end } as YYYY-MM-DD.
//
// Keyboard: arrows move a day or a week, Page Up/Down a month, Home/End the
// ends of the week, Enter or Space picks.

// Nothing in Luotain is older than this, matching the API's earliest window.
const EARLIEST = new Date(2020, 0, 1)

const monthOf = (date) => new Date(date.getFullYear(), date.getMonth(), 1)

const sameDay = (a, b) =>
  !!a &&
  !!b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

// Whole days from a to b, counted on the calendar so a clock change can't
// make one of them 23 hours long.
function daysBetween(a, b) {
  const utc = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
  return Math.round((utc(b) - utc(a)) / 86400000)
}

// The same day n months away, pulled back to the month's last day where the
// month is shorter: Jan 31 plus a month is Feb 28, not Mar 3.
function shiftMonths(date, n) {
  const target = new Date(date.getFullYear(), date.getMonth() + n, 1)
  const last = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0
  ).getDate()
  return new Date(
    target.getFullYear(),
    target.getMonth(),
    Math.min(date.getDate(), last)
  )
}

// Whether weeks start on Sunday or Monday is the viewer's locale's call.
// 0 is Sunday, the way getDay() counts.
function firstWeekday() {
  try {
    const locale = new Intl.Locale(navigator.language)
    const info = locale.getWeekInfo?.() ?? locale.weekInfo
    if (info?.firstDay) return info.firstDay % 7
  } catch {
    // An engine without week info, or a language tag it can't parse.
  }
  return 0
}

const monthTitle = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
})
const dayName = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})
const weekdayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' })

function Chevron({ flip }) {
  return (
    <svg
      width='20'
      height='20'
      viewBox='0 0 20 20'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path
        d='M12 6L8 10L12 14'
        stroke='var(--text-sub)'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export default function DateRangeCalendar({ value, onSelect }) {
  const today = useMemo(() => startOfDay(new Date()), [])
  const weekStart = useMemo(() => firstWeekday(), [])

  // A range already in use shows as the selection, and the next click starts
  // a new one rather than editing it.
  const [start, setStart] = useState(() =>
    value ? parseDayKey(value.start) : null
  )
  const [end, setEnd] = useState(() => (value ? parseDayKey(value.end) : null))
  // While the second day is being chosen: the day under the pointer, or the
  // keyboard's, drawn as the range it would make.
  const [preview, setPreview] = useState(null)
  const [focused, setFocused] = useState(() =>
    value ? parseDayKey(value.end) : today
  )
  const [month, setMonth] = useState(() => monthOf(focused))

  const gridRef = useRef(null)
  // DOM focus follows `focused` when the keyboard moved it, and once on open,
  // so focus lands in the grid when the list that held it goes away. Never
  // for the pointer: hovering shouldn't move focus around under someone.
  const pullFocus = useRef(true)
  useEffect(() => {
    if (!pullFocus.current) return
    pullFocus.current = false
    gridRef.current?.querySelector(`[data-day="${dayKey(focused)}"]`)?.focus()
  }, [focused, month])

  const choosingEnd = !!start && !end

  function isDisabled(day) {
    if (day > today || day < EARLIEST) return true
    // Past a year the API says no, so those days are out before they're
    // picked rather than after.
    return choosingEnd && Math.abs(daysBetween(start, day)) >= MAX_RANGE_DAYS
  }

  // The range as drawn: the picked one, or the one being chosen.
  const other = choosingEnd ? preview : end
  const [lo, hi] = !start
    ? [null, null]
    : !other
      ? [start, start]
      : other < start
        ? [other, start]
        : [start, other]

  function pick(day) {
    if (isDisabled(day)) return
    setFocused(day)
    setPreview(null)
    if (!choosingEnd) {
      setStart(day)
      setEnd(null)
      return
    }
    const [a, b] = day < start ? [day, start] : [start, day]
    setStart(a)
    setEnd(b)
    onSelect({ start: dayKey(a), end: dayKey(b) })
  }

  function onKeyDown(e) {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[
      e.key
    ]
    const intoWeek = (focused.getDay() - weekStart + 7) % 7
    let next
    if (step) next = startOfDay(focused, step)
    else if (e.key === 'PageUp') next = shiftMonths(focused, -1)
    else if (e.key === 'PageDown') next = shiftMonths(focused, 1)
    else if (e.key === 'Home') next = startOfDay(focused, -intoWeek)
    else if (e.key === 'End') next = startOfDay(focused, 6 - intoWeek)
    else return
    e.preventDefault()
    if (next > today) next = today
    if (next < EARLIEST) next = EARLIEST
    pullFocus.current = true
    setFocused(next)
    setMonth(monthOf(next))
    if (choosingEnd) setPreview(next)
  }

  // The focused day follows into the new month, so the grid always has its
  // one tab stop on screen.
  function goMonth(n) {
    let next = shiftMonths(focused, n)
    if (next > today) next = today
    if (next < EARLIEST) next = EARLIEST
    setFocused(next)
    setMonth(monthOf(next))
  }

  const lead = (month.getDay() - weekStart + 7) % 7
  const length = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0
  ).getDate()
  const cells = Array.from(
    { length: Math.ceil((lead + length) / 7) * 7 },
    (_, i) => {
      const date = i - lead + 1
      return date >= 1 && date <= length
        ? new Date(month.getFullYear(), month.getMonth(), date)
        : null
    }
  )
  // Jan 7 2024 was a Sunday, so it counts the week from 0 the way getDay does.
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    weekdayName.format(new Date(2024, 0, 7 + ((weekStart + i) % 7))).slice(0, 2)
  )

  const hint =
    lo && hi && other
      ? `${rangeLabel({ start: dayKey(lo), end: dayKey(hi) })} · ${
          daysBetween(lo, hi) + 1
        } ${daysBetween(lo, hi) === 0 ? 'day' : 'days'}`
      : choosingEnd
        ? 'Pick an end date'
        : 'Pick a start date'

  return (
    <div
      className='range-calendar'
      // Sized by its grid, not stretched to the trigger like a list would be.
      data-menu-fixed-width='true'
      style={{
        background: 'var(--bg-default)',
        border: '1px solid var(--stroke-soft)',
        borderRadius: '14px',
        boxShadow: '0 10px 20px 3px rgba(0, 0, 0, 0.04)',
        padding: '10px 10px 12px',
      }}
    >
      {/* The shell swaps in at full size and only its contents ease in. Fading
          the whole panel from zero would blink the menu out first. */}
      <div style={{ animation: 'fadeInHint 0.2s var(--ease-out)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 0 6px 10px',
          }}
        >
          <p
            className='label-sm'
            aria-live='polite'
            style={{ margin: 0, color: 'var(--text-strong)' }}
          >
            {monthTitle.format(month)}
          </p>
          <div style={{ display: 'flex', gap: '2px' }}>
            <button
              type='button'
              className='range-nav'
              aria-label='Previous month'
              disabled={month <= EARLIEST}
              onClick={() => goMonth(-1)}
            >
              <Chevron />
            </button>
            <button
              type='button'
              className='range-nav'
              aria-label='Next month'
              disabled={month >= monthOf(today)}
              onClick={() => goMonth(1)}
            >
              <Chevron flip />
            </button>
          </div>
        </div>

        <div
          aria-hidden='true'
          style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 36px)' }}
        >
          {weekdays.map((d, i) => (
            <p
              key={i}
              className='para-xs'
              style={{
                margin: 0,
                height: '28px',
                lineHeight: '28px',
                textAlign: 'center',
                color: 'var(--text-soft)',
              }}
            >
              {d}
            </p>
          ))}
        </div>

        <div
          ref={gridRef}
          role='group'
          aria-label={monthTitle.format(month)}
          onKeyDown={onKeyDown}
          onMouseLeave={() => setPreview(null)}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 36px)',
            // Rows apart, columns not: the band between two days has to run
            // unbroken along a week and visibly break between weeks.
            rowGap: '2px',
          }}
        >
          {cells.map((day, i) => {
            if (!day) return <div key={`blank-${i}`} />
            const col = i % 7
            const isLo = sameDay(day, lo)
            const isHi = sameDay(day, hi)
            const banded = lo && hi && lo < hi && day >= lo && day <= hi
            const disabled = isDisabled(day)
            return (
              <div key={dayKey(day)} className='range-cell'>
                {banded && (
                  // From the middle of each end's circle, rounded off where a
                  // week or the month breaks the run.
                  <span
                    aria-hidden='true'
                    className='range-band'
                    style={{
                      left: isLo ? '50%' : 0,
                      right: isHi ? '50%' : 0,
                      borderTopLeftRadius:
                        !isLo && (col === 0 || day.getDate() === 1)
                          ? 'var(--radius-full)'
                          : 0,
                      borderBottomLeftRadius:
                        !isLo && (col === 0 || day.getDate() === 1)
                          ? 'var(--radius-full)'
                          : 0,
                      borderTopRightRadius:
                        !isHi && (col === 6 || day.getDate() === length)
                          ? 'var(--radius-full)'
                          : 0,
                      borderBottomRightRadius:
                        !isHi && (col === 6 || day.getDate() === length)
                          ? 'var(--radius-full)'
                          : 0,
                    }}
                  />
                )}
                <button
                  type='button'
                  data-day={dayKey(day)}
                  className={`para-xs range-day${isLo || isHi ? ' is-edge' : ''}`}
                  disabled={disabled}
                  tabIndex={sameDay(day, focused) ? 0 : -1}
                  aria-label={dayName.format(day)}
                  aria-pressed={isLo || isHi}
                  aria-current={sameDay(day, today) ? 'date' : undefined}
                  onClick={() => pick(day)}
                  onMouseEnter={() => {
                    if (choosingEnd && !disabled) setPreview(day)
                  }}
                >
                  {day.getDate()}
                  {sameDay(day, today) && (
                    <span aria-hidden='true' className='range-today' />
                  )}
                </button>
              </div>
            )
          })}
        </div>

        <p
          className='para-xs'
          style={{
            margin: '10px 0 0 10px',
            color: 'var(--text-soft)',
          }}
        >
          {hint}
        </p>
      </div>
    </div>
  )
}
