'use client'

import { useState } from 'react'
import { Dropdown, DropdownMenu, DropdownOption } from './dropdown'
import AnimatedNumber from './animatednumber'

const DATE_OPTIONS = [
  'Today',
  'Yesterday',
  'Last 7 days',
  'Last 30 days',
  'Last 90 days',
  'Custom',
]

// Same chevron already established elsewhere (StatsSegment,
// LinksStats, dashboardmenu's org switcher) — reused again rather
// than introducing yet another icon for the same "open this
// dropdown" affordance.
function ChevronIcon() {
  return (
    <svg
      width='20'
      height='20'
      viewBox='0 0 20 20'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M13 7L10 4L7 7'
        stroke='var(--text-soft)'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M13 13L10 16L7 13'
        stroke='var(--text-soft)'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

// One card — label, value (number or something custom like a flag +
// country name via `icon`), and an optional trend pill. Every card
// is flex:1 (equal width), matching the new design exactly instead
// of the old layout's plain text with one narrower column.
function MetricCard({ label, value, icon, trend }) {
  const isNumeric = typeof value === 'number'

  return (
    <div
      style={{
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        alignItems: 'flex-start',
        background: 'var(--bg-light)',
        borderRadius: '14px',
        padding: '12px 14px',
      }}
    >
      <p
        className='para-xs'
        style={{ color: 'var(--text-soft)', margin: 0, width: '100%' }}
      >
        {label}
      </p>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          minWidth: 0,
        }}
      >
        {icon}
        <p
          className='label-lg'
          style={{
            color: 'var(--text-strong)',
            margin: 0,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {value === undefined || value === null ? (
            '-'
          ) : isNumeric ? (
            <AnimatedNumber value={value} />
          ) : (
            value
          )}
        </p>
        {trend && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 6px',
              borderRadius: '8px',
              background: 'var(--bg-default)',
              border: '0.75px solid var(--stroke-soft)',
              boxShadow: '0px 2px 2px rgba(54, 54, 54, 0.04)',
              flexShrink: 0,
            }}
          >
            {trend.dotColor && (
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: 'var(--radius-full)',
                  background: trend.dotColor,
                  flexShrink: 0,
                }}
              />
            )}
            <span className='label-2xs' style={{ color: trend.color }}>
              {trend.label}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── StatsCards ───
// Shared by both the analytics page and the links page — a title +
// date-range dropdown on one row, then a row of equal-width metric
// cards below. `metrics` is an array the caller builds from its own
// stats shape: [{ label, value, icon?, trend? }, ...], so this
// component itself doesn't need to know the difference between
// "Total clicks" and "Top country" — that mapping lives in whichever
// page is using it.
export default function StatsCards({
  title,
  metrics,
  filters,
  selectedRange,
  onRangeChange,
}) {
  const [internalRange, setInternalRange] = useState('Last 7 days')
  const range = selectedRange ?? internalRange
  const setRange = onRangeChange ?? setInternalRange

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '720px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        <p
          className='label-sm'
          style={{ color: 'var(--text-strong)', margin: 0 }}
        >
          {title}
        </p>

        <Dropdown
          align='right'
          trigger={
            <div
              style={{
                display: 'flex',
                gap: '4px',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <p
                className='para-sm'
                style={{ color: 'var(--text-strong)', margin: 0 }}
              >
                {range}
              </p>
              <ChevronIcon />
            </div>
          }
        >
          <DropdownMenu width='160px'>
            {DATE_OPTIONS.map((option) => (
              <DropdownOption
                key={option}
                selected={option === range}
                onClick={() => setRange(option)}
              >
                {option}
              </DropdownOption>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>

      {/* Optional slot — the analytics page passes its active-filter
          pills through here so they sit between the title row and
          the cards, per the reference layout. Pages without filters
          just don't pass anything and nothing renders. */}
      {filters}

      {/* Container per Figma 404:1169 — the cards now sit inside a
          bg-default surface with a soft stroke, 3px of padding, and
          an 18px radius (cards' own 14px + 3px padding ≈ concentric
          corners, so the inner and outer curves track each other
          instead of fighting). */}
      <div
        className='stats-cards-grid'
        style={{
          background: 'var(--bg-default)',
          border: '1px solid var(--stroke-soft)',
          borderRadius: '18px',
          padding: '3px',
        }}
      >
        {metrics.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>
    </div>
  )
}
