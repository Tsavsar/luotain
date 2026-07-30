'use client'

import { useMemo, useState } from 'react'
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

// The real asset. Its #5C5C5C is --text-sub in the token set, but this
// uses currentColor instead so it follows the button's own colour — the
// Upload button fades back when branding is off, and a fixed stroke
// would stay full strength while the label beside it dimmed.
function UploadIcon() {
  return (
    <svg
      width='18'
      height='18'
      viewBox='0 0 18 18'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M5.40039 6.3002L9.00039 2.7002L12.6004 6.3002'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M9 10.8002V2.7002'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M15.3002 11.7002V12.6002C15.3002 14.0915 14.0915 15.3002 12.6002 15.3002H5.4002C3.9089 15.3002 2.7002 14.0915 2.7002 12.6002V11.7002'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

// Deterministic module grid. Seeded so a given set of choices always
// renders the same preview — a pattern that reshuffled on every keystroke
// would look like the code itself was changing.
function useModules(seed, size, hasLogo) {
  return useMemo(() => {
    let s = seed
    const rnd = () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff
      return s / 0x7fffffff
    }

    const cells = []
    const timing = []
    // The logo sits in the bottom-right corner — the one corner a QR
    // leaves empty, since the spec only puts finders in the other three.
    // Same footprint as a finder, so it reads as the fourth one rather
    // than as something dropped on top.
    const LOGO_SPAN = 7
    const logoFrom = size - LOGO_SPAN

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const inFinder =
          (x < 7 && y < 7) || (x > size - 8 && y < 7) || (x < 7 && y > size - 8)
        // The separator ring: real codes keep one blank module around
        // each finder, and without it the finders bled straight into the
        // surrounding noise.
        const inSeparator =
          (x < 8 && y < 8) || (x > size - 9 && y < 8) || (x < 8 && y > size - 9)
        // One module of clearance beyond the box itself, so modules
        // don't sit flush against its edge.
        const inLogo = hasLogo && x >= logoFrom - 1 && y >= logoFrom - 1

        // Timing patterns: the alternating row and column that run
        // between the finders. Fixed, not random — they're the strongest
        // visual cue that this is a QR rather than static.
        const isTimingRow = y === 6 && x >= 8 && x <= size - 9
        const isTimingCol = x === 6 && y >= 8 && y <= size - 9
        if (isTimingRow || isTimingCol) {
          if ((isTimingRow ? x : y) % 2 === 0) timing.push([x, y])
          continue
        }

        if (inFinder || inSeparator || inLogo) continue
        if (rnd() > 0.5) cells.push([x, y])
      }
    }

    // Alignment block, bottom right. One more piece of real QR anatomy.
    const ax = size - 9
    const ay = size - 9
    return { cells, timing, alignment: [ax, ay] }
  }, [seed, size, hasLogo])
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
        fill='#ffffff'
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
  // The quiet zone. A real QR needs clear space around it to be
  // scannable at all, and its absence was the main reason this looked
  // cramped — modules ran right to the edge of the render. Four modules
  // is the spec's own minimum.
  // Quiet zone trimmed from 4 modules to 2. The white card it sits on
  // already reads as clear space against the grey panel, so 4 was
  // effectively padding inside padding — and it was costing module size
  // for nothing.
  const QUIET = 2
  const TOTAL = SIZE + QUIET * 2
  // The card fills the 180px preview box with 2px to spare, rather than
  // floating at 148px with a band of grey above and below it.
  const CARD = 176
  const RENDER = CARD
  const { cells, timing, alignment } = useModules(1337, SIZE, branding)

  // Logo box geometry, all derived from the grid so it can't drift out of
  // alignment with the modules if any of these change.
  const LOGO_SPAN = 7 // same module footprint as a finder
  const LOGO_PADDING = 6 // px of clear space inside the box
  const unit = RENDER / TOTAL // px per module
  const logoBoxPx = LOGO_SPAN * unit
  // Distance from the svg's own left edge, which starts at -QUIET.
  const logoOffsetPx = (SIZE - LOGO_SPAN + QUIET) * unit
  const logoIconPx = logoBoxPx - LOGO_PADDING * 2

  // Matches the finder radius for the current pattern, so the box reads
  // as part of the same family rather than a foreign shape.
  const logoRadius =
    pattern === 'dots' || pattern === 'classy'
      ? 2.2 * unit
      : pattern === 'rounded'
        ? 1.6 * unit
        : 0

  // The code is drawn on its own white card rather than straight onto the
  // panel's grey. That's not decoration either: a QR needs a light quiet
  // zone, and grey right up to the modules is what a scanner struggles
  // with.
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
      <div
        style={{
          position: 'relative',
          width: `${CARD}px`,
          height: `${CARD}px`,
          borderRadius: '10px',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg
          viewBox={`${-QUIET} ${-QUIET} ${TOTAL} ${TOTAL}`}
          width={CARD}
          height={CARD}
          role='img'
          aria-label='QR code preview'
          style={{ display: 'block' }}
        >
          {cells.map(([x, y]) => (
            <Module
              key={`m-${x}-${y}`}
              x={x}
              y={y}
              pattern={pattern}
              color={color}
            />
          ))}
          {timing.map(([x, y]) => (
            <Module
              key={`t-${x}-${y}`}
              x={x}
              y={y}
              pattern={pattern}
              color={color}
            />
          ))}
          {/* Alignment block — 5x5 with a single centre module, same
              anatomy as the finders but smaller and unringed. Hidden when
              branding is on: it sits in the bottom-right region the logo
              now occupies, and drawing both would just be a collision. */}
          {!branding ? (
            <g>
              <rect
                x={alignment[0]}
                y={alignment[1]}
                width={5}
                height={5}
                rx={
                  pattern === 'dots' || pattern === 'classy'
                    ? 1.6
                    : pattern === 'rounded'
                      ? 1.1
                      : 0
                }
                fill={markerColor}
              />
              <rect
                x={alignment[0] + 1}
                y={alignment[1] + 1}
                width={3}
                height={3}
                fill='#ffffff'
              />
              <rect
                x={alignment[0] + 2}
                y={alignment[1] + 2}
                width={1}
                height={1}
                fill={markerColor}
              />
            </g>
          ) : null}
          <Finder x={0} y={0} pattern={pattern} color={markerColor} />
          <Finder x={SIZE - 7} y={0} pattern={pattern} color={markerColor} />
          <Finder x={0} y={SIZE - 7} pattern={pattern} color={markerColor} />
        </svg>

        {branding ? (
          <div
            style={{
              position: 'absolute',
              left: `${logoOffsetPx}px`,
              top: `${logoOffsetPx}px`,
              width: `${logoBoxPx}px`,
              height: `${logoBoxPx}px`,
              // White, not transparent: the box is clear space in the
              // code, and the modules cleared behind it need something
              // light there for the same reason the quiet zone does.
              background: '#ffffff',
              borderRadius: `${logoRadius}px`,
              padding: `${LOGO_PADDING}px`,
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            {/* Marker colour rather than Luotain orange — a third hue
                fights the other two, and sitting where a finder would,
                matching them is what makes it read as belonging. */}
            <LogoMark size={logoIconPx} color={markerColor} />
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

// Expands #abc to #aabbcc. Three-digit hex is valid CSS and people type
// it, so rejecting it would just look broken.
function expandHex(digits) {
  if (digits.length === 3) {
    return digits
      .split('')
      .map((c) => c + c)
      .join('')
  }
  return digits
}

function ColorRow({ label, value, onChange }) {
  // Raw text while the field is focused. Null means "not editing", so the
  // input shows the committed value. Without this, typing would fight the
  // parent: every keystroke would be normalised and written back, and a
  // half-typed code like "fa7" would either be rejected or expanded out
  // from under the cursor.
  const [draft, setDraft] = useState(null)

  // The value as-is, NOT looked up in the palette. This used to be
  // QR_COLORS.find(...) || QR_COLORS[0], which meant any hex outside the
  // preset list silently became black — custom colours couldn't work at
  // all, whatever the input did.
  const hex = value || '#000000'
  const preset = QR_COLORS.find(
    (c) => c.hex.toLowerCase() === hex.toLowerCase()
  )

  const digits = draft !== null ? draft : hex.replace('#', '').toUpperCase()

  function handleInput(e) {
    // Anything that isn't a hex digit is dropped rather than rejected,
    // which means a pasted "#FA7319" or "fa7319ff" lands correctly
    // instead of erroring.
    const cleaned = e.target.value
      .replace(/[^0-9a-fA-F]/g, '')
      .slice(0, 6)
      .toUpperCase()
    setDraft(cleaned)

    // Six digits only while typing. Committing three as well would mean
    // "fa7319" passes through a valid shorthand at three characters, so
    // the code would flash #ffaa77 on the way to #fa7319 — a visible
    // flicker for every full code anyone types. Shorthand still works,
    // it just lands on blur or Enter instead.
    if (cleaned.length === 6) {
      onChange(`#${cleaned.toLowerCase()}`)
    }
  }

  function handleBlur() {
    // Shorthand resolves here rather than mid-typing.
    if (draft && draft.length === 3) {
      onChange(`#${expandHex(draft).toLowerCase()}`)
    }
    // Dropping the draft snaps the field back to whatever is actually
    // committed — so an abandoned half-typed code doesn't sit there
    // looking like the current value.
    setDraft(null)
  }

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
            padding: '2px 12px 2px 2px',
          }}
        >
          <span
            aria-hidden='true'
            style={{
              width: '30px',
              height: '30px',
              flexShrink: 0,
              borderRadius: 'var(--radius-full)',
              background: hex,
              transition: 'background 0.15s ease',
            }}
          />
          {/* The # is static rather than part of the input: it's always
              required, so letting someone delete it only creates a state
              where the field looks wrong and has to be corrected. */}
          <span
            className='label-xs'
            style={{ color: 'var(--text-soft)', userSelect: 'none' }}
          >
            #
          </span>
          <input
            value={digits}
            onChange={handleInput}
            onBlur={handleBlur}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape')
                e.currentTarget.blur()
            }}
            aria-label={`${label} hex value`}
            spellCheck='false'
            autoCapitalize='none'
            autoCorrect='off'
            maxLength={6}
            className='label-xs hex-input'
            style={{
              // Fixed width for six characters — sized to the content and
              // the field would resize on every keystroke.
              width: '58px',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              padding: 0,
              margin: 0,
              color: 'var(--text-strong)',
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.6px',
            }}
          />
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
              // Nothing is selected while a custom hex is in play, which
              // is the honest state — none of the presets is what's set.
              selected={preset?.id === c.id}
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
              {/* Previews the mark as it will actually appear in the
                  code, marker colour and all — a fixed orange tile here
                  would contradict what the preview above is showing. */}
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
                  opacity: branding ? 1 : 0.4,
                  transition: 'opacity 0.2s ease',
                }}
              >
                <LogoMark size={22} color={markerColor} />
              </span>
              <p
                className='para-xs'
                style={{
                  color: branding ? 'var(--text-strong)' : 'var(--text-soft)',
                  margin: 0,
                  transition: 'color 0.2s ease',
                }}
              >
                Luotain branding
              </p>
            </div>

            <button
              type='button'
              disabled={!branding}
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
                cursor: branding ? 'pointer' : 'not-allowed',
                borderRadius: 'var(--radius-full)',
                color: 'var(--text-strong)',
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                lineHeight: '20px',
                letterSpacing: '0.28px',
                // Nothing to replace while branding is off — the row is
                // describing something the code isn't showing.
                opacity: branding ? 1 : 0.4,
                transition: 'opacity 0.2s ease',
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
