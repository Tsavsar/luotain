'use client'

import { useRef, useState } from 'react'
import { QrCode } from '@/components/qrdesigner'

// ─── QR code views ───
// Three ways of looking at the same set, because they answer different
// questions:
//
//   table   — "which code is performing?"      comparison, dense, sortable eye
//   cards   — "which code is this, and how?"   recognition plus the numbers
//   gallery — "which code do I want?"          pure recognition, e.g. to grab one
//
// Worth saying plainly: this isn't really an accessibility feature. Real
// accessibility here is the keyboard path, focus visibility, labelled controls
// and contrast — all of which every view below shares. Three layouts is a
// density preference, and more views means more surface to keep keyboard-usable
// rather than less. It's defensible because each answers a distinct question,
// but if one had to go it's `cards`: it's the hybrid, and it does neither job
// as well as the two either side of it.

function LinkOffIcon({ size = 13 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 14 14'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M5.6 8.4 8.4 5.6M4.9 6.3 3.9 7.3a2.1 2.1 0 0 0 3 3l1-1M9.1 7.7l1-1a2.1 2.1 0 0 0-3-3l-1 1'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinecap='round'
      />
      <path
        d='M1.6 1.6l10.8 10.8'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinecap='round'
      />
    </svg>
  )
}

// ─── The sliding hover highlight ───
// One element that follows the cursor between rows rather than each row
// painting its own background. Measured from the hovered element's rect, the
// same approach the dropdowns use, so it works whatever height a row is.
function useSlidingHighlight() {
  const containerRef = useRef(null)
  const [highlight, setHighlight] = useState(null)

  function onMouseMove(e) {
    const container = containerRef.current
    if (!container) return
    const row = e.target.closest?.('[data-qr-row]')
    if (!row || !container.contains(row)) return

    const cRect = container.getBoundingClientRect()
    const rRect = row.getBoundingClientRect()
    const next = { top: rRect.top - cRect.top, height: rRect.height }

    setHighlight((prev) => {
      // Bail out when nothing moved, or every mouse event re-renders the list.
      if (prev && prev.top === next.top && prev.height === next.height)
        return prev
      // First hover snaps into place; subsequent ones slide. Without this the
      // highlight travels in from the top of the container the first time,
      // which reads as an animation nobody asked for.
      return { ...next, animate: Boolean(prev) }
    })
  }

  function onMouseLeave() {
    // Fades out where it is rather than returning anywhere — there's no
    // selected row to go back to.
    setHighlight((prev) => (prev ? { ...prev, hidden: true } : null))
  }

  const layer = highlight ? (
    <div
      aria-hidden='true'
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: `${highlight.top}px`,
        height: `${highlight.height}px`,
        borderRadius: '10px',
        background: 'var(--bg-surface)',
        opacity: highlight.hidden ? 0 : 1,
        transition: highlight.animate
          ? 'top var(--duration-panel) var(--ease-out), height var(--duration-panel) var(--ease-out), opacity var(--duration-fast) ease'
          : 'opacity var(--duration-fast) ease',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  ) : null

  return { containerRef, onMouseMove, onMouseLeave, layer }
}

function ScanCount({ scans, dim }) {
  return (
    <div style={{ display: 'flex', gap: '5px', alignItems: 'baseline' }}>
      <span
        className='label-sm'
        style={{ color: dim ? 'var(--text-sub)' : 'var(--text-strong)' }}
      >
        {scans.toLocaleString()}
      </span>
      <span className='para-xs' style={{ color: 'var(--text-soft)' }}>
        {scans === 1 ? 'scan' : 'scans'}
      </span>
    </div>
  )
}

