'use client'

import { useEffect, useState } from 'react'
import EmptyStateIcon from './emptystateicon'
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

// Shown in place of the favicon when one isn't available — recolored
// from the sample's literal #e8e8e8 to var(--bg-subtle), which is
// what that hex already matches almost exactly, so it stays
// theme-correct instead of freezing at one specific gray forever.
function NoFaviconIcon() {
  return (
    <svg width='16' height='16' viewBox='0 0 20 20' fill='none'>
      <g fill='var(--bg-subtle)'>
        <path
          d='m10,17c-1.3807,0-2.5-3.134-2.5-7s1.1193-7,2.5-7c1.1019,0,2.0373,1.9961,2.3701,4.7674'
          fill='none'
          stroke='var(--bg-subtle)'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
        />
        <path
          d='m10,17c-3.866,0-7-3.134-7-7s3.134-7,7-7c3.6244,0,6.6054,2.7545,6.9639,6.2843'
          fill='none'
          stroke='var(--bg-subtle)'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
        />
        <line
          x1='3'
          y1='10'
          x2='8.5'
          y2='10'
          fill='none'
          stroke='var(--bg-subtle)'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
        />
        <polygon
          points='11.5 11 17.5 13 14.5 14 13.5 17 11.5 11'
          fill='var(--bg-subtle)'
          stroke='var(--bg-subtle)'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
        />
      </g>
    </svg>
  )
}

// Tries the favicon first, swaps to NoFaviconIcon on load failure
// instead of just leaving a blank gap where a broken image used to
// silently hide itself.
function DestinationIcon({ domain }) {
  const [failed, setFailed] = useState(false)
  if (!domain || failed) return <NoFaviconIcon />
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`}
      alt=''
      width={16}
      height={16}
      style={{ borderRadius: '4px', flexShrink: 0 }}
      onError={() => setFailed(true)}
    />
  )
}

// Same chevron shape already established elsewhere, but re-framed —
// lifting just one arm out of the original icon while keeping its
// full 20x20 canvas left the shape sitting tiny and off-center in
// one corner, since that arm only ever occupied a sliver of that
// canvas. This viewBox is fitted to just the arm itself.
function SortIcon() {
  return (
    <svg width='14' height='14' viewBox='0 0 12 8' fill='none'>
      <path
        d='M2 6L6 2L10 6'
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
// Fixed instead of flex:1 — Link + Destination + Date + More already
// account for 610px, plus 24px of gaps between the 5 columns, which
// only leaves exactly 86px within the table's own 720px cap (same
// width every other section on this page already uses). A flexible
// Clicks column was absorbing whatever was left of THAT math
// unpredictably, which is what made the table's real rendered width
// drift out of alignment with the stats bar above it.
const COL_CLICKS = '86px'

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
          width: COL_CLICKS,
          flexShrink: 0,
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
        <DestinationIcon domain={hostnameOf(link.destination)} />
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

      <div style={{ ...cellBase, width: COL_CLICKS, flexShrink: 0 }}>
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
