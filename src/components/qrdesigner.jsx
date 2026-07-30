'use client'

import { useMemo } from 'react'
import Switch from '@/components/switch'
import Tooltip from '@/components/tooltip'
import LogoMark from '@/components/logomark'

// ─── QrDesigner ───
// Node 149:941. Step two of the QR flow: once a destination exists, this
// is where the code itself gets styled.
//
// The preview is a representative render, not a real QR — which is what
// the design's own footnote says it is ("This code is preview only ...
// Your code will be generated once you finish creating it"). It reacts
// to every control so the choices are legible, but it encodes nothing.
// A real encoder comes in when the QrCode write path does.

// Swatch values are literal hex, deliberately. Most exist in the token
// set only under semantic names (--success-base, --info-base), and using
// those here would claim a green QR means "success". More importantly a
// QR's colour is stored data, not theming: pick orange and it stays
// orange in dark mode, because the printed sticker doesn't have a theme.
export const QR_COLORS = [
  { id: 'black', hex: '#000000' },
  { id: 'pink', hex: '#fb4ba3' },
  { id: 'orange', hex: '#fa7319' },
  { id: 'yellow', hex: '#f6b51e' },
  { id: 'green', hex: '#1fc16b' },
  { id: 'teal', hex: '#22d3bb' },
  { id: 'sky', hex: '#47c2ff' },
  { id: 'blue', hex: '#335cff' },
  { id: 'purple', hex: '#7d52f4' },
]

export const QR_PATTERNS = [
  { id: 'square', label: 'Square' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'dots', label: 'Dots' },
  { id: 'classy', label: 'Classy' },
  { id: 'diamond', label: 'Diamond' },
  { id: 'cross', label: 'Cross' },
]

function CheckIcon() {
  return (
    <svg
      width='20'
      height='20'
      viewBox='0 0 20 20'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M5.5 10.5 8.5 13.5 14.5 6.5'
        stroke='#ffffff'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M8 2.5v7.5M5 7.5 8 10.5 11 7.5M3 12.5h10'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden='true'
    >
      <rect
        x='5.5'
        y='5.5'
        width='8'
        height='8'
        rx='1.5'
        stroke='currentColor'
        strokeWidth='1.3'
      />
      <path
        d='M3.5 10.5V4A1.5 1.5 0 0 1 5 2.5H10.5'
        stroke='currentColor'
        strokeWidth='1.3'
        strokeLinecap='round'
      />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg
      width='18'
      height='18'
      viewBox='0 0 18 18'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M9 12.5V4M6 7 9 4l3 3M3.5 13.5h11'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

// Deterministic module grid. Seeded so a given set of choices always
// renders the same preview — a pattern that reshuffled on every keystroke
// would look like the code itself was changing.
function useModules(seed, size) {
  return useMemo(() => {
    let s = seed
    const rnd = () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff
      return s / 0x7fffffff
    }
    const cells = []
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const inFinder =
          (x < 7 && y < 7) || (x > size - 8 && y < 7) || (x < 7 && y > size - 8)
        // Cleared for the logo when branding is on — real encoders raise
        // the error-correction level to survive this, which is why a
        // centre cut-out is viable at all.
        const mid = size / 2
        const inLogo = Math.abs(x - mid) < 3.5 && Math.abs(y - mid) < 3.5
        if (inFinder || inLogo) continue
        if (rnd() > 0.5) cells.push([x, y])
      }
    }
    return cells
  }, [seed, size])
}

function Module({ x, y, pattern, color }) {
  const common = { fill: color }
  if (pattern === 'dots') {
    return <circle cx={x + 0.5} cy={y + 0.5} r={0.42} {...common} />
  }
  if (pattern === 'rounded') {
    return (
      <rect
        x={x + 0.05}
        y={y + 0.05}
        width={0.9}
        height={0.9}
        rx={0.32}
        {...common}
      />
    )
  }
  if (pattern === 'classy') {
    return (
      <rect
        x={x + 0.05}
        y={y + 0.05}
        width={0.9}
        height={0.9}
        rx={0.45}
        ry={0.15}
        {...common}
      />
    )
  }
  if (pattern === 'diamond') {
    return (
      <polygon
        points={`${x + 0.5},${y + 0.04} ${x + 0.96},${y + 0.5} ${x + 0.5},${y + 0.96} ${x + 0.04},${y + 0.5}`}
        {...common}
      />
    )
  }
  if (pattern === 'cross') {
    return (
      <path
        d={`M${x + 0.35},${y + 0.05} h0.3 v0.3 h0.3 v0.3 h-0.3 v0.3 h-0.3 v-0.3 h-0.3 v-0.3 h0.3 z`}
        {...common}
      />
    )
  }
  return <rect x={x} y={y} width={1} height={1} {...common} />
}

