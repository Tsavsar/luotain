'use client'

import {
  COL_LINK,
  COL_DESTINATION,
  COL_DATE,
  COL_CLICKS,
} from '@/components/linktablehelpers'

// ─── Loading skeletons ───
// Shaped like the content they replace, so the page doesn't reflow when data
// arrives. A spinner in the middle of a list is a smaller lie than a skeleton
// of the wrong shape — but a skeleton of the RIGHT shape is better than both,
// because the layout is already correct before anything loads.
//
// All of them are aria-hidden: a screen reader announcing eight empty rows is
// worse than silence. The container that holds them carries the live region.

function Block({ w, h = 12, radius = 6, style }) {
  return (
    <div
      className='skeleton-pulse'
      style={{
        // The shared class animates opacity only, so the fill has to come from
        // here — without it these are invisible boxes pulsing at nothing.
        background: 'var(--bg-layer)',
        width: typeof w === 'number' ? `${w}px` : w,
        height: `${h}px`,
        borderRadius: `${radius}px`,
        flexShrink: 0,
        ...style,
      }}
    />
  )
}

// Widths vary per row rather than repeating one value. A column of identical
// bars reads as a pattern; varied ones read as content that hasn't arrived.
const ROW_WIDTHS = ['62%', '48%', '71%', '55%', '66%', '43%', '58%', '69%']

// ─── Links ───
// Built from the table's OWN column constants rather than percentages. The
// first version was a generic list of bars — the right idea, the wrong
// silhouette, so the layout still jumped when the real rows arrived.
//
// 720px min-width and an 8px row gap, matching LinksTable exactly.
export function LinkRowsSkeleton({ rows = 6 }) {
  // Two cell styles, because the real table has two. Its HEADER cells sit on
  // --bg-surface; its ROWS are transparent. Filling both meant the skeleton
  // showed a grid of grey plates where the real table shows bare rows, which
  // is what made it look wrong rather than merely unloaded.
  const rowCell = {
    display: 'flex',
    alignItems: 'center',
    borderRadius: '6px',
    padding: '4px 10px',
    height: '44px',
    boxSizing: 'border-box',
  }
  const headCell = {
    ...rowCell,
    background: 'var(--bg-surface)',
    height: '28px',
  }

  return (
    <div
      className='chart-full-bleed'
      style={{ width: '100%', maxWidth: '720px' }}
    >
      <div className='table-scroll'>
        <div
          aria-hidden='true'
          style={{
            minWidth: '720px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {/* The header too. It's the first thing that renders and the thing
              the columns line up against — leaving it out meant the whole
              table shifted down when it appeared. */}
          <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
            {[COL_LINK, COL_DESTINATION, COL_CLICKS, COL_DATE].map((w, i) => (
              <div key={i} style={{ ...headCell, width: w, flexShrink: 0 }}>
                <Block w={i === 2 ? 44 : 58} h={8} radius={4} />
              </div>
            ))}
          </div>

          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: '6px', width: '100%' }}>
              <div
                style={{
                  ...rowCell,
                  width: COL_LINK,
                  flexShrink: 0,
                  gap: '8px',
                }}
              >
                <Block w={20} h={20} radius={5} />
                <Block
                  w={ROW_WIDTHS[i % ROW_WIDTHS.length]}
                  h={10}
                  radius={4}
                />
              </div>

              <div
                style={{
                  ...rowCell,
                  width: COL_DESTINATION,
                  flexShrink: 0,
                  gap: '8px',
                }}
              >
                <Block w={16} h={16} radius={4} />
                <Block w={`${52 + ((i * 9) % 26)}%`} h={10} radius={4} />
              </div>

              <div style={{ ...rowCell, width: COL_CLICKS, flexShrink: 0 }}>
                <Block w={34} h={10} radius={4} />
              </div>

              <div
                style={{
                  ...rowCell,
                  width: COL_DATE,
                  flexShrink: 0,
                  gap: '8px',
                }}
              >
                <Block w={72} h={10} radius={4} />
                <span style={{ flex: '1 0 0' }} />
                <Block w={18} h={18} radius={5} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// The stats row above the list. Same 82px height, 14px radius, --bg-light and
// 720px cap as StatsCards — read off that component rather than guessed, since
// a cap of the wrong width shifts the whole page when the real cards land.
export function StatsSkeleton({ tiles = 3 }) {
  return (
    <div
      aria-hidden='true'
      style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '720px' }}
    >
      {Array.from({ length: tiles }).map((_, i) => (
        <div
          key={i}
          style={{
            minWidth: 0,
            flex: '1 0 0',
            height: '82px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '10px',
            padding: '12px 14px',
            borderRadius: '14px',
            background: 'var(--bg-light)',
            boxSizing: 'border-box',
          }}
        >
          <Block w={62} h={9} radius={4} />
          <Block w={i === 2 ? 74 : 56} h={20} radius={5} />
        </div>
      ))}
    </div>
  )
}

// ─── QR codes ───

export function QrCardsSkeleton({ cards = 4 }) {
  return (
    <div aria-hidden='true' className='qr-grid-cards'>
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: '14px',
            alignItems: 'center',
            padding: '14px',
            borderRadius: '12px',
            background: 'var(--bg-surface)',
          }}
        >
          <Block w={64} h={64} radius={10} />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              flex: '1 0 0',
            }}
          >
            <Block w={ROW_WIDTHS[i % ROW_WIDTHS.length]} h={12} />
            <Block w='40%' h={9} radius={4} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function QrGallerySkeleton({ tiles = 8 }) {
  return (
    <div aria-hidden='true' className='qr-grid-gallery'>
      {Array.from({ length: tiles }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            alignItems: 'center',
            padding: '16px',
            borderRadius: '12px',
            background: 'var(--bg-surface)',
          }}
        >
          {/* Square, matching the code it stands in for — a rectangle here
              would make every tile resize when the real codes land. */}
          <Block
            w='100%'
            h={0}
            radius={10}
            style={{ aspectRatio: '1 / 1', height: 'auto' }}
          />
          <Block w='64%' h={9} radius={4} />
        </div>
      ))}
    </div>
  )
}

export function QrTableSkeleton({ rows = 7 }) {
  return (
    <div
      aria-hidden='true'
      style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '12px',
            borderRadius: '9px',
          }}
        >
          <Block w={30} h={30} radius={7} />
          <Block
            w={ROW_WIDTHS[i % ROW_WIDTHS.length]}
            h={11}
            style={{ flex: '0 1 auto' }}
          />
          <span style={{ flex: '1 0 0' }} />
          <Block w={52} h={10} />
          <Block w={38} h={10} />
        </div>
      ))}
    </div>
  )
}
