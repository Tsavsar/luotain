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

// Same trigger icon/markup as StatsSegment's date dropdown — kept
// separate rather than imported since this one has no chevron, just
// the calendar glyph, per Figma node 73:5417.
function CalendarIcon() {
  return (
    <svg width='20' height='20' viewBox='0 0 20 20' fill='none'>
      <rect
        x='4'
        y='4'
        width='12'
        height='12'
        rx='2'
        stroke='var(--text-soft)'
        strokeWidth='1.4'
      />
      <path
        d='M4 8H16M7 3V5M13 3V5'
        stroke='var(--text-soft)'
        strokeWidth='1.4'
        strokeLinecap='round'
      />
    </svg>
  )
}

// label/value/trend, no icon — country flag isn't relevant to this
// bar. Trend renders as a bordered "Tags" pill (per Figma), not the
// plain badge StatsSegment uses on the analytics page — two
// different trend-pill treatments exist in the design system, this
// is the one 73:5417 specifies.
function Metric({ label, value, trend, width }) {
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
        <p
          className='label-lg'
          style={{ color: 'var(--text-strong)', margin: 0 }}
        >
          {value === undefined || value === null ? '-' : value}
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
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: 'var(--radius-full)',
                background: trend.color,
              }}
            />
            <span className='label-2xs' style={{ color: trend.color }}>
              {trend.label}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// selectedRange/onRangeChange controllable from the page, same
// pattern as StatsSegment — uncontrolled fallback keeps this working
// standalone too.
export default function LinksStats({ stats, selectedRange, onRangeChange }) {
  const [internalRange, setInternalRange] = useState('Last 7 days')
  const range = selectedRange ?? internalRange
  const setRange = onRangeChange ?? setInternalRange

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '720px',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', gap: '42px', alignItems: 'flex-start' }}>
        <Metric
          label='Total clicks'
          width='76px'
          value={stats?.totalClicks}
          trend={stats?.clicksTrend}
        />
        <Metric
          label='Unique visitors'
          value={stats?.uniqueVisitors}
          trend={stats?.visitorsTrend}
        />
        <Metric
          label='Links created'
          value={stats?.linksCreated}
          trend={stats?.linksTrend}
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
              {range}
            </p>
            <CalendarIcon />
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
  )
}
