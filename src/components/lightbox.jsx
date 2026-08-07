'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

// ─── Lightbox ───
// The full-screen overlay shell: scrim, entrance, escape, scroll lock, portal.
//
// Extracted from QrLightbox because the plan card needs the same treatment,
// and two copies of "how an overlay behaves" is two places to fix when the
// focus handling or the escape key needs work.
//
// What stays with the caller is whatever is peculiar to it — the QR lightbox
// keeps its own tilt loop and gloss layers, this only owns the shell.
//
// The scrim is white with a blur rather than dark. That has one real
// consequence worth knowing: a white card on a white scrim has no edge, so
// anything rendered in here needs its own border or shadow to separate from
// the background. The QR card and the plan card both carry one.
// Exits faster than it enters. An entrance is introducing something and can
// take its time; an exit is getting out of the way, and matching the
// entrance's duration makes dismissing feel sluggish. 180 against the 250ms
// entrance.
const EXIT_MS = 180

export default function Lightbox({
  open,
  onClose,
  children,
  labelledBy,
  // Passed through to the outer container so a caller can attach pointer
  // handlers — the QR lightbox tracks the cursor across the whole scrim.
  onMouseMove,
  onMouseLeave,
  // Vertical stacking for the QR lightbox's link + code + download column.
  gap = '20px',
}) {
  const [canPortal, setCanPortal] = useState(false)
  // Whether anything is on screen at all. Set true when opened, and only
  // cleared AFTER the exit has finished — this is what keeps the overlay
  // mounted long enough to animate out.
  //
  // It has to be its own state rather than derived from a `closing` flag set
  // in an effect. That was my first attempt and it silently did nothing:
  // effects run after render, so on the render where `open` flipped false the
  // flag was still false, the guard below returned null, and the component
  // unmounted before the effect could ever set it. The exit was unreachable.
  const [visible, setVisible] = useState(false)
  // Drives the actual transitions. Children read this, so flipping it to false
  // reverses whatever they're already transitioning on.
  const [entered, setEntered] = useState(false)

  useEffect(() => setCanPortal(true), [])

  useEffect(() => {
    if (open) {
      setVisible(true)
      // One frame at the pre-animation position, so the entrance has somewhere
      // to animate FROM.
      const raf = requestAnimationFrame(() => setEntered(true))
      return () => cancelAnimationFrame(raf)
    }

    // Nothing to exit from if it was never open — this also fires on mount.
    if (!visible) return

    setEntered(false)
    const timer = setTimeout(() => setVisible(false), EXIT_MS)
    return () => clearTimeout(timer)
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

  // Keyed off `visible`, not `open`. `open` going false starts the exit; this
  // is what stays true until it's finished.
  if (!visible || !canPortal) return null

  const content = (
    <div
      role='dialog'
      aria-modal='true'
      aria-labelledby={labelledBy}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'fixed',
        inset: 0,
        // Below tooltips (260) so a tooltip on a control in here still shows,
        // above modals (200) and dropdowns (150).
        zIndex: 240,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap,
        padding: '24px',
        // Scrolls rather than clipping when the content is taller than the
        // viewport — the plan card at three columns is tall on a laptop.
        overflowY: 'auto',
      }}
    >
      <div
        onClick={onClose}
        aria-hidden='true'
        style={{
          position: 'fixed',
          inset: 0,
          // White rather than dark, with the page blurred behind it. Not fully
          // opaque on purpose: at 0.72 the shapes of the page still read
          // faintly through, which keeps a sense of where you are — a solid
          // white sheet reads as a new page rather than an overlay.
          background: 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'blur(14px) saturate(120%)',
          WebkitBackdropFilter: 'blur(14px) saturate(120%)',
          opacity: entered ? 1 : 0,
          transition: entered
            ? 'opacity var(--duration-modal) var(--ease-out)'
            : `opacity ${EXIT_MS}ms var(--ease-exit)`,
        }}
      />

      {/* `entered` is handed to children so each can stagger its own parts
          against the same entrance rather than running its own timer.
          `exitMs` comes with it so their exits match the shell's — a child
          transitioning out over 250ms while the shell unmounts at 180 would be
          cut off part-way through. */}
      {typeof children === 'function'
        ? children({ entered, exitMs: EXIT_MS })
        : children}
    </div>
  )

  return createPortal(content, document.body)
}
