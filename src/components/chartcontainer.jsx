'use client'

import { useState, useEffect, useRef } from 'react'
import EmptyStateIcon from './emptystateicon'

const CURVE_TOP = 40
const CURVE_HEIGHT = 220
const AXIS_BASELINE = 302

// Catmull-Rom -> cubic Bezier. Unlike the previous midpoint-quadratic
// version, this passes THROUGH every data point rather than being
// merely pulled toward it — so a value's marker dot always lands
// exactly on the drawn curve, including at peaks, instead of floating
// above an undershot line.
function smoothPath(points) {
  if (points.length < 2) return ''
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
  }
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] || p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`
  }
  return d
}

// ─── ChartContainer (slot-based) ───
// `data` is an array of slots — hourly for Today (a rolling window
// reaching back into yesterday, "now" anchored at 2/3), daily for
// week/month ranges. Each slot:
//   { key, label, date, timeLabel, totalClicks, topLinks,
//     othersClicks, isNow, isFuture }
// Future slots draw nothing and aren't hoverable. No data at all =
// the original empty state (24h axis + live now line).
export default function ChartContainer({ data }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const [lastHovered, setLastHovered] = useState(null)
  const [nowDate, setNowDate] = useState(null)
  const scrollRef = useRef(null)
  const firstColRef = useRef(null)

  useEffect(() => {
    setNowDate(new Date())
  }, [])

  const hasData = Array.isArray(data) && data.length >= 2
  const slots = hasData ? data : []
  const N = slots.length

  const nowIdx = slots.findIndex((s) => s.isNow)
  const activeIdx =
    hoveredIdx !== null ? hoveredIdx : nowIdx !== -1 ? nowIdx : null

  // Curve covers only slots that have actually happened
  const lastRealIdx = (() => {
    let last = -1
    slots.forEach((s, i) => {
      if (!s.isFuture) last = i
    })
    return last
  })()
  const realSlots = slots.slice(0, lastRealIdx + 1)
  const maxClicks = realSlots.length
    ? Math.max(...realSlots.map((s) => s.totalClicks), 1)
    : 1
  const points = realSlots.map((s, i) => ({
    x: i + 0.5,
    y: 100 - (s.totalClicks / maxClicks) * 100,
  }))
  const strokePath = smoothPath(points)
  const lastX = points.length ? points[points.length - 1].x : 0.5
  const fillPath =
    points.length >= 2 ? `${strokePath} L ${lastX} 100 L 0.5 100 Z` : ''

  const activeDotTop =
    hasData && activeIdx !== null && points[activeIdx]
      ? CURVE_TOP + (points[activeIdx].y / 100) * CURVE_HEIGHT
      : null

  // Auto-scroll the now-slot (or the newest slot) to 2/3 of the
  // visible window. Follows data changes, never hover.
  useEffect(() => {
    if (!scrollRef.current || !hasData) return
    const container = scrollRef.current
    const colWidth = firstColRef.current?.offsetWidth || 80
    if (nowIdx !== -1) {
      // Live range: anchor "now" at 2/3 with space ahead of it
      const targetX = nowIdx * colWidth + colWidth / 2
      const scrollTarget = targetX - container.clientWidth * (2 / 3)
      container.scrollTo({
        left: Math.max(0, scrollTarget),
        behavior: 'smooth',
      })
    } else {
      // Completed range (Yesterday): there's no "now" to anchor, so
      // 2/3 positioning just strands dead space on the right — rest
      // at the end of the timeline instead
      container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' })
    }
  }, [hasData, nowIdx, N])

  const tooltipIdx = hoveredIdx ?? lastHovered
  const tooltipSlot = tooltipIdx !== null && hasData ? slots[tooltipIdx] : null
  // Flip the tooltip to the marker's LEFT once there isn't room on
  // the right — replaces clamping, which capped the tooltip at a
  // fixed spot near the edge instead of actually following the
  // cursor the rest of the way across the timeline.
  const tooltipFlipped = tooltipIdx !== null && N - tooltipIdx <= 3

  // Legacy empty state: 24-hour axis with the live now line
  const legacyHours = Array.from({ length: 24 }, (_, i) => i)
  const legacyNow = nowDate?.getHours() ?? null

  return (
    <div style={{ width: '100%', height: '328px', position: 'relative' }}>
      <div
        ref={scrollRef}
        className='chart-scroll-wrapper'
        style={{
          width: '100%',
          height: '100%',
          overflowX: 'auto',
          overflowY: 'visible',
        }}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <div
          style={{
            position: 'relative',
            height: '100%',
            minWidth: '100%',
            display: 'flex',
          }}
        >
          {hasData && points.length >= 2 && (
            <svg
              viewBox={`0 0 ${N} 100`}
              preserveAspectRatio='none'
              style={{
                position: 'absolute',
                left: 0,
                top: `${CURVE_TOP}px`,
                width: `calc(var(--chart-col) * ${N})`,
                height: `${CURVE_HEIGHT}px`,
                pointerEvents: 'none',
                overflow: 'visible', // SVGs clip their own content by default — this was shaving the stroke off at high peaks near the top
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
                <linearGradient
                  id='chartFillGradientMuted'
                  x1='0'
                  y1='0'
                  x2='0'
                  y2='1'
                >
                  <stop
                    offset='0%'
                    stopColor='var(--bg-subtle)'
                    stopOpacity='0.4'
                  />
                  <stop
                    offset='100%'
                    stopColor='var(--bg-subtle)'
                    stopOpacity='0'
                  />
                </linearGradient>
                {/* Clip window for the orange layer: full-width at
                    rest, collapses to just the hovered column on
                    hover — x/width transitions give the glide */}
                <clipPath id='chartHoverClip'>
                  <rect
                    y='-15'
                    height='130'
                    x={hoveredIdx !== null ? hoveredIdx : 0}
                    width={hoveredIdx !== null ? 1 : N}
                    style={{
                      transition:
                        'x 0.3s cubic-bezier(0.22, 1, 0.36, 1), width 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                  />
                </clipPath>
              </defs>

              {/* Muted base layer — the whole curve as light gray
                  dashes + faint gray fill, visible only on hover
                  (the Figma luminosity treatment) */}
              <g
                style={{
                  opacity: hoveredIdx !== null ? 1 : 0,
                  transition: 'opacity 0.25s ease',
                }}
              >
                <path
                  d={fillPath}
                  fill='url(#chartFillGradientMuted)'
                  stroke='none'
                />
                <path
                  d={strokePath}
                  fill='none'
                  stroke='var(--bg-subtle)'
                  strokeWidth='1.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeDasharray='0.12 0.1'
                  vectorEffect='non-scaling-stroke'
                />
              </g>

              {/* Orange layer — full curve at rest; on hover, clipped
                  down to just the hovered column's slice */}
              <g clipPath='url(#chartHoverClip)'>
                <path
                  d={fillPath}
                  fill='url(#chartFillGradient)'
                  stroke='none'
                />
                <path
                  d={strokePath}
                  fill='none'
                  stroke='var(--primary-base)'
                  strokeWidth='1.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  vectorEffect='non-scaling-stroke'
                />
              </g>
            </svg>
          )}

          {/* Gliding marker on the active slot */}
          {hasData && activeIdx !== null && activeDotTop !== null && (
            <div
              style={{
                position: 'absolute',
                left: `calc(var(--chart-col) * ${activeIdx})`,
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

          {/* Slot columns */}
          {hasData
            ? slots.map((slot, idx) => {
                const isActive = idx === activeIdx
                const showLabel = isActive || idx === 0 || idx === N - 1

                return (
                  <div
                    key={slot.key}
                    ref={idx === 0 ? firstColRef : null}
                    className='chart-hour-column-v2'
                    onMouseEnter={() => {
                      if (slot.isFuture) return
                      setHoveredIdx(idx)
                      setLastHovered(idx)
                    }}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      cursor: slot.isFuture ? 'default' : 'pointer',
                      zIndex: 2,
                    }}
                  >
                    {showLabel ? (
                      <p
                        className={isActive ? 'label-sm' : 'para-xs'}
                        style={{
                          color: isActive
                            ? 'var(--text-strong)'
                            : 'var(--bg-subtle)',
                          margin: '0 0 8px',
                          whiteSpace: 'nowrap',
                          animation: isActive
                            ? 'fadeInHint 0.2s ease-out'
                            : 'none',
                          zIndex: 2,
                        }}
                      >
                        {slot.label}
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
              })
            : legacyHours.map((hour) => {
                const isNow = hour === legacyNow
                return (
                  <div
                    key={hour}
                    ref={hour === 0 ? firstColRef : null}
                    className='chart-hour-column-v2'
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                    }}
                  >
                    {isNow && (
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
                    {isNow && nowDate ? (
                      <p
                        className='para-xs'
                        style={{
                          color: 'var(--text-strong)',
                          margin: '0 0 8px',
                        }}
                      >
                        {`${String(nowDate.getHours()).padStart(2, '0')}:${String(nowDate.getMinutes()).padStart(2, '0')}`}
                      </p>
                    ) : hour === 0 || hour === 23 ? (
                      <p
                        className='para-xs'
                        style={{ color: 'var(--bg-subtle)', margin: '0 0 8px' }}
                      >
                        {`${String(hour).padStart(2, '0')}:00`}
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

          {/* Spacer only when a live "now" needs room to sit at 2/3 —
              completed ranges end flush, no dead space */}
          {(!hasData || nowIdx !== -1) && (
            <div className='chart-trailing-spacer' aria-hidden='true' />
          )}

          {hasData && tooltipSlot && (
            <div
              style={{
                position: 'absolute',
                // Right of the marker normally; flips to its left
                // near the end of the timeline so it keeps following
                // the cursor instead of stopping at a capped position
                left: tooltipFlipped
                  ? `calc(var(--chart-col) * ${tooltipIdx} - 255px)`
                  : `calc(var(--chart-col) * ${tooltipIdx + 1} + 10px)`,
                top: '104px',
                background: '#171717',
                border: '1.5px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--radius-xl)',
                padding: '14px 18px',
                width: '245px',
                boxShadow:
                  '0px 16px 24px -4px rgba(0, 0, 0, 0.14), 0px 4px 6px -2px rgba(0, 0, 0, 0.08)',
                pointerEvents: 'none',
                zIndex: 10,
                opacity: hoveredIdx !== null ? 1 : 0,
                visibility: hoveredIdx !== null ? 'visible' : 'hidden',
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
                  {tooltipSlot.date}
                </span>
                {tooltipSlot.timeLabel && (
                  <>
                    <div
                      style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--text-disabled)',
                      }}
                    />
                    <span
                      className='para-xs'
                      style={{ color: 'var(--text-sub)' }}
                    >
                      {tooltipSlot.timeLabel}
                    </span>
                  </>
                )}
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
                    {tooltipSlot.totalClicks}
                  </span>
                </div>

                {tooltipSlot.topLinks?.map((link) => (
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

                {tooltipSlot.othersClicks > 0 && (
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
                      {tooltipSlot.othersClicks}
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
