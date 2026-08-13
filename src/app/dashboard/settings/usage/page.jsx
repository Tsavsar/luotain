'use client'

import { useEffect, useMemo, useState } from 'react'
import Tooltip from '@/components/tooltip'
import AnimatedNumber from '@/components/animatednumber'
import { useMockDataState } from '@/components/mockdatacontext'

// ─── Organisation → Usage ───
// Node 87:4734. Four metrics, then a year of activity as a heatmap.

const CELL = 7.5
const GAP = 2
const ROWS = 7

// Cold to hot, matching the design's ramp. Note primary-dark is the HOTTEST
// step, not the coldest — it's a deeper orange, so the scale runs pale to deep
// rather than light to dark in the usual sense.
const SCALE = [
  'var(--bg-surface)',
  'var(--primary-mute)',
  'var(--primary-faint)',
  'var(--primary-base)',
  'var(--primary-dark)',
]

function Metric({ label, value, unit, caption }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        alignItems: 'flex-start',
        // Holds its natural width. nowrap alone stops the ROW breaking, but the
        // items would still shrink and wrap their captions mid-phrase.
        flexShrink: 0,
      }}
    >
      <p
        className='para-xs'
        style={{ color: 'var(--text-soft)', margin: 0, whiteSpace: 'nowrap' }}
      >
        {label}
      </p>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          width: '100%',
        }}
      >
        {/* The same per-digit roll the stats cards use, so a number arriving
            here reads the same as one arriving on the dashboard. Thousands
            separators survive, since it takes the formatted string.

            The unit is rendered OUTSIDE it: AnimatedNumber rolls every character
            it's given, so "46 events" would have the letters tumbling like
            digits, which reads as a glitch rather than a count. */}
        <p
          className='label-lg'
          style={{ color: 'var(--text-strong)', margin: 0 }}
        >
          <AnimatedNumber value={value} />
          {unit ? <span>{` ${unit}`}</span> : null}
        </p>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-sans)',
            fontSize: '10px',
            lineHeight: 1,
            letterSpacing: '0.2px',
            color: 'var(--text-disabled)',
            whiteSpace: 'nowrap',
          }}
        >
          {caption}
        </p>
      </div>
    </div>
  )
}

// Buckets by share of the busiest day rather than fixed thresholds. A workspace
// with 4 clicks a day and one with 4,000 both get a readable spread — fixed
// numbers would leave the first entirely cold and the second entirely hot.
function levelFor(count, max) {
  if (!count) return 0
  if (max <= 1) return 4
  const ratio = count / max
  if (ratio > 0.75) return 4
  if (ratio > 0.5) return 3
  if (ratio > 0.25) return 2
  return 1
}

function Heatmap({ start, byDay, max }) {
  // Built as columns of 7, which is what makes each column a week and each row
  // a weekday — the shape people already read from contribution graphs.
  const { weeks, monthLabels } = useMemo(() => {
    const startDate = new Date(`${start}T00:00:00`)
    const weeks = []
    const monthLabels = []
    let seenMonth = -1

    for (let w = 0; w < 53; w++) {
      const days = []
      for (let d = 0; d < ROWS; d++) {
        const date = new Date(startDate)
        date.setDate(startDate.getDate() + w * ROWS + d)
        const key = date.toISOString().slice(0, 10)
        // Future days in the final partial week render as nothing rather than
        // as an empty-but-real cell, which would read as "no activity".
        const future = date > new Date()
        days.push({ key, date, count: byDay[key] || 0, future })
      }
      // One label per month, placed on the week the month starts — labelling
      // every week would be unreadable at 8px.
      const month = days[0].date.getMonth()
      if (month !== seenMonth) {
        monthLabels.push({
          week: w,
          label: days[0].date.toLocaleString('en-US', { month: 'short' }),
        })
        seenMonth = month
      }
      weeks.push(days)
    }
    return { weeks, monthLabels }
  }, [start, byDay])

  const step = CELL + GAP

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
      }}
    >
      {/* Absolutely positioned against the grid's own step, so a label sits over
          the week its month begins. Spacing them evenly would drift out of
          alignment, since months aren't the same number of weeks. */}
      <div
        style={{
          position: 'relative',
          height: '10px',
          width: `${53 * step}px`,
        }}
      >
        {monthLabels.map(({ week, label }) => (
          <span
            key={`${label}-${week}`}
            style={{
              position: 'absolute',
              left: `${week * step}px`,
              fontFamily: 'var(--font-sans)',
              fontSize: '8px',
              lineHeight: 1,
              letterSpacing: '0.16px',
              color: 'var(--text-sub)',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', gap: `${GAP}px`, alignItems: 'center' }}>
        {weeks.map((days, w) => (
          <div
            key={w}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: `${GAP}px`,
            }}
          >
            {days.map((day) => {
              if (day.future) {
                return (
                  <div
                    key={day.key}
                    style={{ width: `${CELL}px`, height: `${CELL}px` }}
                  />
                )
              }
              const level = levelFor(day.count, max)
              return (
                <Tooltip
                  key={day.key}
                  label={`${day.count} ${day.count === 1 ? 'event' : 'events'} · ${day.date.toLocaleDateString(
                    'en-US',
                    { day: 'numeric', month: 'short', year: 'numeric' }
                  )}`}
                >
                  <div
                    style={{
                      width: `${CELL}px`,
                      height: `${CELL}px`,
                      borderRadius: '2px',
                      background: SCALE[level],
                    }}
                  />
                </Tooltip>
              )
            })}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '8px',
            lineHeight: 1,
            letterSpacing: '0.16px',
            color: 'var(--text-sub)',
          }}
        >
          Cold
        </span>
        <div style={{ display: 'flex', gap: `${GAP}px`, alignItems: 'center' }}>
          {SCALE.map((c) => (
            <div
              key={c}
              style={{
                width: `${CELL}px`,
                height: `${CELL}px`,
                borderRadius: '2px',
                background: c,
              }}
            />
          ))}
        </div>
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '8px',
            lineHeight: 1,
            letterSpacing: '0.16px',
            color: 'var(--text-sub)',
          }}
        >
          Hot
        </span>
      </div>
    </div>
  )
}

