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

// dataByColumn: optional — { [columnOptionLabel]: [{ label, value }] }
// Falls back to the existing empty state when not provided, or when
// the currently selected column has no rows.
function Card({
  title,
  columnOptions = [],
  showDropdown = true,
  dataByColumn,
}) {
  const [selected, setSelected] = useState(columnOptions[0])
  const rows = dataByColumn?.[selected]
  const hasRows = Array.isArray(rows) && rows.length > 0

  return (
    <div
      style={{
        background: 'var(--bg-default)',
        border: '1px solid var(--bg-surface)',
        borderRadius: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
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

      {hasRows ? (
        <div
          style={{
            flex: 1,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            padding: '4px 8px',
            overflowY: 'auto',
          }}
        >
          {rows.map((row) => (
            <div
              key={row.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <p
                className='para-sm'
                style={{ color: 'var(--text-strong)', margin: 0 }}
              >
                {row.label}
              </p>
              <p
                className='para-sm'
                style={{ color: 'var(--text-soft)', margin: 0 }}
              >
                {row.value}
              </p>
            </div>
          ))}
        </div>
      ) : (
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

export default function DashboardCards({ data }) {
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
        <Card
          title='Clicks'
          columnOptions={['Short links', 'QR codes']}
          dataByColumn={data?.clicks}
        />
        <Card
          title='Sources'
          columnOptions={['Visitors']}
          showDropdown={false}
          dataByColumn={data?.sources}
        />
      </div>
      <div className='card-row'>
        <Card
          title='Geography'
          columnOptions={['Countries', 'Regions', 'Cities']}
          dataByColumn={data?.geography}
        />
        <Card
          title='Devices'
          columnOptions={['Type', 'Browser']}
          dataByColumn={data?.devices}
        />
      </div>
    </div>
  )
}
