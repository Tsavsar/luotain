'use client'

import { useRef, useState } from 'react'
import { QrCode } from '@/components/qrdesigner'
import { Dropdown, DropdownMenu, DropdownOption } from '@/components/dropdown'
import {
  SortIcon,
  MoreIcon,
  formatRowDate,
  COL_DATE,
} from '@/components/linktablehelpers'

// ─── QR code views ───
// Three ways of looking at the same set, because they answer different
// questions:
//
//   table   — "which code is performing?"      comparison, dense, sortable eye
//   cards   — "which code is this, and how?"   recognition plus the numbers
//   gallery — "which code do I want?"          pure recognition, e.g. to grab one
//
// Worth saying plainly: this isn't really an accessibility feature. Real
// accessibility here is the keyboard path, focus visibility, labelled controls
// and contrast — all of which every view below shares. Three layouts is a
// density preference, and more views means more surface to keep keyboard-usable
// rather than less. It's defensible because each answers a distinct question,
// but if one had to go it's `cards`: it's the hybrid, and it does neither job
// as well as the two either side of it.

function LinkOffIcon({ size = 13 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 14 14'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M5.6 8.4 8.4 5.6M4.9 6.3 3.9 7.3a2.1 2.1 0 0 0 3 3l1-1M9.1 7.7l1-1a2.1 2.1 0 0 0-3-3l-1 1'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinecap='round'
      />
      <path
        d='M1.6 1.6l10.8 10.8'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinecap='round'
      />
    </svg>
  )
}

// ─── The sliding hover highlight ───
// One element that follows the cursor between rows rather than each row
// painting its own background. Measured from the hovered element's rect, the
// same approach the dropdowns use, so it works whatever height a row is.
function useSlidingHighlight() {
  const containerRef = useRef(null)
  const [highlight, setHighlight] = useState(null)

  function onMouseMove(e) {
    const container = containerRef.current
    if (!container) return
    const row = e.target.closest?.('[data-qr-row]')
    if (!row || !container.contains(row)) return

    const cRect = container.getBoundingClientRect()
    const rRect = row.getBoundingClientRect()
    const next = { top: rRect.top - cRect.top, height: rRect.height }

    setHighlight((prev) => {
      // Bail out when nothing moved, or every mouse event re-renders the list.
      if (prev && prev.top === next.top && prev.height === next.height)
        return prev
      // First hover snaps into place; subsequent ones slide. Without this the
      // highlight travels in from the top of the container the first time,
      // which reads as an animation nobody asked for.
      return { ...next, animate: Boolean(prev) }
    })
  }

  function onMouseLeave() {
    // Fades out where it is rather than returning anywhere — there's no
    // selected row to go back to.
    setHighlight((prev) => (prev ? { ...prev, hidden: true } : null))
  }

  const layer = highlight ? (
    <div
      aria-hidden='true'
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: `${highlight.top}px`,
        height: `${highlight.height}px`,
        borderRadius: '10px',
        background: 'var(--bg-surface)',
        opacity: highlight.hidden ? 0 : 1,
        transition: highlight.animate
          ? 'top var(--duration-panel) var(--ease-out), height var(--duration-panel) var(--ease-out), opacity var(--duration-fast) ease'
          : 'opacity var(--duration-fast) ease',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  ) : null

  return { containerRef, onMouseMove, onMouseLeave, layer }
}

function ScanCount({ scans, dim }) {
  return (
    <div style={{ display: 'flex', gap: '5px', alignItems: 'baseline' }}>
      <span
        className='label-sm'
        style={{ color: dim ? 'var(--text-sub)' : 'var(--text-strong)' }}
      >
        {scans.toLocaleString()}
      </span>
      <span className='para-xs' style={{ color: 'var(--text-soft)' }}>
        {scans === 1 ? 'scan' : 'scans'}
      </span>
    </div>
  )
}

// ─── Table ───
// Built on the same helpers and treatment as the links table rather than a
// bespoke one: the pill-shaped header cells on --bg-surface, the same fixed
// column widths, the same SortIcon and sort behaviour, the same row menu.
//
// Not the literal LinksTable component, because that one's columns, sort keys
// and row menu are hardcoded to links — reusing it would have meant
// generalising 400 lines around a different data shape and a different set of
// actions. Sharing the helpers gets the consistency without the abstraction.
const COL_SCANS = '122px'
const COL_LINK_COL = '220px'

