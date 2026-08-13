'use client'

// ─── Theme preview cards ───
// Node 551:1855. Light, Dark and System, each a miniature of the app.
//
// The palettes are HARDCODED hex, not tokens, and that's the whole point: these
// illustrate what a theme looks like, so a Dark card that turns light when you're
// in light mode would be showing you the opposite of what it's offering. Every
// other surface in the app uses tokens; this is the one place that must not.
//
// SVG rather than PNGs, as asked. It's ~2KB, scales to any density without a 2x
// and 3x set, and the mini-UI is all rectangles — a raster version would be
// bigger AND blurrier.
//
// The bars stand in for text rather than rendering real strings. The Figma has
// actual text at 1.507px, which is illegible at that size and would fight the
// person's font settings for no benefit.

const LIGHT = {
  window: '#ffffff',
  card: '#f7f7f7',
  border: 'rgba(0, 0, 0, 0.1)',
  ring: '#f5f5f5',
  bar: '#ebebeb',
  strong: '#d1d1d1',
  metric: '#fcfcfc',
  pill: '#f7f7f7',
  hair: 'rgba(0, 0, 0, 0.05)',
}

const DARK = {
  window: '#171717',
  card: '#292929',
  border: 'rgba(255, 255, 255, 0.1)',
  ring: '#292929',
  bar: '#333333',
  strong: '#5c5c5c',
  metric: '#292929',
  pill: '#1c1c1c',
  hair: 'rgba(255, 255, 255, 0.05)',
}

// The miniature. Drawn 64 wide but the window inside runs past the right edge,
// which is what the design does — it reads as a window cropped by the card
// rather than a whole screen squeezed into 64px.
function Miniature({ p, id }) {
  return (
    <svg
      width='64'
      height='48'
      viewBox='0 0 64 48'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
      style={{ display: 'block' }}
    >
      <defs>
        <clipPath id={`${id}-clip`}>
          <rect x='0' y='0' width='64' height='48' rx='9' />
        </clipPath>
      </defs>

      <g clipPath={`url(#${id}-clip)`}>
        <rect x='0' y='0' width='64' height='48' fill={p.card} />

        {/* The app window, running off the right edge. */}
        <rect x='5' y='5' width='72' height='60' rx='4' fill={p.window} />

        {/* Header: avatar, org name, and the profile mark on the right. */}
        <circle cx='10' cy='10.5' r='2' fill={p.strong} />
        <rect x='13.5' y='9.5' width='7' height='2' rx='0.5' fill={p.bar} />
        <circle cx='27' cy='10.5' r='2' fill={p.bar} />

        {/* Stats row: a label bar and the range picker. */}
        <rect x='8' y='16' width='6' height='1.6' rx='0.4' fill={p.bar} />
        <rect x='20' y='16' width='5' height='1.6' rx='0.4' fill={p.bar} />

        {/* The four metric cards. */}
        <rect
          x='7.6'
          y='19.4'
          width='56'
          height='9'
          rx='2'
          fill={p.window}
          stroke={p.hair}
          strokeWidth='0.4'
        />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect
              x={8.4 + i * 13.8}
              y={20.2}
              width='12.4'
              height='7.4'
              rx='1.4'
              fill={p.metric}
            />
            <rect
              x={9.6 + i * 13.8}
              y={21.6}
              width='6'
              height='1.4'
              rx='0.4'
              fill={p.bar}
            />
            <rect
              x={9.6 + i * 13.8}
              y={24}
              width='3.4'
              height='2.4'
              rx='0.6'
              fill={p.strong}
            />
          </g>
        ))}

        {/* Table header: four column pills. */}
        {[
          [8, 13],
          [21.6, 14],
          [36.2, 9],
          [46, 14],
        ].map(([x, w], i) => (
          <rect
            key={i}
            x={x}
            y={31}
            width={w}
            height='3.4'
            rx='0.8'
            fill={p.pill}
          />
        ))}

        {/* Two rows of content. */}
        {[36.4, 41.2].map((y, r) => (
          <g key={r}>
            <rect x='9' y={y} width='10' height='1.6' rx='0.4' fill={p.bar} />
            <rect
              x='22.6'
              y={y}
              width='11'
              height='1.6'
              rx='0.4'
              fill={p.bar}
            />
            <rect x='37.2' y={y} width='4' height='1.6' rx='0.4' fill={p.bar} />
            <rect x='47' y={y} width='9' height='1.6' rx='0.4' fill={p.bar} />
          </g>
        ))}
      </g>
    </svg>
  )
}

// System: the left half of the light card beside the right half of the dark one.
// Two clipped windows rather than a diagonal split, matching the design — and it
// reads more clearly, since each half is recognisably a whole theme rather than
// a wedge of one.
function SystemMiniature() {
  return (
    <div style={{ display: 'flex', width: '64px', height: '48px' }}>
      <div style={{ width: '32px', height: '48px', overflow: 'hidden' }}>
        <Miniature p={LIGHT} id='theme-sys-light' />
      </div>
      <div style={{ width: '32px', height: '48px', overflow: 'hidden' }}>
        {/* Shifted left so the dark half shows the SAME part of the window as
            the light half does. Without the offset the right side would show the
            window's tail and the two halves wouldn't line up. */}
        <div style={{ marginLeft: '-32px' }}>
          <Miniature p={DARK} id='theme-sys-dark' />
        </div>
      </div>
    </div>
  )
}

function Card({ id, label, selected, onSelect }) {
  const p = id === 'dark' ? DARK : LIGHT

  return (
    <button
      type='button'
      onClick={() => onSelect(id)}
      aria-pressed={selected}
      className='theme-card'
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          display: 'block',
          width: '64px',
          height: '48px',
          borderRadius: '10px',
          overflow: 'hidden',
          // The border is the selected state, so it's on the wrapper rather than
          // inside the SVG — a stroke in the SVG would scale with it.
          border: `1px solid ${selected ? 'var(--primary-base)' : p.border}`,
          // Focus-active from the design: a 2px ring in the page background to
          // separate it, then 4px of soft orange. The unselected ring is the
          // design's 1.5px in the card colour, which lifts the card off the page.
          boxShadow: selected
            ? '0 0 0 2px var(--bg-default), 0 0 0 4px rgba(250, 115, 25, 0.24)'
            : `0 0 0 1.5px ${p.ring}`,
          transition:
            'border-color var(--duration-fast) ease, box-shadow var(--duration-fast) ease',
        }}
      >
        {id === 'system' ? (
          <SystemMiniature />
        ) : (
          <Miniature p={p} id={`theme-${id}`} />
        )}
      </span>

      <span
        className='para-xs'
        style={{
          // The label follows the theme, unlike the card — it's UI text, and
          // hardcoding it would make it illegible in one mode or the other.
          color: selected ? 'var(--text-strong)' : 'var(--text-soft)',
          letterSpacing: '0.2px',
          transition: 'color var(--duration-fast) ease',
        }}
      >
        {label}
      </span>
    </button>
  )
}

export default function ThemePreview({ value, onChange }) {
  return (
    <div
      role='group'
      aria-label='Theme'
      style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}
    >
      <Card
        id='light'
        label='Light'
        selected={value === 'light'}
        onSelect={onChange}
      />
      <Card
        id='dark'
        label='Dark'
        selected={value === 'dark'}
        onSelect={onChange}
      />
      <Card
        id='system'
        label='System'
        selected={value === 'system'}
        onSelect={onChange}
      />
    </div>
  )
}
