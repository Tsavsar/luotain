'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

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

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function Modal({
  open,
  onClose,
  children,
  labelledBy,
  describedBy,
  // Viewport coordinates {x, y} of whatever was clicked to open this
  // — pass the trigger element's center. Optional: with nothing
  // passed, this behaves exactly as before (plain center scale).
  origin,
}) {
  const [rendered, setRendered] = useState(open)
  const [entered, setEntered] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [canPortal, setCanPortal] = useState(false)
  const [transformOrigin, setTransformOrigin] = useState('center')
  const dialogRef = useRef(null)
  const restoreFocusTo = useRef(null)

  // document.body doesn't exist during SSR, so the portal target can
  // only be resolved after mounting client-side.
  useEffect(() => setCanPortal(true), [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = (e) => setReducedMotion(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (open) {
      restoreFocusTo.current = document.activeElement
      setRendered(true)
      setEntered(false)
      // One frame so the browser commits the pre-animation style
      // before flipping to entered — without this the transition
      // has no starting point to animate FROM and just snaps in.
      // By this point React has also committed the dialog into the
      // DOM, so this is the first moment its real rect can be read.
      const raf = requestAnimationFrame(() => {
        if (origin && dialogRef.current) {
          const rect = dialogRef.current.getBoundingClientRect()
          setTransformOrigin(
            `${origin.x - rect.left}px ${origin.y - rect.top}px`
          )
        } else {
          setTransformOrigin('center')
        }
        setEntered(true)
      })
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
  }, [open, origin])

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
      if (e.key === 'Escape') {
        onClose?.()
        return
      }
      // Focus trap: Tab/Shift+Tab cycle within the dialog instead of
      // escaping into the page behind it. Recomputed on every
      // keypress rather than cached once, since a submitting state
      // can disable buttons (removing them from the focusable set)
      // while the modal is still open.
      if (e.key !== 'Tab' || !dialogRef.current) return
      const focusable = Array.from(
        dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR)
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
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

  if (!rendered || !canPortal) return null

  const modal = (
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
          // Anchors the scale to wherever it was opened from, once
          // known — computed above, defaults to plain center when
          // no origin was given. Modals were previously always
          // origin: center regardless of trigger (the usual rule for
          // modals, since they're not normally anchored to one) —
          // this is an intentional, requested exception to that.
          transformOrigin,
          // Reduced motion drops the scale/transform entirely and
          // keeps only the opacity crossfade — apple-design's
          // guidance: gentler, not absent.
          transform: reducedMotion
            ? 'none'
            : entered
              ? 'scale(1)'
              : // Never scale from 0 — nothing in the real world
                // appears from nothing. 0.95 keeps a visible shape
                // even at the start of the entrance.
                'scale(0.95)',
          opacity: entered ? 1 : 0,
          transition: reducedMotion
            ? `opacity ${entered ? ENTER_MS : EXIT_MS}ms ease`
            : entered
              ? `transform ${ENTER_MS}ms ${ENTER_EASE}, opacity ${ENTER_MS}ms ${ENTER_EASE}`
              : `transform ${EXIT_MS}ms ${EXIT_EASE}, opacity ${EXIT_MS}ms ${EXIT_EASE}`,
        }}
      >
        {children}
      </div>
    </div>
  )

  return createPortal(modal, document.body)
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
