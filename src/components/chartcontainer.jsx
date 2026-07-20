'use client'

import { useState, useEffect, useRef } from 'react'
import EmptyStateIcon from './emptystateicon'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const CURVE_TOP = 40 // px from top of chart to top of curve area
const CURVE_HEIGHT = 220 // px height of the curve drawing area
const AXIS_BASELINE = 302 // px from top — where the solid marker line ends

function formatHour(h) {
  return `${String(h).padStart(2, '0')}:00`
}

function smoothPath(points) {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  let i
  for (i = 1; i < points.length - 2; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2
    const midY = (points[i].y + points[i + 1].y) / 2
    d += ` Q ${points[i].x} ${points[i].y} ${midX} ${midY}`
  }
  // Final segment curves through the last two points
  d += ` Q ${points[i].x} ${points[i].y} ${points[i + 1].x} ${points[i + 1].y}`
  return d
}

// ─── ChartContainer v2 ───
// Fixed-width columns on every screen size — the timeline is wider
// than the viewport by design, auto-scrolled so the CURRENT hour sits
// at 2/3 across the visible window. Auto-scroll deliberately follows
// only the current time, never hover: re-scrolling under the cursor
// mid-hover would make the chart slide away from what you're
// pointing at.
export default function ChartContainer({ data }) {
  const [hoveredHour, setHoveredHour] = useState(null)
  const [lastHovered, setLastHovered] = useState(null)
  const [nowDate, setNowDate] = useState(null)
  const scrollRef = useRef(null)
  const firstColRef = useRef(null)

  useEffect(() => {
    setNowDate(new Date())
  }, [])

  const now = nowDate?.getHours() ?? null
  const hasData = Array.isArray(data) && data.length === 24
  const activeHour = hoveredHour !== null ? hoveredHour : now

  const maxClicks = hasData ? Math.max(...data.map((d) => d.totalClicks), 1) : 1
  const points = hasData
    ? data.map((d, i) => ({
        x: i + 0.5,
        y: 100 - (d.totalClicks / maxClicks) * 100,
      }))
    : []

  const strokePath = smoothPath(points)
  const fillPath = hasData ? `${strokePath} L 23.5 100 L 0.5 100 Z` : ''

  // Where the dot sits (px from chart top) for the active hour
  const activeDotTop =
    hasData && activeHour !== null
      ? CURVE_TOP + (points[activeHour].y / 100) * CURVE_HEIGHT
      : null

  // Auto-scroll: current time at 2/3 of the visible window.
  // Runs on mount and whenever `now` changes — NOT on hover.
  useEffect(() => {
    if (!scrollRef.current || now === null) return
    const container = scrollRef.current
    const colWidth = firstColRef.current?.offsetWidth || 80
    const targetX = now * colWidth + colWidth / 2
    const scrollTarget = targetX - container.clientWidth * (2 / 3)
    container.scrollTo({ left: Math.max(0, scrollTarget), behavior: 'smooth' })
  }, [now, hasData])

  const tooltipHour = hoveredHour ?? lastHovered
  const tooltipData = tooltipHour !== null && hasData ? data[tooltipHour] : null

  return (
    <div style={{ width: '100%', height: '328px', position: 'relative' }}>
      <div
        ref={scrollRef}
        className='chart-scroll-wrapper'
        style={{
          width: '100%',
          height: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
        }}
        onMouseLeave={() => setHoveredHour(null)}
      >
        <div
          style={{
            position: 'relative',
            height: '100%',
            minWidth: '100%',
            display: 'flex',
          }}
        >
          {/* Curve — gradient fill + stroke, sized to exactly the 24
              columns (spacer excluded), unit-based viewBox so it
              scales with whatever --chart-col resolves to */}
          {hasData && (
            <svg
              viewBox='0 0 24 100'
              preserveAspectRatio='none'
              style={{
                position: 'absolute',
                left: 0,
                top: `${CURVE_TOP}px`,
                width: 'calc(var(--chart-col) * 24)',
                height: `${CURVE_HEIGHT}px`,
                pointerEvents: 'none',
              }}
            >
              <defs>
                <linearGradient
                  id='chartFillGradient'
                  x1='0'
                  y1='0'
                  x2='0'
                  y2='1'
                >
                  <stop
                    offset='0%'
                    stopColor='var(--primary-base)'
                    stopOpacity='0.22'
                  />
                  <stop
                    offset='100%'
                    stopColor='var(--primary-base)'
                    stopOpacity='0'
                  />
                </linearGradient>
              </defs>
              <path d={fillPath} fill='url(#chartFillGradient)' stroke='none' />
              <path
                d={strokePath}
                fill='none'
                stroke='var(--primary-base)'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'
                vectorEffect='non-scaling-stroke'
              />
            </svg>
          )}

          {/* Single gliding marker for the active hour — dashed above
              the dot, dot ON the curve, solid orange below to the
              axis. One element with left/top transitions = the smooth
              glide, instead of per-column jumping. */}
          {hasData && activeHour !== null && activeDotTop !== null && (
            <div
              style={{
                position: 'absolute',
                left: `calc(var(--chart-col) * ${activeHour})`,
                width: 'var(--chart-col)',
                top: 0,
                bottom: 0,
                pointerEvents: 'none',
                transition: 'left 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                zIndex: 1,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  height: `${activeDotTop - 4}px`,
                  borderLeft: '1px dashed var(--bg-subtle)',
                  transition: 'height 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 'calc(50% - 3px)',
                  top: `${activeDotTop - 3}px`,
                  width: '6px',
                  height: '6px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--primary-base)',
                  transition: 'top 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: `${activeDotTop + 4}px`,
                  height: `${AXIS_BASELINE - activeDotTop - 4}px`,
                  borderLeft: '1.5px solid var(--primary-base)',
                  transition:
                    'top 0.3s cubic-bezier(0.22, 1, 0.36, 1), height 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              />
            </div>
          )}

          {/* Hour columns */}
          {HOURS.map((hour) => {
            const isActive = hour === activeHour
            const isDimmed = hoveredHour !== null && hour !== hoveredHour
            const isNow = hour === now
            const showLabel = isActive || hour === 0 || hour === 23

            return (
              <div
                key={hour}
                ref={hour === 0 ? firstColRef : null}
                className='chart-hour-column-v2'
                onMouseEnter={() => {
                  setHoveredHour(hour)
                  setLastHovered(hour)
                }}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  opacity: isDimmed ? 0.35 : 1,
                  transition: 'opacity 0.3s ease',
                  cursor: hasData ? 'pointer' : 'default',
                  zIndex: 2,
                }}
              >
                {/* Empty-state now marker: simple solid line, old style */}
                {!hasData && isNow && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '26px',
                      left: '50%',
                      width: '1px',
                      height: '158px',
                      background: 'var(--primary-base)',
                    }}
                  />
                )}

                {showLabel ? (
                  <p
                    className={isActive ? 'label-sm' : 'para-xs'}
                    style={{
                      color: isActive
                        ? 'var(--text-strong)'
                        : 'var(--bg-subtle)',
                      margin: '0 0 8px',
                      whiteSpace: 'nowrap',
                      animation: isActive ? 'fadeInHint 0.2s ease-out' : 'none',
                      zIndex: 2,
                    }}
                  >
                    {isNow && isActive && nowDate
                      ? `${String(nowDate.getHours()).padStart(2, '0')}:${String(nowDate.getMinutes()).padStart(2, '0')}`
                      : formatHour(hour)}
                  </p>
                ) : (
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--bg-subtle)',
                      marginBottom: '13px',
                    }}
                  />
                )}
              </div>
            )
          })}

          {/* Trailing space so late hours can physically reach the
              2/3 position — without this, scroll clamps and 23:00
              pins to the right edge again */}
          <div className='chart-trailing-spacer' aria-hidden='true' />

          {/* Tooltip — anchored inside the scroll content so it stays
              glued to its hour while scrolling; glides between hours
              via left transition instead of teleporting */}
          {hasData && tooltipData && (
            <div
              style={{
                position: 'absolute',
                left: `clamp(8px, calc(var(--chart-col) * ${tooltipHour} - 80px), calc(var(--chart-col) * 24 - 253px))`,
                top: '20px',
                background: '#171717',
                border: '1.5px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--radius-xl)',
                padding: '14px 18px',
                width: '245px',
                boxShadow:
                  '0px 16px 24px -4px rgba(0, 0, 0, 0.14), 0px 4px 6px -2px rgba(0, 0, 0, 0.08)',
                pointerEvents: 'none',
                zIndex: 10,
                opacity: hoveredHour !== null ? 1 : 0,
                visibility: hoveredHour !== null ? 'visible' : 'hidden',
                transition:
                  'left 0.3s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease, visibility 0.2s',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '8px',
                }}
              >
                <span className='para-xs' style={{ color: 'var(--text-sub)' }}>
                  {tooltipData.date || 'Today'}
                </span>
                <div
                  style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--text-disabled)',
                  }}
                />
                <span className='para-xs' style={{ color: 'var(--text-sub)' }}>
                  {formatHour(tooltipHour)}
                </span>
              </div>

              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span className='label-sm' style={{ color: 'white' }}>
                    Total clicks
                  </span>
                  <span className='label-sm' style={{ color: 'white' }}>
                    {tooltipData.totalClicks}
                  </span>
                </div>

                {tooltipData.topLinks?.map((link) => (
                  <div
                    key={link.url}
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span
                      className='para-xs'
                      style={{ color: 'var(--text-sub)' }}
                    >
                      {link.url}
                    </span>
                    <span
                      className='para-xs'
                      style={{ color: 'var(--text-sub)' }}
                    >
                      {link.clicks}
                    </span>
                  </div>
                ))}

                {tooltipData.othersClicks > 0 && (
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span
                      className='para-xs'
                      style={{ color: 'var(--text-sub)' }}
                    >
                      Others
                    </span>
                    <span
                      className='para-xs'
                      style={{ color: 'var(--text-sub)' }}
                    >
                      {tooltipData.othersClicks}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {!hasData && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          <EmptyStateIcon />
          <p
            className='para-sm'
            style={{ color: 'var(--text-soft)', margin: 0 }}
          >
            No data available
          </p>
        </div>
      )}
    </div>
  )
}
