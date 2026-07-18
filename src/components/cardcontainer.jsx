'use client'

import { useState } from 'react'
import EmptyStateIcon from './emptystateicon'
import { Dropdown, DropdownMenu, DropdownOption } from './dropdown'

function ChevronIcon() {
  return (
    <svg
      width='14'
      height='14'
      viewBox='0 0 14 14'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M3.5 5.25L7 8.75L10.5 5.25'
        stroke='var(--text-soft)'
        strokeWidth='1.3'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function Card({ title, columnOptions, showDropdown = true }) {
  const [selected, setSelected] = useState(columnOptions?.[0])

  return (
    <div
      style={{
        background: 'var(--bg-default)',
        border: '1px solid var(--bg-surface)',
        borderRadius: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        alignItems: 'center',
        flex: '1 0 0',
        minWidth: 0,
        height: '250px',
        padding: '14px 12px 12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '0 8px',
        }}
      >
        <p
          className='label-md'
          style={{ color: 'var(--text-strong)', margin: 0 }}
        >
          {title}
        </p>

        {showDropdown ? (
          <Dropdown
            align='right'
            trigger={
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <p
                  className='para-xs'
                  style={{
                    color: 'var(--text-soft)',
                    margin: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {selected}
                </p>
                <ChevronIcon />
              </div>
            }
          >
            <DropdownMenu width='140px'>
              {columnOptions.map((option) => (
                <DropdownOption
                  key={option}
                  selected={option === selected}
                  onClick={() => setSelected(option)}
                >
                  {option}
                </DropdownOption>
              ))}
            </DropdownMenu>
          </Dropdown>
        ) : (
          <p
            className='para-xs'
            style={{
              color: 'var(--text-soft)',
              margin: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {columnOptions[0]}
          </p>
        )}
      </div>

      <div
        style={{
          flex: 1,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
        }}
      >
        <EmptyStateIcon />
        <p className='para-sm' style={{ color: 'var(--text-soft)', margin: 0 }}>
          No data available
        </p>
      </div>
    </div>
  )
}

export default function DashboardCards() {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: '720px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div className='card-row'>
        <Card title='Clicks' columnOptions={['Short links', 'QR codes']} />
        <Card
          title='Sources'
          columnOptions={['Visitors']}
          showDropdown={false}
        />
      </div>
      <div className='card-row'>
        <Card
          title='Geography'
          columnOptions={['Countries', 'Regions', 'Cities']}
        />
        <Card title='Devices' columnOptions={['Type', 'Browser']} />
      </div>
    </div>
  )
}
