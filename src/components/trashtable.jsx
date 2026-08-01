'use client'

import { useState } from 'react'
import EmptyStateIcon from './emptystateicon'
import { Dropdown, DropdownMenu, DropdownOption } from './dropdown'
import {
  hostnameOf,
  DestinationIcon,
  SortIcon,
  MoreIcon,
  COL_LINK,
  COL_DESTINATION,
  COL_DATE,
  COL_CLICKS,
} from './linktablehelpers'
import {
  RECOVERY_WINDOW_DAYS,
  WARNING_DAYS_REMAINING,
  daysSinceDeleted,
} from '@/lib/linkrecovery'

// Window and threshold come from the shared module rather than being
// redeclared here — this file, the trash page's copy, and three API
// routes all depend on the same number, and a local copy is how they
// drift apart.
function daysAgo(deletedAt) {
  return daysSinceDeleted(deletedAt)
}

function formatDeletedAgo(deletedAt) {
  const days = daysAgo(deletedAt)
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

function isNearlyGone(deletedAt) {
  return RECOVERY_WINDOW_DAYS - daysAgo(deletedAt) <= WARNING_DAYS_REMAINING
}

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
        <span style={{ display: 'flex' }}>
          <SortIcon direction={sortBy === 'clicks' ? sortDir : null} />
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
        onClick={() => onSort('deleted')}
      >
        <span className='para-xs' style={{ color: 'var(--text-sub)' }}>
          Deleted
        </span>
        <span style={{ display: 'flex' }}>
          <SortIcon direction={sortBy === 'deleted' ? sortDir : null} />
        </span>
      </div>
    </div>
  )
}

// ─── Row actions menu ───
function MoreMenu({ item, onViewDetails, onRecover }) {
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
        <DropdownOption onClick={() => onViewDetails?.(item)}>
          View details
        </DropdownOption>
        <DropdownOption onClick={() => onRecover?.(item)}>
          Recover
        </DropdownOption>
      </DropdownMenu>
    </Dropdown>
  )
}

// ─── One row ───
function TrashRow({ item, zIndex, onViewDetails, onRecover }) {
  const [hovered, setHovered] = useState(false)
  const nearlyGone = isNearlyGone(item.deletedAt)
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
      onClick={() => onViewDetails?.(item)}
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
      {/* Same hover-background-as-its-own-layer trick as the main
          links table — the pill hangs 8px past each side purely
          visually, the row's real box stays exactly 720px and the
          columns never have to know it's there. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '-8px',
          right: '-8px',
          borderRadius: '8px',
          background: hovered ? 'var(--bg-surface)' : 'transparent',
          transition: 'background 0.1s ease',
          zIndex: -1,
        }}
      />

      <div style={{ ...cellBase, width: COL_LINK, flexShrink: 0 }}>
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
          {item.shortUrl}
        </p>
      </div>

      <div
        style={{
          ...cellBase,
          width: COL_DESTINATION,
          flexShrink: 0,
          gap: '4px',
        }}
      >
        <DestinationIcon domain={hostnameOf(item.destination)} />
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
          {item.destination}
        </p>
      </div>

      <div style={{ ...cellBase, width: COL_CLICKS, flexShrink: 0 }}>
        <p
          className='para-xs'
          style={{ color: 'var(--text-strong)', margin: 0 }}
        >
          {item.clicks}
        </p>
      </div>

      <div style={{ ...cellBase, width: COL_DATE, flexShrink: 0 }}>
        <p
          className='para-xs'
          style={{
            color: nearlyGone ? 'var(--error-base)' : 'var(--text-strong)',
            margin: 0,
          }}
        >
          {formatDeletedAgo(item.deletedAt)}
        </p>
      </div>

      {/* Absolutely positioned, same as the main table — no footprint
          in the row's own layout, always visible and tappable rather
          than gated behind a hover state that doesn't reliably fire
          on touch. */}
      <div
        // Stops menu clicks reaching the row's own handler — otherwise
        // opening the menu, or choosing Recover inside it, would
        // navigate to the detail page at the same time.
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      >
        <MoreMenu
          item={item}
          onViewDetails={onViewDetails}
          onRecover={onRecover}
        />
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
        Nothing in the trash
      </p>
    </div>
  )
}

// ─── Table ───
// `items` is [{ id, shortUrl, destination, clicks, deletedAt }, ...].
export default function TrashTable({ items, onViewDetails, onRecover }) {
  const [sortBy, setSortBy] = useState(null)
  const [sortDir, setSortDir] = useState('desc')

  function handleSort(col) {
    if (sortBy !== col) {
      setSortBy(col)
      setSortDir('desc')
    } else if (sortDir === 'desc') {
      setSortDir('asc')
    } else {
      setSortBy(null)
    }
  }

  // null/undefined = not loaded yet, [] = genuinely empty. Collapsing
  // those two into one state made the page flash "Nothing in the
  // trash" before the real rows arrived.
  const loaded = Array.isArray(items)
  const hasItems = loaded && items.length > 0
  const sorted = hasItems
    ? [...items].sort((a, b) => {
        if (!sortBy) return 0
        const dir = sortDir === 'desc' ? -1 : 1
        if (sortBy === 'clicks') return (a.clicks - b.clicks) * dir
        return (new Date(a.deletedAt) - new Date(b.deletedAt)) * dir
      })
    : []

  return (
    <div
      className='chart-full-bleed'
      style={{ width: '100%', maxWidth: '720px' }}
    >
      <div className='table-scroll'>
        <div
          style={{
            minWidth: '720px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <TableHeader sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
          {!loaded ? null : hasItems ? (
            sorted.map((item, index) => (
              <TrashRow
                key={item.id}
                item={item}
                zIndex={sorted.length - index}
                onViewDetails={onViewDetails}
                onRecover={onRecover}
              />
            ))
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  )
}
