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

function CopyIcon() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <rect
        x='5.5'
        y='5.5'
        width='8'
        height='8'
        rx='1.5'
        stroke='var(--text-soft)'
        strokeWidth='1.2'
      />
      <path
        d='M3.5 10V3.5C3.5 2.67157 4.17157 2 5 2H10.5'
        stroke='var(--text-soft)'
        strokeWidth='1.2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function OpenLinkIcon() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M6.5 9.5L13.5 2.5M13.5 2.5H9M13.5 2.5V7'
        stroke='var(--text-soft)'
        strokeWidth='1.2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M11.5 8.5V12.5C11.5 13.0523 11.0523 13.5 10.5 13.5H3.5C2.94772 13.5 2.5 13.0523 2.5 12.5V5.5C2.5 4.94772 2.94772 4.5 3.5 4.5H7.5'
        stroke='var(--text-soft)'
        strokeWidth='1.2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

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

// ─── DataRow ───
// Hover now matches the Figma spec: background darkens (bg-surface ->
// bg-subtle), text darkens + underlines, and — for rows with a real
// URL (the Clicks card specifically) — copy/open icons fade in next
// to the count. Clicking a row sets it as the active filter.
function DataRow({
  label,
  value,
  maxValue,
  iconType,
  country,
  isLink,
  onSelect,
  isFiltered,
}) {
  const [hovered, setHovered] = useState(false)
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
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onSelect}
        style={{
          background: isFiltered
            ? 'var(--bg-subtle)'
            : hovered
              ? 'var(--bg-subtle)'
              : 'var(--bg-layer)',
          borderRadius: '9px',
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          whiteSpace: 'nowrap',
          width: `max(38px, calc(${pct} * (100% - 48px)))`,
          transition:
            'width 0.4s cubic-bezier(0.22, 1, 0.36, 1), background 0.15s ease',
          cursor: 'pointer',
        }}
      >
        {iconType === 'flag' && (
          <CountryFlag country={country || label} size={18} />
        )}
        {iconType === 'favicon' && <SourceIcon domain={label} />}
        <p
          className='para-sm'
          style={{
            color:
              hovered || isFiltered ? 'var(--text-strong)' : 'var(--text-sub)',
            margin: 0,
            whiteSpace: 'nowrap',
            textDecoration: hovered || isFiltered ? 'underline' : 'none',
            textUnderlineOffset: '2px',
            transition: 'color 0.15s ease',
          }}
        >
          {label}
        </p>
        {isLink && (hovered || isFiltered) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CopyIcon />
            <OpenLinkIcon />
          </div>
        )}
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
  filterType,
  activeFilter,
  onFilterSelect,
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
          {rows.map((row) => {
            const isFiltered =
              activeFilter?.type === filterType &&
              activeFilter?.label === row.label
            return (
              <DataRow
                key={row.label}
                label={row.label}
                value={row.value}
                maxValue={maxValue}
                iconType={iconType}
                country={row.country}
                isLink={filterType === 'link'}
                isFiltered={isFiltered}
                onSelect={() =>
                  onFilterSelect?.(
                    isFiltered ? null : { type: filterType, label: row.label }
                  )
                }
              />
            )
          })}
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

// activeFilter / onFilterSelect are optional — passing them wires up
// click-to-filter (row click sets/clears the shared filter, and the
// currently-filtered row stays visually highlighted). Omitting them
// leaves the cards fully functional with no filtering.
export default function DashboardCards({ data, activeFilter, onFilterSelect }) {
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
          filterType='link'
          activeFilter={activeFilter}
          onFilterSelect={onFilterSelect}
        />
        <Card
          title='Sources'
          columnOptions={['Visitors']}
          showDropdown={false}
          dataByColumn={data?.sources}
          iconType='favicon'
          filterType='source'
          activeFilter={activeFilter}
          onFilterSelect={onFilterSelect}
        />
      </div>
      <div className='card-row'>
        <Card
          title='Geography'
          columnOptions={['Countries', 'Regions', 'Cities']}
          dataByColumn={data?.geography}
          iconType='flag'
          filterType='country'
          activeFilter={activeFilter}
          onFilterSelect={onFilterSelect}
        />
        <Card
          title='Devices'
          columnOptions={['Type', 'Browser']}
          dataByColumn={data?.devices}
          filterType='device'
          activeFilter={activeFilter}
          onFilterSelect={onFilterSelect}
        />
      </div>
    </div>
  )
}
