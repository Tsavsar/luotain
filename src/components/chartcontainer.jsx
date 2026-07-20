'use client'

import { useState, useEffect, useRef } from 'react'
import EmptyStateIcon from './emptystateicon'

const HOURS = Array.from({ length: 24 }, (_, i) => i)

function formatHour(h) {
  return `${String(h).padStart(2, '0')}:00`
}

// Smooths a set of {x, y} points into an SVG path using midpoint
// quadratic curves between consecutive points — lighter than full
// Catmull-Rom smoothing, but avoids the harsh look of a raw straight
// polyline between hourly values.
function smoothPath(points) {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i]
    const next = points[i + 1]
    const midX = (curr.x + next.x) / 2
    const midY = (curr.y + next.y) / 2
    d += ` Q ${curr.x} ${curr.y} ${midX} ${midY}`
    d += ` Q ${midX} ${midY} ${next.x} ${next.y}`
  }
  return d
}

// ─── ChartContainer ───
// `data`, if provided, is an array of 24 objects (one per hour):
//   { totalClicks, topLinks: [{ url, clicks }], othersClicks, date }
// With no data (today's reality — no click pipeline exists yet), this
// renders exactly the existing empty state.
export default function ChartContainer({ data }) {
  const [hoveredHour, setHoveredHour] = useState(null)
  const [now, setNow] = useState(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    setNow(new Date().getHours())
  }, [])

  const hasData = Array.isArray(data) && data.length === 24
  const activeHour = hoveredHour !== null ? hoveredHour : now

  const chartHeight = 100 // SVG viewBox units, not pixels — see viewBox note below
  const maxClicks = hasData ? Math.max(...data.map((d) => d.totalClicks), 1) : 1

  // x runs 0-24 (hour position), y runs 0-100 (percentage of chart
  // height) — deliberately unit-based rather than pixel-based, so the
  // curve stretches correctly regardless of whether columns are
  // flex-stretched (desktop) or fixed-percentage (mobile scroll).
  const points = hasData
    ? data.map((d, i) => ({
        x: i + 0.5,
        y: chartHeight - (d.totalClicks / maxClicks) * chartHeight,
      }))
    : []
  const pathD = smoothPath(points)

  // Auto-scrolls so the active hour sits at 2/3 across the visible
  // window rather than dead center — recalculates whenever the active
  // hour changes (hover, or the initial "now" on mount). On desktop,
  // where all 24 hours already fit, this is a harmless no-op since
  // there's nothing to scroll.
  useEffect(() => {
    if (!scrollRef.current || activeHour === null) return
    const container = scrollRef.current
    const columnWidth = container.scrollWidth / 24
    const targetX = activeHour * columnWidth + columnWidth / 2
    const visibleWidth = container.clientWidth
    const scrollTarget = targetX - visibleWidth * (2 / 3)
    container.scrollTo({ left: Math.max(0, scrollTarget), behavior: 'smooth' })
  }, [activeHour])

  const hoveredData = hoveredHour !== null && hasData ? data[hoveredHour] : null

  return (
    <div style={{ width: '100%', height: '328px', position: 'relative' }}>
      <div
        ref={scrollRef}
        className='chart-scroll-wrapper'
        style={{ width: '100%', height: '100%' }}
      >
        <div style={{ position: 'relative', height: '100%', minWidth: '100%' }}>
          {hasData && (
            <svg
              viewBox='0 0 24 100'
              preserveAspectRatio='none'
              style={{
                position: 'absolute',
                left: 0,
                top: '85px',
                width: '100%',
                height: '158px',
                pointerEvents: 'none',
              }}
            >
              <path
                d={pathD}
                fill='none'
                stroke='var(--primary-base)'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
                vectorEffect='non-scaling-stroke'
              />
            </svg>
          )}

          <div style={{ display: 'flex', height: '100%' }}>
            {HOURS.map((hour) => {
              const isActive = hour === activeHour
              const isDimmed = hoveredHour !== null && hour !== hoveredHour
              const isNow = hour === now

              return (
                <div
                  key={hour}
                  className='chart-hour-column'
                  onMouseEnter={() => setHoveredHour(hour)}
                  onMouseLeave={() => setHoveredHour(null)}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    opacity: isDimmed ? 0.35 : 1,
                    transition: 'opacity 0.15s ease',
                    cursor: hasData ? 'pointer' : 'default',
                  }}
                >
                  {isActive && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '24px',
                        width: '2px',
                        height: isNow ? '158px' : '144px',
                        background: 'var(--primary-base)',
                        opacity: isNow ? 1 : 0.4,
                      }}
                    />
                  )}

                  {isActive && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '20px',
                        width: '6px',
                        height: '6px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--primary-base)',
                      }}
                    />
                  )}

                  {isNow ? (
                    <p
                      className='para-xs'
                      style={{ color: 'var(--text-strong)', margin: '0 0 8px' }}
                    >
                      {formatHour(hour)}
                    </p>
                  ) : hour === 0 || hour === 23 ? (
                    <p
                      className='para-xs'
                      style={{ color: 'var(--bg-subtle)', margin: '0 0 8px' }}
                    >
                      {formatHour(hour)}
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
          </div>
        </div>
      </div>

      {hoveredData && (
        <div
          style={{
            position: 'absolute',
            left: `${Math.min((hoveredHour / 24) * 100, 68)}%`,
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
              {hoveredData.date || 'Today'}
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
              {formatHour(hoveredHour)}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className='label-sm' style={{ color: 'white' }}>
                Total clicks
              </span>
              <span className='label-sm' style={{ color: 'white' }}>
                {hoveredData.totalClicks}
              </span>
            </div>

            {hoveredData.topLinks?.map((link) => (
              <div
                key={link.url}
                style={{ display: 'flex', justifyContent: 'space-between' }}
              >
                <span className='para-xs' style={{ color: 'var(--text-sub)' }}>
                  {link.url}
                </span>
                <span className='para-xs' style={{ color: 'var(--text-sub)' }}>
                  {link.clicks}
                </span>
              </div>
            ))}

            {hoveredData.othersClicks > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className='para-xs' style={{ color: 'var(--text-sub)' }}>
                  Others
                </span>
                <span className='para-xs' style={{ color: 'var(--text-sub)' }}>
                  {hoveredData.othersClicks}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

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
