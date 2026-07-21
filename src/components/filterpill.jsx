'use client'

import CountryFlag from './countryflag'
import SourceIcon from './sourceicon'

function CloseIcon() {
  return (
    <svg
      width='14'
      height='14'
      viewBox='0 0 14 14'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5'
        stroke='var(--text-soft)'
        strokeWidth='1.3'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

const TYPE_LABELS = {
  link: 'Short link',
  country: 'Country',
  source: 'Source',
  device: 'Device',
}

function keyOf(f) {
  return `${f.type}:${f.label}`
}

// Country and source filters get the same flag/favicon the cards
// already show for that row, instead of a plain color dot — link
// and device filters keep the dot, since neither has a natural icon.
function FilterIcon({ filter }) {
  if (filter.type === 'country') {
    return <CountryFlag country={filter.label} size={16} />
  }
  if (filter.type === 'source') {
    return <SourceIcon domain={filter.label} />
  }
  return (
    <div
      style={{
        width: '8px',
        height: '8px',
        borderRadius: 'var(--radius-full)',
        background: 'var(--primary-base)',
        flexShrink: 0,
      }}
    />
  )
}

// ─── FilterPill ───
// Stackable — `filters` is an array. Label reads "Filter:" for one,
// "Filters:" for two or more, followed by one tag per active filter,
// each independently removable, plus a "Clear all" to drop everything
// at once instead of removing tags one by one.
export default function FilterPill({ filters, onRemove, onClearAll }) {
  if (!filters || filters.length === 0) return null

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      <span className='para-xs' style={{ color: 'var(--text-sub)' }}>
        {filters.length > 1 ? 'Filters' : 'Filter'}:
      </span>

      {filters.map((filter) => (
        <div
          key={keyOf(filter)}
          style={{
            background: 'var(--bg-default)',
            border: '1px solid var(--stroke-soft)',
            borderRadius: '10px', // was 8px
            boxShadow: '0px 2px 2px rgba(54, 54, 54, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px 4px 10px',
          }}
        >
          <FilterIcon filter={filter} />
          <span
            className='para-sm'
            style={{ color: 'var(--text-strong)', whiteSpace: 'nowrap' }}
          >
            {filter.label}
          </span>
          <button
            onClick={() => onRemove(filter)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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

      {filters.length > 1 && (
        <button
          onClick={onClearAll}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 4px',
          }}
        >
          <span className='para-xs' style={{ color: 'var(--text-soft)' }}>
            Clear all
          </span>
        </button>
      )}
    </div>
  )
}
