'use client'

import { useState } from 'react'
import { Dropdown, DropdownMenu, DropdownOption } from './dropdown'
import CountryFlag from './countryflag'

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
