'use client'

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

// ─── FilterPill ───
// Stackable — `filters` is an array. Label reads "Filter:" for one,
// "Filters:" for two or more, followed by one tag per active filter,
// each independently removable.
export default function FilterPill({ filters, onRemove }) {
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
            borderRadius: 'var(--radius-sm, 8px)',
            boxShadow: '0px 2px 2px rgba(54, 54, 54, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px 4px 10px',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--primary-base)',
              flexShrink: 0,
            }}
          />
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
    </div>
  )
}
