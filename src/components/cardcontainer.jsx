'use client'

import { useState } from 'react'
import EmptyStateIcon from './emptystateicon'
import CountryFlag from './countryflag'
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

function DirectLinkIcon() {
  return (
    <svg
      width='18'
      height='18'
      viewBox='0 0 18 18'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M9.9 5.4L8.13 3.63C6.89 2.39 4.87 2.39 3.63 3.63C2.39 4.87 2.39 6.89 3.63 8.13L5.4 9.9'
        stroke='var(--text-soft)'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M8.1 12.6L9.87 14.37C11.11 15.61 13.13 15.61 14.37 14.37C15.61 13.13 15.61 11.11 14.37 9.87L12.6 8.1'
        stroke='var(--text-soft)'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M10.8 10.8L7.2 7.2'
        stroke='var(--text-soft)'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

// Favicon via Google's service — works for any domain without a
// brand-icon library's coverage gaps. "direct" (no domain) gets the
// chain-link icon instead.
function SourceIcon({ domain }) {
  if (!domain || domain.toLowerCase() === 'direct') {
    return <DirectLinkIcon />
  }

  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`}
      alt=''
      width={18}
      height={18}
      style={{ borderRadius: '4px', flexShrink: 0 }}
      onError={(e) => {
        e.currentTarget.style.display = 'none'
      }}
    />
  )
}

// ─── Row ───
// The gray pill IS a bar chart: its width is proportional to the
// row's value relative to the column max. The label is allowed to
// overflow past a short bar (per the Figma spec — see the 41px pill
// with a full-length link in it), so text stays readable even when
// the value is tiny.
function DataRow({ label, value, maxValue, iconType, country }) {
  const pct = maxValue > 0 ? value / maxValue : 0

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingRight: '10px',
      }}
    >
      <div
        style={{
          background: 'var(--bg-layer)',
          borderRadius: '9px',
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          whiteSpace: 'nowrap',
          width: `max(38px, calc(${pct} * (100% - 48px)))`,
          transition: 'width 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* For country rows the label IS the country; for region/city
            rows the flag comes from the row's explicit `country`
            field — a city name alone can't identify a flag */}
        {iconType === 'flag' && (
          <CountryFlag country={country || label} size={18} />
        )}
        {iconType === 'favicon' && <SourceIcon domain={label} />}
        <p className='para-sm' style={{ color: 'var(--text-sub)', margin: 0 }}>
          {label}
        </p>
      </div>
      <p
        className='label-sm'
        style={{ color: 'var(--text-strong)', margin: 0, flexShrink: 0 }}
      >
        {value}
      </p>
    </div>
  )
}

function Card({
  title,
  columnOptions = [],
  showDropdown = true,
  dataByColumn,
  iconType = 'none',
}) {
  const [selected, setSelected] = useState(columnOptions[0])
  const rows = dataByColumn?.[selected]
  const hasRows = Array.isArray(rows) && rows.length > 0
  const maxValue = hasRows ? Math.max(...rows.map((r) => r.value), 1) : 1

  return (
    <div
      style={{
        background: 'var(--bg-default)',
        border: '1px solid var(--bg-surface)',
        borderRadius: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
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
            gap: '6px',
            overflowY: 'auto',
          }}
        >
          {rows.map((row) => (
            <DataRow
              key={row.label}
              label={row.label}
              value={row.value}
              maxValue={maxValue}
              iconType={iconType}
              country={row.country}
            />
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
          iconType='favicon'
        />
      </div>
      <div className='card-row'>
        <Card
          title='Geography'
          columnOptions={['Countries', 'Regions', 'Cities']}
          dataByColumn={data?.geography}
          iconType='flag'
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
