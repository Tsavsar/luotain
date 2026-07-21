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

// Exact icons provided — copy (two overlapping squares)
function CopyIcon() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M13.2 6V11.6C13.2 12.484 12.484 13.2 11.6 13.2H6'
        stroke='#5C5C5C'
        strokeWidth='1.25'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M8.4 2H3.6C2.71634 2 2 2.71634 2 3.6V8.4C2 9.28366 2.71634 10 3.6 10H8.4C9.28366 10 10 9.28366 10 8.4V3.6C10 2.71634 9.28366 2 8.4 2Z'
        stroke='#5C5C5C'
        strokeWidth='1.25'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

// Exact icon provided — apply as filter (funnel/sort lines)
function FilterIcon() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M11.2008 8H4.80078'
        stroke='#5C5C5C'
        strokeWidth='1.25'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M2.40039 4H13.6004'
        stroke='#5C5C5C'
        strokeWidth='1.25'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M7.20117 12H8.80117'
        stroke='#5C5C5C'
        strokeWidth='1.25'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      width='12'
      height='12'
      viewBox='0 0 12 12'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M9 3L3 9M3 3L9 9'
        stroke='var(--text-soft)'
        strokeWidth='1.2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg
      width='10'
      height='10'
      viewBox='0 0 10 10'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M5 1V9M1 5H9'
        stroke='var(--text-soft)'
        strokeWidth='1.3'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M3.5 8.5L6.5 11.5L12.5 4.5'
        stroke='var(--primary-base)'
        strokeWidth='1.5'
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
// Clicking anywhere on the row now applies it as a filter — copy
// stays its own explicit icon (copying "Norway" doesn't mean
// anything the way copying a URL does, so it shouldn't fire on
// every row click). The filter icon still shows on hover too, both
// as a hint this row is filterable and as a target that does the
// same thing as clicking the row (its own stopPropagation stops
// that click from also bubbling up and toggling a second time).
function DataRow({
  label,
  value,
  maxValue,
  iconType,
  country,
  isLink,
  onToggleFilter,
  isFiltered,
}) {
  const [hovered, setHovered] = useState(false)
  const pct = maxValue > 0 ? value / maxValue : 0

  function handleCopy(e) {
    e.stopPropagation()
    navigator.clipboard?.writeText(label)
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onToggleFilter?.()}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingRight: '10px',
        cursor: 'pointer',
      }}
    >
      <div
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
          // minWidth (not width) so this can still grow past its
          // proportional bar size when the label needs more room —
          // a fixed width was letting long labels (e.g. "United
          // Kingdom") spill past the pill's edge on narrow screens.
          minWidth: `max(38px, calc(${pct} * (100% - 48px)))`,
          transition:
            'min-width 0.4s cubic-bezier(0.22, 1, 0.36, 1), background 0.15s ease',
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
      </div>

      {/* Icons live in the row, not the pill — end of the FULL row,
          right before the count, regardless of how narrow the grey
          pill itself is */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0,
        }}
      >
        {(hovered || isFiltered) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isLink && (
              <button
                onClick={handleCopy}
                title='Copy'
                style={{
                  display: 'flex',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <CopyIcon />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleFilter?.()
              }}
              title={isFiltered ? 'Remove filter' : 'Filter by this'}
              style={{
                display: 'flex',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {isFiltered ? <CloseIcon /> : <FilterIcon />}
            </button>
          </div>
        )}
        <p
          className='label-sm'
          style={{ color: 'var(--text-strong)', margin: 0 }}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

function Card({
  title,
  columnOptions = [],
  showDropdown = true,
  dataByColumn,
  filterOptions,
  iconType = 'none',
  filterType,
  activeFilters,
  onToggleFilter,
  enableCompare = false,
}) {
  const [selected, setSelected] = useState(columnOptions[0])
  const rows = dataByColumn?.[selected]
  const hasRows = Array.isArray(rows) && rows.length > 0
  const maxValue = hasRows ? Math.max(...rows.map((r) => r.value), 1) : 1
  // Unfiltered list for the picker specifically — falls back to rows
  // if filterOptions wasn't passed, so nothing breaks if a caller
  // doesn't wire it up
  const pickerRows = filterOptions?.[selected] || rows

  // Which of THIS card's own filters are active — the tags row and
  // "compare" display only care about filterType (e.g. only link
  // filters affect the Clicks card, not a country filter elsewhere)
  const ownFilters = (activeFilters || []).filter((f) => f.type === filterType)
  const isComparing = enableCompare && ownFilters.length > 0
  const compareRows = isComparing
    ? ownFilters
        .map((f) => rows?.find((r) => r.label === f.label))
        .filter(Boolean)
    : []

  return (
    <div
      style={{
        background: 'var(--bg-default)',
        border: '1px solid var(--bg-surface)',
        borderRadius: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: isComparing ? '10px' : '18px',
        flex: '1 0 0',
        minWidth: 0,
        height: '250px',
        // minHeight repeats the height on purpose: once card-row
        // stacks these into a column on mobile, `flex: 1 0 0` starts
        // this card's height calculation from 0 (not 250px) and
        // grows it from there — but with no fixed height set on the
        // row wrapping it, there's nothing solid to grow into, so
        // the card was settling at "just tall enough for the title,"
        // squeezing the rows list toward zero height. minHeight
        // isn't affected by that calculation, so it holds the floor.
        minHeight: '250px',
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

      {enableCompare && hasRows && ownFilters.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            padding: '0 4px',
          }}
        >
          {ownFilters.map((f) => (
            <div
              key={f.label}
              style={{
                background: 'var(--bg-default)',
                border: '1px solid var(--stroke-soft)',
                borderRadius: '10px',
                boxShadow: '0px 2px 2px rgba(54, 54, 54, 0.04)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
              }}
            >
              <span
                className='para-xs'
                style={{ color: 'var(--text-strong)', whiteSpace: 'nowrap' }}
              >
                {f.label}
              </span>
              <button
                onClick={() => onToggleFilter?.(f)}
                style={{
                  display: 'flex',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <CloseIcon />
              </button>
            </div>
          ))}

          <Dropdown
            trigger={
              <div
                style={{
                  background: 'var(--bg-default)',
                  border: '1px solid var(--stroke-soft)',
                  borderRadius: '10px',
                  boxShadow: '0px 2px 2px rgba(54, 54, 54, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                }}
              >
                <PlusIcon />
              </div>
            }
          >
            <DropdownMenu width='200px'>
              {/* Plain rows, not DropdownOption — DropdownOption
                  always closes the menu after a click, which breaks
                  picking multiple links in one open session. This
                  stays open across selections; only clicking outside
                  or the plus icon again closes it. Capped at 3 —
                  once reached, unselected rows grey out and stop
                  responding until one is removed. */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {(pickerRows || []).map((row) => {
                  const picked = ownFilters.some((f) => f.label === row.label)
                  const capped = !picked && ownFilters.length >= 3
                  return (
                    <div
                      key={row.label}
                      onClick={() => {
                        if (capped) return
                        onToggleFilter?.({ type: filterType, label: row.label })
                      }}
                      className={`dropdown-item${picked ? ' is-selected' : ''}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 14px 6px 12px',
                        borderRadius: 'var(--radius-lg)',
                        cursor: capped ? 'default' : 'pointer',
                        opacity: capped ? 0.4 : 1,
                      }}
                    >
                      <p
                        className='para-xs'
                        style={{ margin: 0, color: 'var(--text-strong)' }}
                      >
                        {row.label}
                      </p>
                      {picked && <CheckIcon />}
                    </div>
                  )
                })}
                {ownFilters.length >= 3 && (
                  <p
                    className='para-xs'
                    style={{
                      color: 'var(--text-soft)',
                      margin: '4px 12px 2px',
                    }}
                  >
                    Up to 3 at once
                  </p>
                )}
              </div>
            </DropdownMenu>
          </Dropdown>
        </div>
      )}

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
          {(isComparing ? compareRows : rows).map((row) => {
            const isFiltered = activeFilters?.some(
              (f) => f.type === filterType && f.label === row.label
            )
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
                onToggleFilter={() =>
                  onToggleFilter?.({ type: filterType, label: row.label })
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

// activeFilters is now an ARRAY (stackable). onToggleFilter adds a
// filter if it's not already active, removes it if it is.
export default function DashboardCards({
  data,
  filterOptions,
  activeFilters,
  onToggleFilter,
}) {
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
          filterOptions={filterOptions?.clicks}
          filterType='link'
          activeFilters={activeFilters}
          onToggleFilter={onToggleFilter}
          enableCompare
        />
        <Card
          title='Sources'
          columnOptions={['Visitors']}
          showDropdown={false}
          dataByColumn={data?.sources}
          iconType='favicon'
          filterType='source'
          activeFilters={activeFilters}
          onToggleFilter={onToggleFilter}
        />
      </div>
      <div className='card-row'>
        <Card
          title='Geography'
          columnOptions={['Countries', 'Regions', 'Cities']}
          dataByColumn={data?.geography}
          iconType='flag'
          filterType='country'
          activeFilters={activeFilters}
          onToggleFilter={onToggleFilter}
        />
        <Card
          title='Devices'
          columnOptions={['Type', 'Browser']}
          dataByColumn={data?.devices}
          filterType='device'
          activeFilters={activeFilters}
          onToggleFilter={onToggleFilter}
        />
      </div>
    </div>
  )
}