function TableHeader({ sortBy, sortDir, onSort }) {
  const cellBase = {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--bg-surface)',
    borderRadius: '6px',
    padding: '4px 10px',
  }

  return (
    <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
      <div style={{ ...cellBase, flex: '1 0 0', minWidth: 0 }}>
        <span className='para-xs' style={{ color: 'var(--text-sub)' }}>
          Code
        </span>
      </div>
      <div style={{ ...cellBase, width: COL_LINK_COL, flexShrink: 0 }}>
        <span className='para-xs' style={{ color: 'var(--text-sub)' }}>
          Link
        </span>
      </div>
      <div
        style={{
          ...cellBase,
          width: COL_SCANS,
          flexShrink: 0,
          justifyContent: 'space-between',
          paddingRight: '4px',
          cursor: 'pointer',
        }}
        onClick={() => onSort('scans')}
      >
        <span className='para-xs' style={{ color: 'var(--text-sub)' }}>
          Scans
        </span>
        <span style={{ display: 'flex' }}>
          <SortIcon direction={sortBy === 'scans' ? sortDir : null} />
        </span>
      </div>
      <div
        style={{
          ...cellBase,
          width: COL_DATE,
          flexShrink: 0,
          justifyContent: 'space-between',
          paddingRight: '4px',
          cursor: 'pointer',
        }}
        onClick={() => onSort('date')}
      >
        <span className='para-xs' style={{ color: 'var(--text-sub)' }}>
          Date created
        </span>
        <span style={{ display: 'flex' }}>
          <SortIcon direction={sortBy === 'date' ? sortDir : null} />
        </span>
      </div>
    </div>
  )
}

function RowMenu({ code, onOpen, onEdit, onDelete }) {
  return (
    <Dropdown
      align='right'
      trigger={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '6px',
          }}
        >
          <MoreIcon />
        </div>
      }
    >
      <DropdownMenu width='160px'>
        <DropdownOption onClick={() => onOpen?.(code)}>
          View code
        </DropdownOption>
        <DropdownOption onClick={() => onEdit?.(code)}>Edit</DropdownOption>
        <DropdownOption danger onClick={() => onDelete?.(code)}>
          Delete
        </DropdownOption>
      </DropdownMenu>
    </Dropdown>
  )
}

