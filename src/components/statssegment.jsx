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
        stroke='#A3A3A3'
        stroke-width='1.5'
        stroke-linecap='round'
        stroke-linejoin='round'
      />
      <path
        d='M13 13L10 16L7 13'
        stroke='#A3A3A3'
        stroke-width='1.5'
        stroke-linecap='round'
        stroke-linejoin='round'
      />
    </svg>
  )
}

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
          {value || '-'}
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

export default function StatsSegment() {
  const [selectedRange, setSelectedRange] = useState('Last 7 days')

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
        <Metric label='Total clicks' width='76px' />
        <Metric label='Total scans' />
        <Metric label='Unique visitors' />
        <Metric label='Top country' />
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
