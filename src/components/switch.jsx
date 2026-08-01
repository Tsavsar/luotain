'use client'

import { useState } from 'react'

// ─── Switch ───
// Node 455:1046. A real toggle rather than a button that reports its
// state in its own label.
//
// The detailing matters at this size and isn't decoration: the track
// border and the inset top highlight give the track depth so the knob
// reads as sitting IN it rather than on top, and the small dot inside
// the knob is what makes the on state legible at 16px tall, where the
// track colour alone is a sliver.
//
// A real <button> with role='switch' and aria-checked, so it's
// keyboard-operable and announced as a toggle with an on/off state
// rather than as something you press.
export default function Switch({
  checked,
  onChange,
  label,
  disabled,
  tone = 'success',
  // 'sm' is the 29x16 from the design, for dense settings rows. 'md' is
  // the same proportions scaled up for standalone use.
  size = 'md',
  // Keeps `label` for assistive tech but renders no visible text — for
  // rows where a nearby heading is already the visible label.
  hideLabel = false,
}) {
  // Set on the first interaction, never unset. Until then the keyframes
  // are off, so a switch that mounts in the off state doesn't play its
  // return bounce on page load.
  const [interacted, setInteracted] = useState(false)

  const sm = size === 'sm'
  const WIDTH = sm ? 29 : 34
  const HEIGHT = sm ? 16 : 20
  const BORDER = 1

  // Everything derives from the track's INNER height, not its outer one.
  // That distinction is the whole fix: the track has a 1px border with
  // box-sizing border-box, and an absolutely positioned child is placed
  // against the padding box — inside the border. Sizing the knob off the
  // outer height meant border + pad + knob + pad + border came to 18px
  // inside a 16px track, so the knob overflowed the bottom edge and sat
  // visibly low rather than centred.
  const INNER = HEIGHT - BORDER * 2
  // The design's own percentages, now applied to the right number: knob
  // at 80% of the track, padding at 10% either side.
  const PAD = INNER * 0.1
  const KNOB = INNER * 0.8
  const TRAVEL = WIDTH - BORDER * 2 - KNOB - PAD * 2
  // 37.5% of the knob, matching the design's inset-31.25% on each side.
  const DOT = KNOB * 0.375

  const activeColor =
    tone === 'primary' ? 'var(--primary-base)' : 'var(--success-base)'
  const activeBorder =
    tone === 'primary' ? 'var(--primary-dark)' : 'var(--success-dark)'
  const activeGlow =
    tone === 'primary'
      ? '0px 0px 0px 1px rgba(250, 115, 25, 0.04), 0px 1px 3px 0px rgba(250, 115, 25, 0.2)'
      : '0px 0px 0px 1px rgba(31, 193, 107, 0.04), 0px 1px 3px 0px rgba(31, 193, 107, 0.2)'

  return (
    <button
      type='button'
      role='switch'
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        setInteracted(true)
        onChange?.(!checked)
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: 'var(--font-sans)',
      }}
    >
      <span
        aria-hidden='true'
        className={`switch-track${interacted ? ' is-init' : ''}`}
        data-on={checked ? 'true' : 'false'}
        style={{
          position: 'relative',
          flexShrink: 0,
          // Read by the bounce keyframes in globals.css. Travel has to
          // come from here because it differs per size.
          '--switch-travel': `${TRAVEL}px`,
          // Overshoot scaled to the size rather than fixed at 1px — on the
          // small switch a fixed overshoot is proportionally twice the
          // bounce of the medium one.
          '--switch-overshoot': `${(TRAVEL * 0.07).toFixed(2)}px`,
          '--switch-settle': '0px',
          '--switch-dur': '350ms',
          width: `${WIDTH}px`,
          height: `${HEIGHT}px`,
          borderRadius: 'var(--radius-full)',
          background: checked ? activeColor : 'var(--bg-subtle)',
          border: `1px solid ${checked ? activeBorder : 'var(--stroke-soft)'}`,
          boxShadow: checked ? activeGlow : 'none',
          boxSizing: 'border-box',
          transition:
            'background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        {/* Inset highlight along the top edge. Painted as its own layer
            rather than a second box-shadow on the track, so it doesn't
            have to be re-declared alongside the on-state glow. */}
        <span
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            boxShadow: 'inset 1px 3px 2px 0px rgba(255, 255, 255, 0.12)',
            pointerEvents: 'none',
          }}
        />

        <span
          className='switch-thumb'
          style={{
            position: 'absolute',
            top: `${PAD}px`,
            left: `${PAD}px`,
            width: `${KNOB}px`,
            height: `${KNOB}px`,
            borderRadius: 'var(--radius-full)',
            background: '#ffffff',
            border: '0.75px solid var(--bg-layer)',
            boxShadow: '0px 10px 20px 3px rgba(0, 0, 0, 0.04)',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            // Movement lives in CSS now — see .switch-thumb in
            // globals.css. It's driven by `translate` and keyframes rather
            // than a transform transition, because a transition can only
            // ease between two points and the bounce needs to overshoot
            // past the target and come back.
          }}
        >
          <span
            style={{
              width: `${DOT}px`,
              height: `${DOT}px`,
              borderRadius: 'var(--radius-full)',
              background: checked ? activeColor : 'var(--bg-muted)',
              transition: 'background 0.2s ease',
            }}
          />
        </span>
      </span>

      {label && !hideLabel ? (
        <span
          className='para-xs'
          style={{ color: 'var(--text-sub)', whiteSpace: 'nowrap' }}
        >
          {label}
        </span>
      ) : null}
    </button>
  )
}
