'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// ─── Tooltip ───
// Node 108:877. Wraps whatever it's given and shows a label on hover or
// keyboard focus.
//
// Always dark, in both themes. That's not an oversight — it's the
// system rule set when the design language was decided, and the Figma
// node confirms it by pulling the DARK theme's surface regardless of
// mode. So the surface and border are literal values rather than theme
// tokens, which would flip and break the rule.
//
// Portaled to document.body and positioned fixed, for the same reason
// the dropdown is: nested, it would get clipped by any ancestor
// overflow and painted over by anything with a higher stacking context.
// A tooltip that appears half-cut is worse than none.
const DELAY_MS = 250

export default function Tooltip({ label, children, placement = 'top' }) {
  const [open, setOpen] = useState(false)
  const [canPortal, setCanPortal] = useState(false)
  const anchorRef = useRef(null)
  const bubbleRef = useRef(null)
  const showTimer = useRef(null)

  useEffect(() => setCanPortal(true), [])

  // Cleared on unmount so a pending show can't fire against a component
  // that's already gone.
  useEffect(() => {
    return () => clearTimeout(showTimer.current)
  }, [])

  function show() {
    // Delayed so sweeping the cursor across a row of controls doesn't
    // flash a tooltip for each one on the way past.
    clearTimeout(showTimer.current)
    showTimer.current = setTimeout(() => setOpen(true), DELAY_MS)
  }
  function hide() {
    clearTimeout(showTimer.current)
    setOpen(false)
  }

  // Escape closes it. Worth having because focus can show a tooltip,
  // and a keyboard user needs a way to dismiss it without moving on.
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') hide()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (!open) return
    const anchor = anchorRef.current
    const bubble = bubbleRef.current
    if (!anchor || !bubble) return

    function position() {
      const a = anchor.getBoundingClientRect()
      const w = bubble.offsetWidth
      const h = bubble.offsetHeight
      const GAP = 8
      const MARGIN = 8

      let left = a.left + a.width / 2 - w / 2
      left = Math.min(left, window.innerWidth - w - MARGIN)
      left = Math.max(left, MARGIN)

      // Flips below when there isn't room above, so a tooltip on
      // anything near the top of the window doesn't render off-screen.
      const above = a.top - GAP - h
      const flip = above < MARGIN
      bubble.style.left = `${left}px`
      bubble.style.top = `${flip ? a.bottom + GAP : above}px`
    }

    position()
    window.addEventListener('resize', position)
    window.addEventListener('scroll', position, true)
    return () => {
      window.removeEventListener('resize', position)
      window.removeEventListener('scroll', position, true)
    }
  }, [open, label])

  const bubble = (
    <div
      ref={bubbleRef}
      role='tooltip'
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        // Above dropdowns (150) and modals (200): a tooltip is always
        // the topmost thing while it's showing, including on a control
        // inside a modal.
        zIndex: 260,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px 10px',
        borderRadius: 'var(--radius-lg)',
        background: '#171717',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0px 10px 20px 3px rgba(0, 0, 0, 0.04)',
        whiteSpace: 'nowrap',
      }}
    >
      <span className='para-sm' style={{ color: '#ffffff', margin: 0 }}>
        {label}
      </span>
    </div>
  )

  return (
    <span
      ref={anchorRef}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      style={{ display: 'inline-flex' }}
    >
      {children}
      {open && canPortal ? createPortal(bubble, document.body) : null}
    </span>
  )
}
