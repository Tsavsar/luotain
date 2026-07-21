'use client'

import {
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  cloneElement,
  isValidElement,
} from 'react'

// Closest the panel is ever allowed to sit to the edge of the screen.
const SCREEN_MARGIN = 12

export function Dropdown({
  trigger,
  children,
  align = 'left',
  offsetX = 0,
  offsetY = 6,
  sideOffset = 0,
  triggerHover = false,
}) {
  const [open, setOpen] = useState(false)
  // Extra horizontal nudge, only non-zero when the panel's default
  // position would run off the left or right edge of the screen.
  const [correction, setCorrection] = useState(0)
  const ref = useRef(null)
  const panelRef = useRef(null)

  // ─── Close on outside click ───
  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  // ─── Keep the panel on-screen ───
  // Fires right after the panel is added to the page, before it's
  // visible to the user. Measures where it actually landed and, if
  // it's spilling past either edge of the screen, nudges it back in.
  // This is what was cutting the date-range dropdown off on mobile —
  // it was always opening at a fixed spot regardless of screen size.
  useLayoutEffect(() => {
    if (!open) {
      setCorrection(0)
      return
    }

    function measure() {
      const panel = panelRef.current
      if (!panel) return

      // Reset first so every measurement starts from the true
      // default position, not a correction stacked on a correction.
      panel.style.transform = 'none'
      const rect = panel.getBoundingClientRect()

      let next = 0
      if (rect.left < SCREEN_MARGIN) {
        next = SCREEN_MARGIN - rect.left
      } else if (rect.right > window.innerWidth - SCREEN_MARGIN) {
        next = window.innerWidth - SCREEN_MARGIN - rect.right
      }
      setCorrection(next)
    }

    measure()
    // Re-check on rotate/resize so it doesn't stay corrected for a
    // screen size it's no longer on.
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [open])

  const close = () => setOpen(false)

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* --- Trigger --- */}
      <div
        onClick={() => setOpen((o) => !o)}
        className={
          triggerHover ? `dropdown-trigger${open ? ' is-open' : ''}` : ''
        }
        style={{ cursor: 'pointer' }}
      >
        {trigger}
      </div>

      {/* --- Panel --- */}
      {open && (
        <div
          ref={panelRef}
          className='dropdown-panel'
          style={{
            position: 'absolute',
            top: `calc(100% + ${offsetY}px)`,
            [align === 'right' ? 'right' : 'left']: `${sideOffset + offsetX}px`,
            transform: correction ? `translateX(${correction}px)` : undefined,
            zIndex: 50,
            transformOrigin: align === 'right' ? 'top right' : 'top left',
          }}
        >
          {isValidElement(children)
            ? cloneElement(children, { close })
            : children}
        </div>
      )}
    </div>
  )
}

export function DropdownMenu({ children, width = '220px', close }) {
  return (
    <div
      style={{
        background: 'var(--bg-default)',
        border: '1px solid var(--stroke-soft)',
        borderRadius: '14px',
        boxShadow: '0 10px 20px 3px rgba(0, 0, 0, 0.04)',
        padding: '4px',
        display: 'flex',
        flexDirection: 'column',
        width,
      }}
    >
      {Array.isArray(children)
        ? children.map((child) =>
            isValidElement(child) ? cloneElement(child, { close }) : child
          )
        : isValidElement(children)
          ? cloneElement(children, { close })
          : children}
    </div>
  )
}

export function DropdownOption({ children, selected, danger, onClick, close }) {
  return (
    <div
      className={`dropdown-item${selected ? ' is-selected' : ''}${danger ? ' is-danger' : ''}`}
      onClick={() => {
        onClick?.()
        close?.()
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '6px 14px 6px 12px',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <p
        className='para-xs'
        style={{
          flex: 1,
          color: danger ? 'var(--error-base)' : 'var(--text-strong)',
          margin: 0,
        }}
      >
        {children}
      </p>
    </div>
  )
}