// ─── Table ───
export function QrTable({ codes, onOpen }) {
  const { containerRef, onMouseMove, onMouseLeave, layer } =
    useSlidingHighlight()

  return (
    <div style={{ width: '100%' }}>
      {/* Column headers, matching the links table's treatment. */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          padding: '0 10px 8px',
        }}
      >
        <span
          className='para-xs'
          style={{ color: 'var(--text-soft)', flex: '1 0 0' }}
        >
          Code
        </span>
        <span
          className='para-xs'
          style={{ color: 'var(--text-soft)', width: '180px', flexShrink: 0 }}
        >
          Link
        </span>
        <span
          className='para-xs'
          style={{ color: 'var(--text-soft)', width: '90px', flexShrink: 0 }}
        >
          Scans
        </span>
      </div>

      <div
        ref={containerRef}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={{ position: 'relative', width: '100%' }}
      >
        {layer}
        {codes.map((code) => {
          const deleted = code.link?.deleted
          return (
            <button
              key={code.id}
              type='button'
              data-qr-row
              onClick={() => onOpen(code)}
              className='qr-row'
              style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                width: '100%',
                padding: '10px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                boxSizing: 'border-box',
              }}
            >
              <span
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                  flex: '1 0 0',
                  minWidth: 0,
                }}
              >
                {/* Small but still the real code — even at 28px the colour and
                    pattern identify it faster than the label does. */}
                <span style={{ flexShrink: 0, opacity: deleted ? 0.4 : 1 }}>
                  <QrCode
                    value={`https://${code.scanUrl}`}
                    color={code.color}
                    markerColor={code.markerColor}
                    pattern={code.pattern}
                    branding={false}
                    card={28}
                    margin={2}
                    radius={5}
                  />
                </span>
                <span
                  className='para-sm'
                  style={{
                    color: deleted ? 'var(--text-sub)' : 'var(--text-strong)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {code.label}
                </span>
              </span>

              <span
                style={{
                  display: 'flex',
                  gap: '5px',
                  alignItems: 'center',
                  width: '180px',
                  flexShrink: 0,
                  minWidth: 0,
                  color: deleted ? 'var(--text-disabled)' : 'var(--text-soft)',
                }}
              >
                {deleted ? <LinkOffIcon /> : null}
                <span
                  className='para-xs'
                  style={{
                    color: 'inherit',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {deleted ? 'Link deleted' : code.link?.shortUrl}
                </span>
              </span>

              <span style={{ width: '90px', flexShrink: 0 }}>
                <ScanCount scans={code.scans} dim={deleted} />
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Cards ───
export function QrCards({ codes, onOpen }) {
  return (
    <div className='qr-grid-cards'>
      {codes.map((code) => {
        const deleted = code.link?.deleted
        return (
          <button
            key={code.id}
            type='button'
            onClick={() => onOpen(code)}
            className='qr-card'
            style={{
              display: 'flex',
              gap: '14px',
              alignItems: 'center',
              width: '100%',
              background: 'none',
              border: 'none',
              borderRadius: '14px',
              padding: '10px',
              cursor: 'pointer',
              textAlign: 'left',
              boxSizing: 'border-box',
            }}
          >
            <span
              style={{
                flexShrink: 0,
                opacity: deleted ? 0.4 : 1,
                transition: 'opacity var(--duration-fast) ease',
              }}
            >
              <QrCode
                value={`https://${code.scanUrl}`}
                color={code.color}
                markerColor={code.markerColor}
                pattern={code.pattern}
                branding={code.branding}
                card={72}
                margin={4}
                radius={10}
              />
            </span>

            <span
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                minWidth: 0,
                flex: '1 0 0',
              }}
            >
              <span
                className='para-sm'
                style={{
                  color: deleted ? 'var(--text-sub)' : 'var(--text-strong)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {code.label}
              </span>
              <span
                style={{
                  display: 'flex',
                  gap: '5px',
                  alignItems: 'center',
                  minWidth: 0,
                  color: deleted ? 'var(--text-disabled)' : 'var(--text-soft)',
                }}
              >
                {deleted ? <LinkOffIcon /> : null}
                <span
                  className='para-xs'
                  style={{
                    color: 'inherit',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {deleted ? 'Link deleted' : code.link?.shortUrl}
                </span>
              </span>
              <ScanCount scans={code.scans} dim={deleted} />
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Gallery ───
// The code, large, with its name under it. No link and no scan count: this view
// is for finding the right code by eye, and the numbers are what the other two
// are for.
export function QrGallery({ codes, onOpen }) {
  return (
    <div className='qr-grid-gallery'>
      {codes.map((code) => {
        const deleted = code.link?.deleted
        return (
          <button
            key={code.id}
            type='button'
            onClick={() => onOpen(code)}
            className='qr-tile'
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              padding: '12px',
              background: 'none',
              border: 'none',
              borderRadius: '16px',
              cursor: 'pointer',
              boxSizing: 'border-box',
            }}
          >
            <span
              style={{
                flexShrink: 0,
                opacity: deleted ? 0.4 : 1,
                transition: 'opacity var(--duration-fast) ease',
              }}
            >
              <QrCode
                value={`https://${code.scanUrl}`}
                color={code.color}
                markerColor={code.markerColor}
                pattern={code.pattern}
                branding={code.branding}
                card={124}
                margin={6}
                radius={14}
              />
            </span>

            <span
              style={{
                display: 'flex',
                gap: '5px',
                alignItems: 'center',
                maxWidth: '100%',
                minWidth: 0,
              }}
            >
              {deleted ? (
                <span
                  style={{ color: 'var(--text-disabled)', display: 'flex' }}
                >
                  <LinkOffIcon size={12} />
                </span>
              ) : null}
              <span
                className='para-xs'
                style={{
                  color: deleted ? 'var(--text-sub)' : 'var(--text-strong)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {code.label}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
