'use client'

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
export function LinkRowsSkeleton({ rows = 6 }) {
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
            padding: '14px 12px',
            borderRadius: '10px',
          }}
        >
          <Block w={36} h={36} radius={8} />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '7px',
              flex: '1 0 0',
            }}
          >
            <Block w={ROW_WIDTHS[i % ROW_WIDTHS.length]} h={12} />
            <Block w={`${34 + ((i * 7) % 22)}%`} h={9} radius={4} />
          </div>

          <Block w={44} h={11} />
          <Block w={26} h={26} radius={8} />
        </div>
      ))}
    </div>
  )
}

// The stats row above the list, so the numbers don't pop in and push the list
// down the moment they resolve.
export function StatsSkeleton({ tiles = 3 }) {
  return (
    <div
      aria-hidden='true'
      style={{ display: 'flex', gap: '12px', width: '100%' }}
    >
      {Array.from({ length: tiles }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            flex: '1 0 0',
            padding: '16px',
            borderRadius: '12px',
            background: 'var(--bg-surface)',
          }}
        >
          <Block w={64} h={9} radius={4} />
          <Block w={82} h={22} radius={6} />
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