function Finder({ x, y, pattern, color }) {
  const rx =
    pattern === 'dots' || pattern === 'classy'
      ? 2.2
      : pattern === 'rounded'
        ? 1.6
        : 0
  const innerRx =
    pattern === 'dots' || pattern === 'classy'
      ? 1.5
      : pattern === 'rounded'
        ? 0.6
        : 0
  return (
    <g>
      <rect x={x} y={y} width={7} height={7} rx={rx} fill={color} />
      <rect
        x={x + 1}
        y={y + 1}
        width={5}
        height={5}
        rx={Math.max(0, rx - 0.7)}
        fill='#f7f7f7'
      />
      <rect
        x={x + 2}
        y={y + 2}
        width={3}
        height={3}
        rx={innerRx}
        fill={color}
      />
    </g>
  )
}

function QrPreview({ color, markerColor, pattern, branding }) {
  const SIZE = 25
  const modules = useModules(1337, SIZE)

  return (
    <div
      style={{
        width: '100%',
        height: '180px',
        borderRadius: '12px',
        background: 'var(--bg-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'relative', width: '132px', height: '132px' }}>
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          width='132'
          height='132'
          role='img'
          aria-label='QR code preview'
          style={{ display: 'block' }}
        >
          {modules.map(([x, y]) => (
            <Module
              key={`${x}-${y}`}
              x={x}
              y={y}
              pattern={pattern}
              color={color}
            />
          ))}
          <Finder x={0} y={0} pattern={pattern} color={markerColor} />
          <Finder x={SIZE - 7} y={0} pattern={pattern} color={markerColor} />
          <Finder x={0} y={SIZE - 7} pattern={pattern} color={markerColor} />
        </svg>

        {branding ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <LogoMark size={30} />
          </div>
        ) : null}
      </div>
    </div>
  )
}

function Swatch({ hex, selected, onSelect, label }) {
  return (
    <button
      type='button'
      onClick={onSelect}
      aria-label={label}
      aria-pressed={selected}
      className='qr-swatch'
      style={{
        width: '30px',
        height: '30px',
        flexShrink: 0,
        borderRadius: 'var(--radius-full)',
        background: hex,
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Ring sits outside the circle so selection never changes its
        // size — swatches shifting by a few pixels as you click along the
        // row is the kind of thing that reads as a bug.
        boxShadow: selected
          ? '0 0 0 2px var(--bg-default), 0 0 0 4px rgba(250, 115, 25, 0.24)'
          : 'none',
        transition: 'box-shadow 0.15s ease',
      }}
    >
      {selected ? <CheckIcon /> : null}
    </button>
  )
}

function ColorRow({ label, value, onChange }) {
  const current = QR_COLORS.find((c) => c.hex === value) || QR_COLORS[0]
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: '100%',
      }}
    >
      <p
        className='label-xs'
        style={{ color: 'var(--text-strong)', margin: 0 }}
      >
        {label}
      </p>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
            background: 'var(--bg-surface)',
            borderRadius: '24px',
            padding: '2px 16px 2px 2px',
          }}
        >
          <span
            aria-hidden='true'
            style={{
              width: '30px',
              height: '30px',
              borderRadius: 'var(--radius-full)',
              background: current.hex,
              transition: 'background 0.15s ease',
            }}
          />
          <p
            className='label-xs'
            style={{ color: 'var(--text-strong)', margin: 0 }}
          >
            {current.hex.toUpperCase()}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
          }}
        >
          {QR_COLORS.map((c) => (
            <Swatch
              key={c.id}
              hex={c.hex}
              label={`${label}: ${c.id}`}
              selected={c.hex === current.hex}
              onSelect={() => onChange(c.hex)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function QrDesigner({
  color,
  markerColor,
  pattern,
  branding,
  onChange,
}) {
  function set(key, val) {
    onChange({ color, markerColor, pattern, branding, [key]: val })
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* ─── Preview ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <p
              className='label-xs'
              style={{ color: 'var(--text-strong)', margin: 0 }}
            >
              Preview
            </p>
            {/* Both disabled, which is the footnote below made actionable:
                the preview encodes nothing, so letting someone download or
                copy it would hand them a QR that scans to nothing. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tooltip label='Available once created'>
                <button
                  type='button'
                  disabled
                  aria-label='Download QR code'
                  className='qr-preview-action'
                  style={{
                    display: 'flex',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--text-soft)',
                    cursor: 'not-allowed',
                  }}
                >
                  <DownloadIcon />
                </button>
              </Tooltip>
              <Tooltip label='Available once created'>
                <button
                  type='button'
                  disabled
                  aria-label='Copy QR code'
                  className='qr-preview-action'
                  style={{
                    display: 'flex',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--text-soft)',
                    cursor: 'not-allowed',
                  }}
                >
                  <CopyIcon />
                </button>
              </Tooltip>
            </div>
          </div>

          <QrPreview
            color={color}
            markerColor={markerColor}
            pattern={pattern}
            branding={branding}
          />
        </div>

        {/* ─── Branding ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <p
              className='label-xs'
              style={{ color: 'var(--text-strong)', margin: 0 }}
            >
              Branding
            </p>
            {/* The existing Switch, on its primary tone — the design's
                toggle is orange, which is --primary-base. */}
            <Switch
              checked={branding}
              onChange={(next) => set('branding', next)}
              tone='primary'
              size='sm'
              label='Show branding on the code'
              hideLabel
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  width: '36px',
                  height: '36px',
                  flexShrink: 0,
                  borderRadius: '10px',
                  background: 'var(--bg-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LogoMark size={22} />
              </span>
              <p
                className='para-xs'
                style={{ color: 'var(--text-strong)', margin: 0 }}
              >
                Luotain branding
              </p>
            </div>

            <button
              type='button'
              onClick={() => {
                // TODO: needs somewhere to put the file. Uploading a
                // custom logo means storage plus a column on QrCode, and
                // neither exists yet.
              }}
              className='qr-upload'
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                borderRadius: 'var(--radius-full)',
                color: 'var(--text-strong)',
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                lineHeight: '20px',
                letterSpacing: '0.28px',
              }}
            >
              Upload
              <UploadIcon />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Patterns ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p
          className='label-xs'
          style={{ color: 'var(--text-strong)', margin: 0 }}
        >
          Patterns
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          {QR_PATTERNS.map((p) => {
            const active = p.id === pattern
            return (
              <button
                key={p.id}
                type='button'
                onClick={() => set('pattern', p.id)}
                aria-label={p.label}
                aria-pressed={active}
                className='qr-pattern'
                style={{
                  width: '65px',
                  height: '65px',
                  flexShrink: 0,
                  padding: '8px',
                  borderRadius: '12px',
                  background: 'var(--bg-surface)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: active
                    ? '0 0 0 2px var(--bg-default), 0 0 0 4px rgba(250, 115, 25, 0.24)'
                    : 'none',
                  transition: 'box-shadow 0.15s ease',
                }}
              >
                {/* Each swatch previews its own pattern rather than being
                    a static thumbnail, so the choice is legible before
                    you make it. */}
                <svg
                  viewBox='0 0 9 9'
                  width='40'
                  height='40'
                  aria-hidden='true'
                >
                  {[
                    [0, 0],
                    [1, 0],
                    [3, 0],
                    [4, 0],
                    [6, 0],
                    [0, 1],
                    [2, 1],
                    [4, 1],
                    [7, 1],
                    [1, 2],
                    [3, 2],
                    [5, 2],
                    [6, 2],
                    [8, 2],
                    [0, 3],
                    [2, 3],
                    [4, 3],
                    [7, 3],
                    [1, 4],
                    [3, 4],
                    [5, 4],
                    [8, 4],
                    [0, 5],
                    [2, 5],
                    [4, 5],
                    [6, 5],
                    [7, 5],
                    [1, 6],
                    [3, 6],
                    [5, 6],
                    [8, 6],
                    [0, 7],
                    [2, 7],
                    [4, 7],
                    [6, 7],
                    [1, 8],
                    [3, 8],
                    [5, 8],
                    [7, 8],
                    [8, 8],
                  ].map(([x, y]) => (
                    <Module
                      key={`${x}-${y}`}
                      x={x}
                      y={y}
                      pattern={p.id}
                      color='var(--text-strong)'
                    />
                  ))}
                </svg>
              </button>
            )
          })}
        </div>
      </div>

      <ColorRow
        label='Color'
        value={color}
        onChange={(hex) => set('color', hex)}
      />
      <ColorRow
        label='Marker color'
        value={markerColor}
        onChange={(hex) => set('markerColor', hex)}
      />

      <p className='para-xs' style={{ color: 'var(--text-soft)', margin: 0 }}>
        This code is preview only, so don&rsquo;t copy it just yet. Your code
        will be generated once you finish creating it.
      </p>
    </div>
  )
}
