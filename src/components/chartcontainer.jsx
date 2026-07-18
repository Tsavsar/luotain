'use client'

import { useState, useEffect } from 'react'

// ─── ChartContainer ───
// Matches Figma node 73:1007, extended per feedback: only three real
// time labels now (00:00, live current time, 23:00) — every other
// hour-slot gets a plain dot instead of 24 individual labels. The
// current-hour slot also gets a vertical line rising up from the
// axis, sitting BEHIND the empty-state content via z-index, so it's
// occluded specifically where the icon/text sit but still visible
// above and below them.
//
// FUTURE: once this chart represents more than one static day (a
// scrollable/multi-day timeline), "now" should stay anchored within
// the centered 720px content zone even though the chart itself spans
// the full page width — right now, on a single fixed 24hr axis,
// "now" always falls somewhere within it by definition, so that
// repositioning logic doesn't have anything real to do yet. Worth
// building once the chart actually needs to scroll.

const HOURS = Array.from({ length: 24 }, (_, i) => i)

function formatHour(h) {
  return `${h.toString().padStart(2, '0')}:00`
}

function NoDataIcon() {
  return (
    <div
      className='check-reveal'
      style={{
        width: '32px',
        height: '32px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '24px',
          height: '21.85px',
          left: '4px',
          top: '5.27px',
          position: 'absolute',
          background: 'var(--text-soft)',
        }}
      />
    </div>
  )
}

export default function ChartContainer() {
  const [now, setNow] = useState(null)

  // Computed client-side, after mount — avoids a server/client
  // hydration mismatch, since "current time" is inherently different
  // at server-render time vs. the moment the client actually hydrates.
  useEffect(() => {
    setNow(new Date())
  }, [])

  const currentHour = now?.getHours()
  const currentTimeLabel = now
    ? `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    : null

  return (
    <div style={{ position: 'relative', width: '100%', height: '328px' }}>
      {/* Time axis */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        {HOURS.map((hour) => {
          const isStart = hour === 0
          const isEnd = hour === 23
          const isNow = hour === currentHour

          return (
            <div
              key={hour}
              style={{
                flex: 1,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                height: '100%',
              }}
            >
              {isNow && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '26px',
                    left: '50%',
                    width: '1px',
                    height: 'calc(100% - 26px)',
                    background: 'var(--primary-base)',
                    zIndex: 0,
                  }}
                />
              )}

              <div style={{ flex: 1 }} />

              {isStart || isEnd ? (
                <p
                  className='para-xs'
                  style={{
                    color: 'var(--bg-subtle)',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    zIndex: 1,
                  }}
                >
                  {formatHour(hour)}
                </p>
              ) : isNow && currentTimeLabel ? (
                <p
                  className='para-xs'
                  style={{
                    color: 'var(--primary-base)',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    zIndex: 1,
                  }}
                >
                  {currentTimeLabel}
                </p>
              ) : (
                <div
                  style={{
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    zIndex: 1,
                  }}
                >
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--bg-subtle)',
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Empty state — sits ABOVE the rising line (z-index 2 > 0),
          occluding it specifically where the icon/text are, while the
          line stays visible above and below that content */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          zIndex: 2,
        }}
      >
        <NoDataIcon />
        <p className='para-sm' style={{ color: 'var(--text-soft)', margin: 0 }}>
          No data available
        </p>
      </div>
    </div>
  )
}
