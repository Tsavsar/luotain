'use client'

import { useEffect, useState } from 'react'
import EmptyStateIcon from './emptystateicon'
import SourceIcon from './sourceicon'
import { Dropdown, DropdownMenu, DropdownOption } from './dropdown'
import { toast } from './toast'

// ─── Date formatting ───
// "3rd July, 2026" — ordinal day, full month name, year. The teen
// exception (11th/12th/13th, not 11st/12nd/13rd) is why this can't
// just be a lookup on the last digit.
function ordinal(n) {
  const suffixes = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0])
}
function formatRowDate(date) {
  const d = new Date(date)
  const month = d.toLocaleString('en-US', { month: 'long' })
  return `${ordinal(d.getDate())} ${month}, ${d.getFullYear()}`
}

// Best-effort hostname for the destination favicon — same favicon
// service SourceIcon already uses elsewhere, just fed the
// destination's domain instead of a click-event source string.
function hostnameOf(url) {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

// Same chevron already established in LinksStats/StatsSegment (same
// path data, just this app's one "expand/toggle" glyph) — a single
// arm instead of the double one, since a single chevron can rotate
// to show current direction, an up/down pair can't say much more
// than "this is sortable."
function SortIcon() {
  return (
    <svg width='14' height='14' viewBox='0 0 20 20' fill='none'>
      <path
        d='M13 7L10 4L7 7'
        stroke='var(--text-soft)'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width='14' height='14' viewBox='0 0 16 16' fill='none'>
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
        d='M3.5 10.5V4A1.5 1.5 0 0 1 5 2.5H10.5'
        stroke='var(--text-soft)'
        strokeWidth='1.2'
        strokeLinecap='round'
      />
    </svg>
  )
}

// Not a Figma export — a plain 3-dot "more" glyph is about as
// standard as icons get, safe to hand-draw rather than needing the
// real asset.
function MoreIcon() {
  return (
    <svg width='16' height='16' viewBox='0 0 16 16' fill='none'>
      <circle cx='4' cy='8' r='1.3' fill='var(--text-soft)' />
      <circle cx='8' cy='8' r='1.3' fill='var(--text-soft)' />
      <circle cx='12' cy='8' r='1.3' fill='var(--text-soft)' />
    </svg>
  )
}

const COL_LINK = '210px'
const COL_DESTINATION = '220px'
const COL_DATE = '150px'
const COL_MORE = '30px'

// ─── Header ───
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
      <div style={{ ...cellBase, width: COL_LINK, flexShrink: 0 }}>
        <span className='para-xs' style={{ color: 'var(--text-sub)' }}>
          Link
        </span>
      </div>
      <div style={{ ...cellBase, width: COL_DESTINATION, flexShrink: 0 }}>
        <span className='para-xs' style={{ color: 'var(--text-sub)' }}>
          Destination
        </span>
      </div>
      <div
        style={{
          ...cellBase,
          flex: 1,
          minWidth: 0,
          justifyContent: 'space-between',
          paddingRight: '4px',
          cursor: 'pointer',
        }}
        onClick={() => onSort('clicks')}
      >
        <span className='para-xs' style={{ color: 'var(--text-sub)' }}>
          Clicks
        </span>
        <span
          style={{
            display: 'flex',
            opacity: sortBy === 'clicks' ? 1 : 0.5,
            transform:
              sortBy === 'clicks' && sortDir === 'desc'
                ? 'rotate(180deg)'
                : 'none',
            transition: 'transform 0.15s ease',
          }}
        >
          <SortIcon />
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
        <span
          style={{
            display: 'flex',
            opacity: sortBy === 'date' ? 1 : 0.5,
            transform:
              sortBy === 'date' && sortDir === 'desc'
                ? 'rotate(180deg)'
                : 'none',
            transition: 'transform 0.15s ease',
          }}
        >
          <SortIcon />
        </span>
      </div>
      {/* Matches COL_MORE on rows below — without this, rows (which
          always reserve that width for the more-button) would sit
          narrower than the header and every column would be
          slightly out of alignment with its header label. */}
      <div style={{ width: COL_MORE, flexShrink: 0 }} />
    </div>
  )
}

// ─── Row actions menu ───
function MoreMenu({ link, onEdit, onDelete }) {
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
        <DropdownOption onClick={() => onEdit?.(link)}>Edit</DropdownOption>
        <DropdownOption
          onClick={() => {
            navigator.clipboard?.writeText(link.shortUrl)
            toast('Link copied to clipboard')
          }}
        >
          Copy short link
        </DropdownOption>
        <DropdownOption danger onClick={() => onDelete?.(link)}>
          Delete
        </DropdownOption>
      </DropdownMenu>
    </Dropdown>
  )
}

