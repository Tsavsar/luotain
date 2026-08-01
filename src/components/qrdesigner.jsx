'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Switch from '@/components/switch'
import Tooltip from '@/components/tooltip'
import LogoMark from '@/components/logomark'
import { toast } from '@/components/toast'
import CopyButton from '@/components/copybutton'

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
function ExpandIcon() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M9.5 2.5h4v4M6.5 13.5h-4v-4M13.5 2.5 9 7M2.5 13.5 7 9'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
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

// ─── useTilt ───
// Shared by the small preview and the full lightbox, because two copies
// of a rAF loop is two things to keep in step.
//
// Writes straight to the element's style rather than into state: at 60fps
// a state update per frame would re-render the subtree sixty times a
// second for a value nothing else reads. And it lerps toward the target
// instead of snapping — jumping to the exact cursor angle feels twitchy;
// trailing slightly is what reads as weight.
function useTilt({
  max,
  ease = 0.12,
  perspective = 700,
  origin = 'element',
  extra,
}) {
  const nodeRef = useRef(null)
  const target = useRef({ rx: 0, ry: 0 })
  // Held in a ref so changing the callback doesn't restart the loop.
  const extraRef = useRef(extra)
  extraRef.current = extra

  useEffect(() => {
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    if (reduced) {
      // A card pitching around under the cursor is exactly the motion
      // this setting exists to switch off, so it renders flat.
      if (nodeRef.current) nodeRef.current.style.transform = 'none'
      extraRef.current?.(0, 0)
      return
    }

    let rx = 0
    let ry = 0
    let id
    function loop() {
      rx += (target.current.rx - rx) * ease
      ry += (target.current.ry - ry) * ease
      if (nodeRef.current) {
        nodeRef.current.style.transform = `perspective(${perspective}px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)`
      }
      extraRef.current?.(rx, ry)
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [ease, perspective])

  function onMove(e) {
    if (origin === 'viewport') {
      // Measured from the centre of the screen, so the tilt keeps
      // responding while the cursor is out over the scrim.
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      target.current = {
        rx: -((e.clientY - cy) / cy) * max,
        ry: ((e.clientX - cx) / cx) * max,
      }
      return
    }
    // Element-relative: the tilt is proportional to where in this box the
    // cursor is, which is what you want for something inline on a page.
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    target.current = { rx: -py * 2 * max, ry: px * 2 * max }
  }

  function onLeave() {
    target.current = { rx: 0, ry: 0 }
  }

  return { nodeRef, onMove, onLeave }
}

// ─── QrCode ───
// The renderer, extracted so the preview and the lightbox draw the same
// code at different sizes rather than one duplicating the other.
//
// 33 modules, version 4. A short link is only ~20 characters, which fits
// version 2 (25) at normal error correction — but punching a logo out of
// the middle means raising correction to H to survive the loss, and that
// pushes the version up. So the denser grid isn't cosmetic, it's what a
// code with a logo in it actually looks like. It reads better too: the
// finder is always 7 modules, so at 33 it's 21% of the width rather than
// 28%, which is the proportion that makes a real code look like one.
const QR_SIZE = 33

function QrCode({
  color,
  markerColor,
  pattern,
  branding,
  card,
  margin,
  radius = 8,
}) {
  const SIZE = QR_SIZE
  // Expressed as card size plus the white margin inside it rather than a
  // quiet zone in modules — those are the two things worth tuning, and
  // deriving the module count from them keeps the code filling the card
  // instead of the card sizing itself around the code.
  const codePx = card - margin * 2
  const unit = codePx / SIZE
  const QUIET = margin / unit
  const TOTAL = SIZE + QUIET * 2
  const { cells, timing, alignment } = useModules(1337, SIZE, branding)

  // Logo geometry, all derived from the grid so it can't drift out of
  // alignment with the modules if any of these change.
  const LOGO_SPAN = 7 // same module footprint as a finder
  // Scaled with the card rather than fixed, so the mark keeps the same
  // proportion whether it's rendered at 140px or 300px.
  const LOGO_PADDING = Math.max(3, unit * 1.25)
  const logoBoxPx = LOGO_SPAN * unit
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

  return (
    // Drawn on its own white card rather than straight onto whatever is
    // behind it: a QR needs a light quiet zone, and a coloured surface
    // right up to the modules is what a scanner struggles with.
    <div
      style={{
        position: 'relative',
        width: `${card}px`,
        height: `${card}px`,
        borderRadius: `${radius}px`,
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg
        viewBox={`${-QUIET} ${-QUIET} ${TOTAL} ${TOTAL}`}
        width={card}
        height={card}
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
          <LogoMark size={logoIconPx} color={markerColor} />
        </div>
      ) : null}
    </div>
  )
}

function QrPreview({ color, markerColor, pattern, branding, onExpand }) {
  const BOX = 180 // the grey preview area's height
  const BOX_PAD = 20 // clear space between the card and the holder edge
  const CARD = BOX - BOX_PAD * 2

  // 9 degrees, against the lightbox's 18. Deliberately restrained: this
  // is a control in a panel, not the hero, and the holder only leaves
  // 20px of clearance — a bigger angle would push the card's corners
  // into the edge. Element-relative, so the tilt tracks where in this box
  // the cursor is rather than where it is on screen.
  const { nodeRef, onMove, onLeave } = useTilt({
    max: 9,
    ease: 0.14,
    perspective: 520,
    origin: 'element',
  })

  return (
    <button
      type='button'
      onClick={onExpand}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      aria-label='Expand QR code'
      className='qr-preview-holder'
      style={{
        width: '100%',
        height: `${BOX}px`,
        borderRadius: '12px',
        background: 'var(--bg-surface)',
        border: 'none',
        padding: 0,
        cursor: 'zoom-in',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        ref={nodeRef}
        style={{
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          borderRadius: '8px',
          // Same shadow trick as the lightbox but static — at this scale a
          // shifting shadow is more fuss than it's worth, while some
          // shadow is what stops the card looking painted on.
          boxShadow: '0 8px 20px -6px rgba(0, 0, 0, 0.18)',
        }}
      >
        {/* Lifted off the card's plane. This is the parallax: at 14px
            closer to the viewer, the code sweeps further than the card's
            own edges as it rotates. Smaller lift than the lightbox's 26px,
            in proportion to the smaller card. */}
        <div style={{ transform: 'translateZ(14px)', borderRadius: '8px' }}>
          <QrCode
            color={color}
            markerColor={markerColor}
            pattern={pattern}
            branding={branding}
            card={CARD}
            margin={4}
            radius={8}
          />
        </div>
      </div>
    </button>
  )
}

// ─── QrLightbox ───
// Tap the preview and the code opens full-size, tilting with the cursor.
//
// The tilt is written straight to the element's style in a rAF loop, not
// held in state: at 60fps a state update per frame would re-render this
// whole subtree sixty times a second for a value nothing else reads.
// Lerping toward the target rather than snapping to it is what gives it
// weight — jumping to the exact cursor angle feels twitchy and cheap.
export function QrLightbox({ open, onClose, shortUrl, ...qr }) {
  const [canPortal, setCanPortal] = useState(false)
  const [entered, setEntered] = useState(false)
  const glossRef = useRef(null)
  const shadowRef = useRef(null)

  useEffect(() => setCanPortal(true), [])

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }
    // One frame at the pre-animation position so the entrance has
    // somewhere to animate FROM, same as the modal.
    const raf = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(raf)
  }, [open])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Same hook the preview uses, at nearly double the angle and measured
  // from the viewport rather than the element — so the tilt keeps
  // responding while the cursor is out over the scrim.
  const {
    nodeRef: cardRef,
    onMove,
    onLeave,
  } = useTilt({
    max: 18,
    ease: 0.12,
    perspective: 700,
    origin: 'viewport',
    extra: (rx, ry) => {
      if (glossRef.current) {
        // Slides opposite to the tilt, which is what sells it as a
        // surface catching light rather than an image being rotated.
        glossRef.current.style.transform = `translate3d(${(-ry * 6).toFixed(2)}%, ${(rx * 6).toFixed(2)}%, 0)`
      }
      if (shadowRef.current) {
        // Leans away from the tilt so the light stays in one place
        // instead of the card looking lit from wherever it faces.
        // Translated rather than re-drawn: animating box-shadow repaints
        // every frame, a transform composites.
        shadowRef.current.style.transform = `translate3d(${(ry * 1.6).toFixed(2)}px, ${(-rx * 1.6).toFixed(2)}px, 0)`
      }
    },
  })

  if (!open || !canPortal) return null

  const content = (
    <div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 240,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        padding: '24px',
      }}
    >
      <div
        onClick={onClose}
        aria-hidden='true'
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(10, 10, 10, 0.82)',
          backdropFilter: 'blur(6px)',
          opacity: entered ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* Short link + copy, above the code. */}
      {shortUrl ? (
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 8px 6px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            opacity: entered ? 1 : 0,
            transform: entered ? 'translateY(0)' : 'translateY(6px)',
            transition: 'opacity 0.3s ease 0.05s, transform 0.3s ease 0.05s',
          }}
        >
          <span className='para-sm' style={{ color: '#ffffff' }}>
            {shortUrl}
          </span>
          <CopyButton
            value={shortUrl}
            icon={<CopyIcon />}
            label='Copy short link'
            toastMessage='Link copied to clipboard'
            className='qr-lightbox-action'
            style={{
              width: '26px',
              height: '26px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
            }}
          />
        </div>
      ) : null}

      {/* The shadow is its own layer behind the card, so it can lean with
          the tilt via a transform. Putting it on the card would mean
          re-drawing box-shadow every frame, which repaints rather than
          composites. */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          ref={shadowRef}
          aria-hidden='true'
          style={{
            position: 'absolute',
            inset: '6%',
            borderRadius: '24px',
            background: 'rgba(0, 0, 0, 0.55)',
            filter: 'blur(38px)',
            willChange: 'transform',
            opacity: entered ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        />

        {/* preserve-3d is what makes this parallax rather than tilt: the
            children below sit on their own Z planes, so the perspective
            moves them at different rates as the card rotates. No manual
            rate maths — the projection does it. */}
        <div
          ref={cardRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            transformStyle: 'preserve-3d',
            willChange: 'transform',
            borderRadius: '20px',
            opacity: entered ? 1 : 0,
            // The loop owns transform outright, so only opacity is
            // transitioned here — the two writing to the same property
            // would fight.
            transition: 'opacity 0.3s ease',
          }}
        >
          {/* Lifted off the card's own plane. This is the parallax: as the
              card rotates, a layer 26px closer to the viewer sweeps
              further than the card's edges do. */}
          <div
            style={{
              transform: 'translateZ(26px)',
              transformStyle: 'preserve-3d',
              borderRadius: '20px',
              overflow: 'hidden',
            }}
          >
            <QrCode {...qr} card={300} margin={12} radius={20} />
          </div>

          {/* The highlight needs its own clipping layer. overflow:hidden
              can't go on the card itself — that flattens preserve-3d and
              the parallax dies with it. So the clipper is a child: it
              still participates in the card's 3D space (it carries the
              translateZ), while clipping the beam inside it.
              Without this the beam sat at inset -45% with nothing
              containing it, and spilled across the whole screen. */}
          <div
            aria-hidden='true'
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '20px',
              overflow: 'hidden',
              pointerEvents: 'none',
              // Highest plane of the three, so the highlight travels
              // furthest of anything on the card.
              transform: 'translateZ(60px)',
            }}
          >
            <div
              ref={glossRef}
              style={{
                position: 'absolute',
                // Oversized so the beam can travel without its ends
                // showing, now that something is actually clipping it.
                inset: '-60%',
                background:
                  'linear-gradient(115deg, rgba(255,255,255,0) 44%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0) 56%)',
                willChange: 'transform',
              }}
            />
          </div>
        </div>
      </div>

      <button
        type='button'
        onClick={() => {
          // TODO: needs the real encoder. Downloading this render would
          // hand someone a code that scans to nothing.
          toast('Download is available once the code is created')
        }}
        className='qr-lightbox-download'
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          cursor: 'pointer',
          color: '#ffffff',
          fontFamily: 'var(--font-sans)',
          fontSize: '14px',
          lineHeight: '20px',
          letterSpacing: '0.28px',
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 0.3s ease 0.1s, transform 0.3s ease 0.1s',
        }}
      >
        <DownloadIcon />
        Download
      </button>
    </div>
  )

  return createPortal(content, document.body)
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
  // Raw text while focused. Null means "not editing", so the field shows
  // the committed value. Without it, every keystroke would be normalised
  // and written back and a half-typed code would be reformatted out from
  // under the cursor.
  const [draft, setDraft] = useState(null)

  // The value as-is, NOT looked up in the palette. This used to be
  // QR_COLORS.find(...) || QR_COLORS[0], which meant any hex outside the
  // nine presets silently became black — custom colours couldn't work at
  // all, whatever the input did.
  const hex = value || '#000000'
  const preset = QR_COLORS.find(
    (c) => c.hex.toLowerCase() === hex.toLowerCase()
  )

  const digits = draft !== null ? draft : hex.replace('#', '').toUpperCase()

  function handleInput(e) {
    // The # is stripped along with everything else non-hex and then
    // re-added on render, so it's always present without being a separate
    // element. Keeps the design's single "#000000" string while making it
    // impossible to delete the #. Also means a pasted "#FA7319" or
    // "fa7319ff" lands correctly rather than erroring.
    const cleaned = e.target.value
      .replace(/[^0-9a-fA-F]/g, '')
      .slice(0, 6)
      .toUpperCase()
    setDraft(cleaned)

    // Six digits only while typing. Committing three as well would mean
    // "fa7319" passes through a valid shorthand at three characters, so
    // the code would flash #ffaa77 on the way — a visible flicker on
    // every full code anyone types. Shorthand still works, on blur.
    if (cleaned.length === 6) {
      onChange(`#${cleaned.toLowerCase()}`)
    }
  }

  function handleBlur() {
    if (draft && draft.length === 3) {
      onChange(`#${expandHex(draft).toLowerCase()}`)
    }
    // Dropping the draft snaps back to what's actually committed, so an
    // abandoned half-typed code doesn't sit there looking current.
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
      {/* The pill and all nine swatches are SIBLINGS of one
          justify-between row, per node 150:1122. Nesting the swatches in
          their own flex container with a gap is what pushed the last one
          onto a second line: pill + 9x30px + fixed gaps exceeds 440px,
          whereas justify-between distributes whatever space is left. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
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
              flexShrink: 0,
              borderRadius: '21px',
              background: hex,
              transition: 'background 0.15s ease',
            }}
          />
          <input
            value={`#${digits}`}
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
            maxLength={7}
            className='label-xs hex-input'
            style={{
              // Fixed width for "#000000" — sized to content and the pill
              // would resize on every keystroke.
              width: '62px',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              padding: 0,
              margin: 0,
              color: 'var(--text-strong)',
              fontFamily: 'var(--font-sans)',
            }}
          />
        </div>

        {QR_COLORS.map((c) => (
          <Swatch
            key={c.id}
            hex={c.hex}
            label={`${label}: ${c.id}`}
            // Nothing selected while a custom hex is set, which is the
            // honest state — none of the presets is what's applied.
            selected={preset?.id === c.id}
            onSelect={() => onChange(c.hex)}
          />
        ))}
      </div>
    </div>
  )
}

export default function QrDesigner({
  color,
  markerColor,
  pattern,
  branding,
  shortUrl,
  onChange,
}) {
  const [expanded, setExpanded] = useState(false)

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
              <Tooltip label='Expand'>
                <button
                  type='button'
                  onClick={() => setExpanded(true)}
                  aria-label='Expand QR code'
                  className='qr-preview-action'
                  style={{
                    display: 'flex',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--text-soft)',
                    cursor: 'pointer',
                  }}
                >
                  <ExpandIcon />
                </button>
              </Tooltip>
            </div>
          </div>

          <QrPreview
            color={color}
            markerColor={markerColor}
            pattern={pattern}
            branding={branding}
            onExpand={() => setExpanded(true)}
          />

          <QrLightbox
            open={expanded}
            onClose={() => setExpanded(false)}
            shortUrl={shortUrl}
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
