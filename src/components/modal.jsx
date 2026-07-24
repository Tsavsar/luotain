'use client'

import { useEffect, useRef, useState } from 'react'

// ─── Modal ───
// The primitive every other modal in the app builds on top of.
// Compose with ModalIcon / ModalBody / ModalActions / ModalButton
// below rather than hand-rolling structure per modal — that's what
// keeps every dialog in the app speaking the same visual language
// (Vercel's Geist system is the reference point here: one dialog
// vocabulary reused everywhere, not a new one invented per screen).
//
// Lifecycle, none of it left implicit:
//   closed -> mounts, sits at the pre-animation position for one
//   frame -> flips to entered, CSS transition plays the entry ->
//   on close, flips to a `closing` state and plays a SHORTER exit
//   transition -> only after that exit finishes does it actually
//   unmount. Skipping that last step is the most common modal bug:
//   without it, closing just snaps the element away mid-transition.
const ENTER_MS = 200
const EXIT_MS = 150
const ENTER_EASE = 'cubic-bezier(0.23, 1, 0.32, 1)' // emil-design-eng's strong ease-out
const EXIT_EASE = 'ease'

export default function Modal({
  open,
  onClose,
  children,
  labelledBy,
  describedBy,
}) {
  const [rendered, setRendered] = useState(open)
  const [entered, setEntered] = useState(false)
  const dialogRef = useRef(null)
  const restoreFocusTo = useRef(null)

  useEffect(() => {
    if (open) {
      restoreFocusTo.current = document.activeElement
      setRendered(true)
      setEntered(false)
      // One frame so the browser commits the pre-animation style
      // before flipping to entered — without this the transition
      // has no starting point to animate FROM and just snaps in.
      const raf = requestAnimationFrame(() => setEntered(true))
      return () => cancelAnimationFrame(raf)
    }
    if (rendered) {
      setEntered(false)
      const t = setTimeout(() => {
        setRendered(false)
        // Focus goes back to whatever opened this, so keyboard and
        // screen-reader users don't lose their place in the page.
        restoreFocusTo.current?.focus?.()
      }, EXIT_MS)
      return () => clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    if (!rendered) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [rendered])

  useEffect(() => {
    if (!rendered) return
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [rendered, onClose])

  useEffect(() => {
    if (!entered || !dialogRef.current) return
    // Cancel is the button that should catch a stray Enter press —
    // the safe outcome, not the destructive one.
    const target = dialogRef.current.querySelector('[data-autofocus]')
    ;(target || dialogRef.current).focus?.()
  }, [entered])

  if (!rendered) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      {/* Figma's own backdrop (rgba(255,255,255,0.05) + blur) was
          too faint to actually separate the dialog from the page —
          everything read as one flat layer. apple-design's line is
          "dim to focus"; this is what dimming actually looks like. */}
      <div
        onClick={onClose}
        aria-hidden='true'
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.44)',
          backdropFilter: 'blur(2px)',
          opacity: entered ? 1 : 0,
          transition: `opacity ${entered ? ENTER_MS : EXIT_MS}ms ${entered ? ENTER_EASE : EXIT_EASE}`,
        }}
      />

      <div
        ref={dialogRef}
        role='alertdialog'
        aria-modal='true'
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '360px',
          background: 'var(--bg-default)',
          border: '1px solid var(--stroke-soft)',
          borderRadius: '24px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          boxShadow: '0px 10px 20px -3px rgba(0, 0, 0, 0.08)',
          // Modals are the one exception to origin-aware animation —
          // they're not anchored to a trigger, they're centered in
          // the viewport, so center is actually correct here.
          transformOrigin: 'center',
          // Never scale from 0 — nothing in the real world appears
          // from nothing. 0.95 keeps a visible shape even at the
          // start of the entrance.
          transform: entered ? 'scale(1)' : 'scale(0.95)',
          opacity: entered ? 1 : 0,
          transition: entered
            ? `transform ${ENTER_MS}ms ${ENTER_EASE}, opacity ${ENTER_MS}ms ${ENTER_EASE}`
            : `transform ${EXIT_MS}ms ${EXIT_EASE}, opacity ${EXIT_MS}ms ${EXIT_EASE}`,
        }}
      >
        {children}
      </div>
    </div>
  )
}

export function ModalIcon({ tone = 'neutral', children }) {
  const color =
    { danger: 'var(--error-base)', neutral: 'var(--text-soft)' }[tone] ||
    'var(--text-soft)'
  return (
    <div style={{ display: 'flex', color, width: 'fit-content' }}>
      {children}
    </div>
  )
}

export function ModalBody({ titleId, descriptionId, title, description }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <p
        id={titleId}
        className='label-md'
        style={{ color: 'var(--text-strong)', margin: 0 }}
      >
        {title}
      </p>
      <p
        id={descriptionId}
        className='para-sm'
        style={{ color: 'var(--text-sub)', margin: 0, lineHeight: '20px' }}
      >
        {description}
      </p>
    </div>
  )
}

export function ModalActions({ children }) {
  return (
    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>{children}</div>
  )
}

export function ModalButton({
  variant = 'neutral',
  autoFocus,
  children,
  ...rest
}) {
  const variantStyle =
    variant === 'danger'
      ? { background: 'var(--error-base)', color: 'var(--text-inverse)' }
      : { background: 'var(--bg-surface)', color: 'var(--text-strong)' }

  return (
    <button
      // Not a real DOM autoFocus — the modal's own focus effect
      // reads this attribute after the entry transition starts, so
      // focus lands correctly even though the element didn't exist
      // on the previous render.
      data-autofocus={autoFocus ? '' : undefined}
      className='modal-btn'
      style={{
        flex: '1 0 0',
        padding: '10px',
        borderRadius: 'var(--radius-lg)',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontSize: '16px',
        letterSpacing: '0.32px',
        lineHeight: '24px',
        ...variantStyle,
      }}
      {...rest}
    >
      {children}
    </button>
  )
}