// ─── One row ───
function LinkRow({ link, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false)
  // Touch devices don't fire onMouseEnter/Leave the way a cursor
  // does, so a reveal wired only to hover can end up permanently
  // invisible — and with opacity 0 also meaning pointerEvents:
  // 'none', permanently untappable too. This is the same check
  // chartcontainer.jsx already uses for its own hover-vs-tap split.
  const [isTouch, setIsTouch] = useState(false)
  useEffect(() => {
    setIsTouch(window.matchMedia?.('(hover: none)').matches ?? false)
  }, [])
  const showMore = hovered || isTouch

  const cellBase = {
    display: 'flex',
    alignItems: 'center',
    borderRadius: '6px',
    padding: '4px 10px',
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        gap: '6px',
        width: '100%',
        alignItems: 'center',
        padding: '4px 8px',
        margin: '0 -8px',
        borderRadius: '8px',
        background: hovered || isTouch ? 'var(--bg-surface)' : 'transparent',
        transition: 'background 0.1s ease',
      }}
    >
      <div style={{ ...cellBase, width: COL_LINK, flexShrink: 0, gap: '10px' }}>
        <p
          className='para-xs'
          style={{
            flex: 1,
            minWidth: 0,
            color: 'var(--text-strong)',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {link.shortUrl}
        </p>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(link.shortUrl)
            toast('Link copied to clipboard')
          }}
          title='Copy'
          style={{
            display: 'flex',
            flexShrink: 0,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <CopyIcon />
        </button>
      </div>

      <div
        style={{
          ...cellBase,
          width: COL_DESTINATION,
          flexShrink: 0,
          gap: '4px',
        }}
      >
        <SourceIcon domain={hostnameOf(link.destination)} />
        <p
          className='para-xs'
          style={{
            flex: 1,
            minWidth: 0,
            color: 'var(--text-strong)',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {link.destination}
        </p>
      </div>

      <div style={{ ...cellBase, flex: 1, minWidth: 0 }}>
        <p
          className='para-xs'
          style={{ color: 'var(--text-strong)', margin: 0 }}
        >
          {link.clicks}
        </p>
      </div>

      <div style={{ ...cellBase, width: COL_DATE, flexShrink: 0 }}>
        <p
          className='para-xs'
          style={{ color: 'var(--text-strong)', margin: 0 }}
        >
          {formatRowDate(link.createdAt)}
        </p>
      </div>

      {/* Width is constant (COL_MORE) whether hovering or not — only
          opacity toggles, so this can never push or reflow anything
          else in the row. pointerEvents keeps it unclickable while
          invisible instead of just visually hidden. */}
      <div
        style={{
          width: COL_MORE,
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'center',
          opacity: showMore ? 1 : 0,
          pointerEvents: showMore ? 'auto' : 'none',
          transition: 'opacity 0.15s ease',
        }}
      >
        <MoreMenu link={link} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  )
}

// ─── Empty state ───
function EmptyState() {
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '73px 0 74px',
      }}
    >
      <EmptyStateIcon />
      <p className='para-sm' style={{ color: 'var(--text-soft)', margin: 0 }}>
        No data available
      </p>
    </div>
  )
}

// ─── Table ───
// `links` is [{ id, shortUrl, destination, clicks, createdAt }, ...].
// Sorting is local to the table (clicks/date, asc/desc) — doesn't
// need to round-trip through the page, nothing else on the page
// depends on the table's current sort order.
export default function LinksTable({ links, onEdit, onDelete }) {
  const [sortBy, setSortBy] = useState(null)
  const [sortDir, setSortDir] = useState('desc')

  function handleSort(col) {
    if (sortBy === col) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortBy(col)
      setSortDir('desc')
    }
  }

  const hasLinks = Array.isArray(links) && links.length > 0
  const sorted = hasLinks
    ? [...links].sort((a, b) => {
        if (!sortBy) return 0
        const dir = sortDir === 'desc' ? -1 : 1
        if (sortBy === 'clicks') return (a.clicks - b.clicks) * dir
        return (new Date(a.createdAt) - new Date(b.createdAt)) * dir
      })
    : []

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '720px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <TableHeader sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
      {hasLinks ? (
        sorted.map((link) => (
          <LinkRow
            key={link.id}
            link={link}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      ) : (
        <EmptyState />
      )}
    </div>
  )
}
