'use client'

import { useRef, useState } from 'react'
import { QrCode } from '@/components/qrdesigner'
import { Dropdown, DropdownMenu, DropdownOption } from '@/components/dropdown'
import CopyButton from '@/components/copybutton'
import {
  SortIcon,
  MoreIcon,
  CopyIcon,
  DestinationIcon,
  hostnameOf,
  formatRowDate,
  COL_LINK,
  COL_DESTINATION,
  COL_CLICKS,
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
        // -8px each side and an 8px radius, matching the links table's hover
        // layer exactly. It overhangs the row's real box purely visually, so
        // the columns never shift — the same reasoning the links table
        // documents. At rest the two are indistinguishable; this one just
        // animates between rows.
        left: '-8px',
        right: '-8px',
        top: `${highlight.top}px`,
        height: `${highlight.height}px`,
        borderRadius: '8px',
        background: 'var(--bg-surface)',
        opacity: highlight.hidden ? 0 : 1,
        transition: highlight.animate
          ? 'top var(--duration-panel) var(--ease-out), height var(--duration-panel) var(--ease-out), opacity var(--duration-fast) ease'
          : 'opacity var(--duration-fast) ease',
        pointerEvents: 'none',
        // 0 against the rows' own 1-and-up zIndex, so it's behind their
        // content — the links table achieves the same with zIndex -1 on a
        // per-row layer.
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
// Mirrors LinksTable's row anatomy exactly, because the two sit one nav tab
// apart and any difference reads as a bug. Specifically:
//
//   row      padding 4px 0, gap 6px, its own zIndex passed in
//   cells    padding 4px 10px, radius 6px, para-xs on --text-strong
//   hover    its own layer hanging 8px past each side, at zIndex -1
//   menu     absolutely positioned at right: 0, over the Date column's tail
//   widths   the same COL_* constants
//
// My first version got nearly all of that wrong — 10px row padding, no cell
// padding, para-sm and label-sm, the menu inside the date cell pushing its text.
//
// The one deliberate difference: the hover layer SLIDES between rows rather than
// each row fading its own in. It lands in exactly the same place with the same
// 8px overhang, so it looks identical at rest — it just animates between rows.
const COL_CODE = COL_LINK
const COL_TARGET = COL_DESTINATION
const COL_SCANS = COL_CLICKS

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
      <div style={{ ...cellBase, width: COL_CODE, flexShrink: 0 }}>
        <span className='para-xs' style={{ color: 'var(--text-sub)' }}>
          Code
        </span>
      </div>
      <div style={{ ...cellBase, width: COL_TARGET, flexShrink: 0 }}>
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
      <DropdownMenu>
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

function QrRow({ code, zIndex, onOpen, onEdit, onDelete, register }) {
  const deleted = code.link?.deleted

  const cellBase = {
    display: 'flex',
    alignItems: 'center',
    borderRadius: '6px',
    padding: '4px 10px',
  }

  return (
    <div
      data-qr-row
      // Tracked for the layout morph — the same element identity in all three
      // views, so FLIP can follow it from one to the next.
      ref={register?.(code.id)}
      onClick={() => onOpen?.(code)}
      style={{
        position: 'relative',
        zIndex,
        display: 'flex',
        gap: '6px',
        width: '100%',
        alignItems: 'center',
        padding: '4px 0',
        cursor: 'pointer',
      }}
    >
      <div style={{ ...cellBase, width: COL_CODE, flexShrink: 0, gap: '10px' }}>
        {/* Small but still the real code — even at 20px the colour and pattern
            identify it faster than the label does. Sized to the row rather than
            enlarging it: the links table's first cell is a line of text, and a
            taller thumbnail here would make the two tables different heights. */}
        <span
          style={{ display: 'flex', flexShrink: 0, opacity: deleted ? 0.4 : 1 }}
        >
          <QrCode
            value={`https://${code.scanUrl}`}
            color={code.color}
            markerColor={code.markerColor}
            pattern={code.pattern}
            branding={false}
            card={20}
            margin={1}
            radius={4}
          />
        </span>
        <p
          className='para-xs'
          style={{
            flex: 1,
            minWidth: 0,
            color: deleted ? 'var(--text-sub)' : 'var(--text-strong)',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {code.label}
        </p>
      </div>

      <div
        style={{ ...cellBase, width: COL_TARGET, flexShrink: 0, gap: '6px' }}
      >
        {deleted ? (
          <span style={{ display: 'flex', color: 'var(--text-disabled)' }}>
            <LinkOffIcon />
          </span>
        ) : (
          <DestinationIcon domain={hostnameOf(code.link?.destination)} />
        )}
        <p
          className='para-xs'
          style={{
            flex: 1,
            minWidth: 0,
            color: deleted ? 'var(--text-disabled)' : 'var(--text-strong)',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {deleted ? 'Link deleted' : code.link?.shortUrl}
        </p>
        {/* Beside the URL it copies, matching the links table. It was on the
            Code column, which put a copy affordance next to a label that isn't
            copyable — the thing worth copying is the link.

            Hidden when the link is deleted: there's nothing to copy, and the
            cell reads "Link deleted" rather than a URL. */}
        {!deleted ? (
          <CopyButton
            value={code.link?.shortUrl}
            icon={<CopyIcon />}
            label='Copy link'
            toastMessage='Link copied to clipboard'
            style={{ flexShrink: 0 }}
          />
        ) : null}
      </div>

      <div style={{ ...cellBase, width: COL_SCANS, flexShrink: 0 }}>
        <p
          className='para-xs'
          style={{
            color: deleted ? 'var(--text-sub)' : 'var(--text-strong)',
            margin: 0,
          }}
        >
          {code.scans}
        </p>
      </div>

      <div style={{ ...cellBase, width: COL_DATE, flexShrink: 0 }}>
        <p
          className='para-xs'
          style={{ color: 'var(--text-strong)', margin: 0 }}
        >
          {formatRowDate(code.createdAt)}
        </p>
      </div>

      {/* Absolutely positioned, exactly as the links table does it: it takes no
          space in the row's flex layout, so it can't reflow the columns, and it
          sits over the tail of the Date column, which date strings don't fill.
          My first version put it inside the date cell, which pushed the date. */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      >
        <RowMenu
          code={code}
          onOpen={onOpen}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  )
}

export function QrTable({
  codes,
  onOpen,
  onEdit,
  onDelete,
  register,
  bindMenu,
}) {
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
        {sorted.map((code, index) => (
          <QrRow
            key={code.id}
            code={code}
            register={register}
            // Descending, so an open row menu sits above the rows below it —
            // the same stacking the links table uses.
            zIndex={sorted.length - index}
            onOpen={onOpen}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Cards ───
export function QrCards({ codes, onOpen, register, bindMenu }) {
  return (
    <div className='qr-grid-cards'>
      {codes.map((code) => {
        const deleted = code.link?.deleted
        return (
          <button
            key={code.id}
            type='button'
            ref={register?.(code.id)}
            onClick={() => onOpen(code)}
            // Right-click gives this view the same actions the table
            // row menu has. Without it a code here could be previewed
            // but never edited or deleted.
            {...(bindMenu?.(code) || {})}
            className='qr-card'
            style={{
              position: 'relative',
              display: 'flex',
              gap: '14px',
              alignItems: 'center',
              width: '100%',
              background: 'none',
              border: 'none',
              // No horizontal padding: the content starts at the column's own
              // edge, so the first card lines up with the table's first column
              // and with everything else on the page. The hover background
              // hangs outside instead — see the layer below, the same trick the
              // links table uses.
              padding: '6px 0',
              cursor: 'pointer',
              textAlign: 'left',
              boxSizing: 'border-box',
            }}
          >
            <span
              aria-hidden='true'
              className='qr-hover-layer'
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: '-8px',
                right: '-8px',
                borderRadius: '8px',
                // Behind the content. The card's own zIndex keeps this
                // self-contained rather than leaking behind its neighbours.
                zIndex: -1,
              }}
            />
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
export function QrGallery({ codes, onOpen, register, bindMenu }) {
  return (
    <div className='qr-grid-gallery'>
      {codes.map((code) => {
        const deleted = code.link?.deleted
        return (
          <button
            key={code.id}
            type='button'
            ref={register?.(code.id)}
            onClick={() => onOpen(code)}
            // Right-click gives this view the same actions the table
            // row menu has. Without it a code here could be previewed
            // but never edited or deleted.
            {...(bindMenu?.(code) || {})}
            className='qr-tile'
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              // flex-start, not center. The column is now exactly the code's
              // width, so centring has nothing to centre within — and it made
              // the label's left edge drift away from the code's.
              alignItems: 'flex-start',
              gap: '10px',
              padding: '8px 0',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              boxSizing: 'border-box',
            }}
          >
            <span
              aria-hidden='true'
              className='qr-hover-layer'
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: '-8px',
                right: '-8px',
                borderRadius: '10px',
                zIndex: -1,
              }}
            />
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
                // Capped at the code's width so a long label ellipsizes rather
                // than widening the tile past its column and breaking the
                // alignment this whole change is for.
                maxWidth: '124px',
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
