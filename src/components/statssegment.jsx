'use client'

import { useState } from 'react'
import { Dropdown, DropdownMenu, DropdownOption } from './dropdown'
import CountryFlag from './countryflag'
import AnimatedNumber from './animatednumber'

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

function Metric({ label, value, icon, trend, width }) {
  const isNumeric = typeof value === 'number'

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
            {value === undefined || value === null ? (
              '-'
            ) : isNumeric ? (
              <AnimatedNumber value={value} />
            ) : (
              value
            )}
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
            <span className='label-2xs' style={{ color: trend.color }}>
              {trend.label}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// selectedRange/onRangeChange make the filter controllable from the
// page (so it can actually drive the data). Uncontrolled fallback
// keeps the component working standalone.
export default function StatsSegment({ stats, selectedRange, onRangeChange }) {
  const [internalRange, setInternalRange] = useState('Last 7 days')
  const range = selectedRange ?? internalRange
  const setRange = onRangeChange ?? setInternalRange

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
          icon={
            stats?.topCountry ? (
              <CountryFlag country={stats.topCountry.name} />
            ) : null
          }
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
  )
}