export default function UsagePage() {
  const { useMockData, ready: mockReady } = useMockDataState()
  const [usage, setUsage] = useState(null)

  useEffect(() => {
    if (!mockReady) return
    let cancelled = false

    if (useMockData) {
      // A year of plausible activity, weighted so weekends are quieter — a flat
      // random spread produces a uniform wash that shows nothing about whether
      // the scale reads.
      const byDay = {}
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      start.setDate(start.getDate() - 364)
      start.setDate(start.getDate() - start.getDay())
      for (let i = 0; i < 365; i++) {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        if (d > new Date()) break
        const weekend = d.getDay() === 0 || d.getDay() === 6
        const base = weekend ? 2 : 9
        const n = Math.max(0, Math.round(base * Math.random() * 1.8 - 2))
        if (n > 0) byDay[d.toISOString().slice(0, 10)] = n
      }
      const entries = Object.entries(byDay)
      const busiest = entries.reduce(
        (best, [date, count]) =>
          !best || count > best.count ? { date, count } : best,
        null
      )
      setUsage({
        plan: { id: 'FREE', name: 'Free', maxLinks: 5 },
        links: 3,
        qrCodes: 4,
        events: entries.reduce((sum, [, c]) => sum + c, 0),
        busiestDay: busiest,
        start: start.toISOString().slice(0, 10),
        byDay,
      })
      return
    }

    fetch('/api/org/usage')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (!cancelled && d) setUsage(d)
      })
      .catch((err) => console.error('[Usage]', err))

    return () => {
      cancelled = true
    }
  }, [mockReady, useMockData])

  if (!usage) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          width: '100%',
        }}
      >
        <div
          className='skeleton-pulse'
          style={{
            width: '64px',
            height: '20px',
            borderRadius: '4px',
            background: 'var(--bg-surface)',
          }}
        />
        <div
          className='skeleton-pulse'
          style={{
            width: '100%',
            height: '56px',
            borderRadius: '8px',
            background: 'var(--bg-surface)',
          }}
        />
        <div
          className='skeleton-pulse'
          style={{
            width: '100%',
            height: '80px',
            borderRadius: '8px',
            background: 'var(--bg-surface)',
          }}
        />
      </div>
    )
  }

  const max = usage.busiestDay?.count || 0

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        alignItems: 'flex-start',
        width: '100%',
      }}
    >
      <p
        className='label-sm'
        style={{ color: 'var(--text-strong)', margin: 0 }}
      >
        Usage
      </p>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '36px',
          alignItems: 'flex-start',
          width: '100%',
        }}
      >
        {/* One line, always. flexWrap let these drop to a second row on a
            narrow window, which reads as two groups rather than one set of four.
            They scroll together with the heatmap instead — the metrics and the
            grid are the same object, so they should behave the same way. */}
        {/* No overflow. The four metrics come to ~515px in a 720px column, so
            there's nothing to scroll — and an overflow container with nothing
            overflowing still swallows scroll gestures that land on it. */}
        <div
          style={{
            display: 'flex',
            gap: '36px',
            alignItems: 'flex-start',
            flexWrap: 'nowrap',
            width: '100%',
          }}
        >
          <Metric
            label='Total links created'
            value={usage.links.toLocaleString()}
            // null maxLinks means unlimited, which has to read differently from
            // a limit of zero.
            caption={
              usage.plan.maxLinks == null
                ? `unlimited on ${usage.plan.name}`
                : `of ${usage.plan.maxLinks} on ${usage.plan.name}`
            }
          />
          <Metric
            label='QR codes created'
            value={usage.qrCodes.toLocaleString()}
            caption='unlimited on every plan'
          />
          <Metric
            label='Events tracked'
            value={usage.events.toLocaleString()}
            caption='clicks + scans, all time'
          />
          <Metric
            label='Most active day'
            value={
              usage.busiestDay ? usage.busiestDay.count.toLocaleString() : '—'
            }
            unit={usage.busiestDay ? 'events' : undefined}
            caption={
              usage.busiestDay
                ? new Date(
                    `${usage.busiestDay.date}T00:00:00`
                  ).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : 'no activity yet'
            }
          />
        </div>

        {/* Scrolls rather than shrinking. 53 weeks at 9.5px is ~504px, which is
            wider than the settings column on a narrow window — squeezing the
            cells instead would make them unreadable. */}
        <div style={{ width: '100%', overflowX: 'auto', paddingBottom: '4px' }}>
          <Heatmap start={usage.start} byDay={usage.byDay} max={max} />
        </div>
      </div>
    </div>
  )
}
