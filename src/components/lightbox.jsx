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
  const [entered, setEntered] = useState(false)

  useEffect(() => setCanPortal(true), [])

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }
    // One frame at the pre-animation position, so the entrance has somewhere
    // to animate FROM.
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

  if (!open || !canPortal) return null

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
          transition: 'opacity var(--duration-modal) var(--ease-out)',
        }}
      />

      {/* `entered` is handed to children so each can stagger its own parts
          against the same entrance rather than running its own timer. */}
      {typeof children === 'function' ? children({ entered }) : children}
    </div>
  )

  return createPortal(content, document.body)
}
