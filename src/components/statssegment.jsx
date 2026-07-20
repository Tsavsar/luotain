'use client'

import { useState } from 'react'
import { Dropdown, DropdownMenu, DropdownOption } from './dropdown'

const DATE_OPTIONS = [
  'Today',
  'Yesterday',
  'Last 7 days',
  'Last 30 days',
  'Last 90 days',
  'Custom',
]

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

// ─── Flag slug mapping ───
// Most names auto-convert cleanly (lowercase, spaces -> hyphens), but
// a few files have genuine quirks — a typo, non-standard groupings —
// that a naive conversion would get wrong. Add more here as they turn
// up; this isn't meant to be exhaustive from one screenshot of the
// folder, just correct for the cases already confirmed.
const FLAG_SLUG_OVERRIDES = {
  'northern ireland': 'northen-ireland', // typo in the actual filename — must match exactly, not "corrected"
  'democratic republic of the congo': 'democratic-republic-of-congo',
  'united states virgin islands': 'united-states-virgin-islands',
  'åland islands': 'aaland-islands',
  eswatini: 'eswatini',
}

function slugifyCountry(name) {
  const key = name.toLowerCase().trim()
  if (FLAG_SLUG_OVERRIDES[key]) return FLAG_SLUG_OVERRIDES[key]
  return key.replace(/\s+/g, '-')
}

// Fixed 20x20 box, image cropped to fill it (object-fit: cover) since
// the source SVGs are naturally rectangular flag shapes, not square —
// matches the Figma spec's clipped container rather than showing each
// flag at its native aspect ratio.
function CountryFlag({ country, size = 20 }) {
  if (!country) return null
  const slug = slugifyCountry(country)

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <img
        src={`/assets/flags/${slug}.svg`}
        alt=''
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={(e) => {
          // Graceful fallback if a name doesn't match a real file,
          // rather than showing a broken image icon
          e.currentTarget.style.display = 'none'
        }}
      />
    </div>
  )
}

function Metric({ label, value, icon, trend, width }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        alignItems: 'flex-start',
        width: width || 'auto',
      }}
    >
      <p className='para-xs' style={{ color: 'var(--text-soft)', margin: 0 }}>
        {label}
      </p>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {icon}
          <p
            className='label-lg'
            style={{ color: 'var(--text-strong)', margin: 0 }}
          >
            {value || '-'}
          </p>
        </div>
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
            }}
          >
            {trend.dotColor && (
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: 'var(--radius-full)',
                  background: trend.dotColor,
                }}
              />
            )}
            <span
              style={{
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '0.02em',
                lineHeight: 1,
                color: trend.color,
              }}
            >
              {trend.label}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// StatsSegment now accepts optional real data — defaults to empty
// state (matching current behavior) until the click-tracking pipeline
// actually exists to feed it real numbers.
export default function StatsSegment({ stats }) {
  const [selectedRange, setSelectedRange] = useState('Last 7 days')

  return (
    <div
      className='stats-segment-row'
      style={{
        width: '100%',
        maxWidth: '720px',
        alignItems: 'flex-start',
      }}
    >
      <div className='stats-metrics-row'>
        <Metric
          label='Total clicks'
          width='76px'
          value={stats?.totalClicks}
          trend={stats?.clicksTrend}
        />
        <Metric
          label='Total scans'
          value={stats?.totalScans}
          trend={stats?.scansTrend}
        />
        <Metric
          label='Unique visitors'
          value={stats?.uniqueVisitors}
          trend={stats?.visitorsTrend}
        />
        <Metric
          label='Top country'
          value={stats?.topCountry?.name}
          icon={<CountryFlag country={stats?.topCountry?.name} />}
          trend={
            stats?.topCountry
              ? {
                  label: `${stats.topCountry.percentage}%`,
                  color: 'var(--text-sub)',
                }
              : null
          }
        />
      </div>

      <Dropdown
        align='right'
        trigger={
          <div
            style={{
              display: 'flex',
              gap: '4px',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 0',
            }}
          >
            <p
              className='para-sm'
              style={{ color: 'var(--text-strong)', margin: 0 }}
            >
              {selectedRange}
            </p>
            <ChevronIcon />
          </div>
        }
      >
        <DropdownMenu width='160px'>
          {DATE_OPTIONS.map((option) => (
            <DropdownOption
              key={option}
              selected={option === selectedRange}
              onClick={() => setSelectedRange(option)}
            >
              {option}
            </DropdownOption>
          ))}
        </DropdownMenu>
      </Dropdown>
    </div>
  )
}
