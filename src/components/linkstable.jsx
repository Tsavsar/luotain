'use client'

import { useState } from 'react'
import EmptyStateIcon from './emptystateicon'
import { Dropdown, DropdownMenu, DropdownOption } from './dropdown'
import { toast } from './toast'
import DeleteConfirmModal from './deleteconfirmmodal'
import {
  formatRowDate,
  hostnameOf,
  DestinationIcon,
  SortIcon,
  CopyIcon,
  MoreIcon,
  COL_LINK,
  COL_DESTINATION,
  COL_DATE,
  COL_CLICKS,
} from './linktablehelpers'

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
        <DropdownOption danger onClick={(e) => onDelete?.(link, e)}>
          Delete
        </DropdownOption>
      </DropdownMenu>
    </Dropdown>
  )
}

// ─── One row ───
// zIndex is positional, not tied to hover/open state — every row
// permanently outranks every row after it in the list. That state-
// free approach is on purpose: tying it to `hovered` (as this used
// to) meant the elevation dropped back to 'auto' the moment the
// mouse left the row, even while its dropdown — opened by a click,
// tracked entirely inside Dropdown, invisible to this component —
// was still open. Since every dropdown here opens downward into
// whatever rows follow it, "always above the rows after it" covers
// the open-menu case without needing to know whether one actually
// is open.
function LinkRow({ link, zIndex, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false)

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
        position: 'relative',
        zIndex,
        display: 'flex',
        gap: '6px',
        width: '100%',
        alignItems: 'center',
        padding: '4px 0',
      }}
    >
      {/* Hover background as its own layer instead of padding +
          negative margin on the row itself. The old trick tangled
          the visual overhang up with the row's actual box: under
          border-box sizing, width:100% + 16px of padding meant the
          COLUMNS' space shrank by 16px while the box grew to 736 —
          off-center and misaligned at the same time. This layer
          hangs 8px past each side purely visually; the row's real
          box stays exactly 720px and the columns never know the
          difference. zIndex -1 tucks it behind the row's content
          (the row's own zIndex makes that self-contained). */}
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

      {/* Absolutely positioned — takes up no space in the row's own
          flex layout, so it can't push or reflow the real columns
          (same guarantee the old reserved-width slot had), but also
          doesn't leave a permanent empty gap sitting at the row's
          end the way that reserved space did. Sits over the tail of
          the Date column, which date strings ("3rd July, 2026")
          don't fill anyway, so nothing real is ever covered.
          Permanently visible now, not hover-gated — detecting touch
          vs. mouse reliably enough to gate visibility on it turned
          out not to hold up on the actual device this runs on, so
          rather than try a third detection heuristic, it's just
          always there and always tappable. */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
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
  // The link a row's "Delete" was clicked for, plus where that click
  // happened on screen — non-null link means the confirm modal is
  // open for that link. Clicking Delete in a row no longer deletes
  // directly; it requests confirmation, and the real onDelete (from
  // the page) only fires once that's granted.
  const [pendingDelete, setPendingDelete] = useState({
    link: null,
    origin: null,
  })

  // e is the click event DropdownOption now forwards — used only to
  // find where the click happened, never read for anything else.
  function requestDelete(link, e) {
    const rect = e.currentTarget.getBoundingClientRect()
    setPendingDelete({
      link,
      origin: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
    })
  }

  // Three clicks, not two: desc -> asc -> back to unsorted, then the
  // cycle repeats. Previously the second state just toggled forever
  // between desc/asc with no way back to the original order.
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
    // Table content is a fixed 720px wide (matches the desktop
    // column widths from Figma) — on a phone screen that's wider
    // than the viewport, so it scrolls horizontally there.
    // table-scroll only turns that scrolling on at mobile widths:
    // on desktop the wrapper stays overflow: visible, because an
    // overflow-x: auto wrapper measures EVERYTHING inside it —
    // including an open row dropdown hanging past the content's
    // edge — and grows scrollbars to fit it (auto-x silently forces
    // auto-y too, hence the vertical bar that was appearing).
    // Desktop content fits its container exactly, so it needs no
    // scroll machinery at all.
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
          {hasLinks ? (
            sorted.map((link, index) => (
              <LinkRow
                key={link.id}
                link={link}
                zIndex={sorted.length - index}
                onEdit={onEdit}
                onDelete={requestDelete}
              />
            ))
          ) : (
            <EmptyState />
          )}
        </div>
      </div>

      <DeleteConfirmModal
        open={pendingDelete.link !== null}
        onClose={() => setPendingDelete({ link: null, origin: null })}
        onConfirm={() => onDelete?.(pendingDelete.link)}
        itemType='link'
        itemLabel={pendingDelete.link?.shortUrl}
        origin={pendingDelete.origin}
      />
    </div>
  )
}