export function QrTable({ codes, onOpen, onEdit, onDelete }) {
  const [sortBy, setSortBy] = useState(null)
  const [sortDir, setSortDir] = useState('desc')
  const { containerRef, onMouseMove, onMouseLeave, layer } =
    useSlidingHighlight()

  function handleSort(key) {
    if (sortBy === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortBy(key)
      setSortDir('desc')
    }
  }

  const sorted = sortBy
    ? [...codes].sort((a, b) => {
        const dir = sortDir === 'desc' ? -1 : 1
        if (sortBy === 'scans') return (a.scans - b.scans) * dir
        return (new Date(a.createdAt) - new Date(b.createdAt)) * dir
      })
    : codes

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        width: '100%',
      }}
    >
      <TableHeader sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />

      <div
        ref={containerRef}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={{ position: 'relative', width: '100%' }}
      >
        {layer}
        {sorted.map((code, index) => {
          const deleted = code.link?.deleted
          return (
            <div
              key={code.id}
              data-qr-row
              onClick={() => onOpen(code)}
              className='qr-row'
              style={{
                position: 'relative',
                // Descending, so an open row menu sits above the rows below it
                // — the same stacking the links table uses.
                zIndex: sorted.length - index,
                display: 'flex',
                gap: '6px',
                alignItems: 'center',
                width: '100%',
                padding: '10px',
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                  flex: '1 0 0',
                  minWidth: 0,
                }}
              >
                {/* Small but still the real code — even at 28px the colour and
                    pattern identify it faster than the label does. */}
                <span style={{ flexShrink: 0, opacity: deleted ? 0.4 : 1 }}>
                  <QrCode
                    value={`https://${code.scanUrl}`}
                    color={code.color}
                    markerColor={code.markerColor}
                    pattern={code.pattern}
                    branding={false}
                    card={28}
                    margin={2}
                    radius={5}
                  />
                </span>
                <span
                  className='para-sm'
                  style={{
                    color: deleted ? 'var(--text-sub)' : 'var(--text-strong)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {code.label}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '5px',
                  alignItems: 'center',
                  width: COL_LINK_COL,
                  flexShrink: 0,
                  minWidth: 0,
                  color: deleted ? 'var(--text-disabled)' : 'var(--text-soft)',
                }}
              >
                {deleted ? <LinkOffIcon /> : null}
                <span
                  className='para-xs'
                  style={{
                    color: 'inherit',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {deleted ? 'Link deleted' : code.link?.shortUrl}
                </span>
              </div>

              <div style={{ width: COL_SCANS, flexShrink: 0 }}>
                <ScanCount scans={code.scans} dim={deleted} />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: COL_DATE,
                  flexShrink: 0,
                }}
              >
                <span className='para-xs' style={{ color: 'var(--text-soft)' }}>
                  {formatRowDate(code.createdAt)}
                </span>
                {/* Stops the click reaching the row, or opening the menu would
                    also open the code. */}
                <div onClick={(e) => e.stopPropagation()}>
                  <RowMenu
                    code={code}
                    onOpen={onOpen}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Cards ───
export function QrCards({ codes, onOpen }) {
  return (
    <div className='qr-grid-cards'>
      {codes.map((code) => {
        const deleted = code.link?.deleted
        return (
          <button
            key={code.id}
            type='button'
            onClick={() => onOpen(code)}
            className='qr-card'
            style={{
              display: 'flex',
              gap: '14px',
              alignItems: 'center',
              width: '100%',
              background: 'none',
              border: 'none',
              borderRadius: '14px',
              padding: '10px',
              cursor: 'pointer',
              textAlign: 'left',
              boxSizing: 'border-box',
            }}
          >
            <span
              style={{
                flexShrink: 0,
                opacity: deleted ? 0.4 : 1,
                transition: 'opacity var(--duration-fast) ease',
              }}
            >
              <QrCode
                value={`https://${code.scanUrl}`}
                color={code.color}
                markerColor={code.markerColor}
                pattern={code.pattern}
                branding={code.branding}
                card={72}
                margin={4}
                radius={10}
              />
            </span>

            <span
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                minWidth: 0,
                flex: '1 0 0',
              }}
            >
              <span
                className='para-sm'
                style={{
                  color: deleted ? 'var(--text-sub)' : 'var(--text-strong)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {code.label}
              </span>
              <span
                style={{
                  display: 'flex',
                  gap: '5px',
                  alignItems: 'center',
                  minWidth: 0,
                  color: deleted ? 'var(--text-disabled)' : 'var(--text-soft)',
                }}
              >
                {deleted ? <LinkOffIcon /> : null}
                <span
                  className='para-xs'
                  style={{
                    color: 'inherit',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {deleted ? 'Link deleted' : code.link?.shortUrl}
                </span>
              </span>
              <ScanCount scans={code.scans} dim={deleted} />
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Gallery ───
// The code, large, with its name under it. No link and no scan count: this view
// is for finding the right code by eye, and the numbers are what the other two
// are for.
export function QrGallery({ codes, onOpen }) {
  return (
    <div className='qr-grid-gallery'>
      {codes.map((code) => {
        const deleted = code.link?.deleted
        return (
          <button
            key={code.id}
            type='button'
            onClick={() => onOpen(code)}
            className='qr-tile'
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              padding: '12px',
              background: 'none',
              border: 'none',
              borderRadius: '16px',
              cursor: 'pointer',
              boxSizing: 'border-box',
            }}
          >
            <span
              style={{
                flexShrink: 0,
                opacity: deleted ? 0.4 : 1,
                transition: 'opacity var(--duration-fast) ease',
              }}
            >
              <QrCode
                value={`https://${code.scanUrl}`}
                color={code.color}
                markerColor={code.markerColor}
                pattern={code.pattern}
                branding={code.branding}
                card={124}
                margin={6}
                radius={14}
              />
            </span>

            <span
              style={{
                display: 'flex',
                gap: '5px',
                alignItems: 'center',
                maxWidth: '100%',
                minWidth: 0,
              }}
            >
              {deleted ? (
                <span
                  style={{ color: 'var(--text-disabled)', display: 'flex' }}
                >
                  <LinkOffIcon size={12} />
                </span>
              ) : null}
              <span
                className='para-xs'
                style={{
                  color: deleted ? 'var(--text-sub)' : 'var(--text-strong)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {code.label}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
