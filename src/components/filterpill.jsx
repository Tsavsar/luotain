'use client'

import { useLayoutEffect, useRef } from 'react'
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

// Same order as chartcontainer.jsx's SERIES_COLORS — a link filter's
// dot needs to match whichever line it draws on the chart, and that
// line's color comes from this same first/second/third order.
const LINK_COLORS = [
  'var(--primary-base)',
  'var(--feature-base)',
  'var(--success-base)',
]

function keyOf(f) {
  return `${f.type}:${f.label}`
}

// Country and source filters get the same flag/favicon the cards
// already show for that row. Link filters get a dot colored to match
// their chart line (device filters keep a plain primary dot — device
// isn't a chart series, so there's no line color to match).
function FilterIcon({ filter, linkColor }) {
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
        background: linkColor || 'var(--primary-base)',
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
  const containerRef = useRef(null)
  const prevRects = useRef(new Map())

  // FLIP: after every render, compare each child's new position to
  // where it was last render. Anything that moved gets snapped back
  // to its old spot with a transform (invisibly, before paint —
  // that's why useLayoutEffect and not useEffect), then released to
  // transition to its real position. That's what makes the
  // remaining pills SLIDE over when one is removed, instead of
  // teleporting. Children with no previous position are brand new —
  // they're skipped here and handled by the CSS entry animation
  // instead, so the two never fight over the same transform.
  //
  // Measured relative to the CONTAINER, not raw viewport coordinates
  // — this row can itself get pushed around the page by something
  // unrelated, and relative-to-container cancels that out to zero
  // automatically, since every pill's distance from ITS OWN
  // container stays the same either way. Only an actual pill
  // reorder now shows up as a nonzero delta.
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    const newRects = new Map()
    for (const child of container.children) {
      const key = child.dataset.flipKey
      if (!key) continue
      const r = child.getBoundingClientRect()
      newRects.set(key, {
        top: r.top - containerRect.top,
        left: r.left - containerRect.left,
      })
    }

    for (const child of container.children) {
      const key = child.dataset.flipKey
      if (!key) continue
      const prev = prevRects.current.get(key)
      const next = newRects.get(key)
      if (!prev || !next) continue
      const dx = prev.left - next.left
      const dy = prev.top - next.top
      if (dx || dy) {
        child.style.transition = 'none'
        child.style.transform = `translate(${dx}px, ${dy}px)`
        // Force the browser to commit the snapped-back position
        // before the transition below — without this read, both
        // style writes collapse into one frame and nothing animates.
        child.getBoundingClientRect()
        child.style.transition = 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)'
        child.style.transform = ''
      }
    }

    prevRects.current = newRects
  })

  if (!filters || filters.length === 0) return null

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      <span
        className='para-xs filter-pill-enter'
        data-flip-key='label'
        style={{ color: 'var(--text-sub)' }}
      >
        {filters.length > 1 ? 'Filters' : 'Filter'}:
      </span>

      {(() => {
        let linkIndex = -1
        return filters.map((filter) => {
          if (filter.type === 'link') linkIndex += 1
          return (
            <div
              key={keyOf(filter)}
              data-flip-key={keyOf(filter)}
              className='filter-pill-enter'
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
              <FilterIcon
                filter={filter}
                linkColor={
                  filter.type === 'link'
                    ? LINK_COLORS[Math.min(linkIndex, LINK_COLORS.length - 1)]
                    : undefined
                }
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
          )
        })
      })()}

      {filters.length > 1 && (
        <button
          onClick={onClearAll}
          data-flip-key='clear-all'
          className='filter-pill-enter'
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
