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
  // Sets the panel's position directly (left, in px) instead of
  // through a `transform`. The open animation below (`dropdownIn`)
  // already animates `transform` for its pop-in — a second,
  // separate `transform` used for screen-edge correction would fight
  // it, and the animation wins for its first 0.15s. That's exactly
  // the clip-then-jump: the panel opens in the wrong spot, then
  // snaps over once the animation finishes. Using `left` instead
  // avoids that fight, and runs before the browser paints, so
  // there's no visible flash at the wrong position either.
  useLayoutEffect(() => {
    if (!open) return
    const anchor = ref.current
    const panel = panelRef.current
    if (!anchor || !panel) return

    function position() {
      const anchorRect = anchor.getBoundingClientRect()
      const panelWidth = panel.offsetWidth

      // Where the panel would sit by default, in screen pixels
      let desiredLeft =
        align === 'right'
          ? anchorRect.right - panelWidth - sideOffset - offsetX
          : anchorRect.left + sideOffset + offsetX

      // Clamp fully inside the screen
      desiredLeft = Math.min(
        desiredLeft,
        window.innerWidth - panelWidth - SCREEN_MARGIN
      )
      desiredLeft = Math.max(desiredLeft, SCREEN_MARGIN)

      // The panel is absolutely positioned against `anchor`, so
      // convert the screen position back to "distance from anchor"
      panel.style.left = `${desiredLeft - anchorRect.left}px`
      panel.style.right = 'auto'
    }

    position()
    // Re-check on rotate/resize so it doesn't stay corrected for a
    // screen size it's no longer on.
    window.addEventListener('resize', position)
    return () => window.removeEventListener('resize', position)
  }, [open, align, sideOffset, offsetX])

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

      {/* --- Panel ---
          No left/right set here on purpose — the effect above sets
          `left` directly once it knows the panel's real size and
          the screen's width, before anything is painted. */}
      {open && (
        <div
          ref={panelRef}
          className='dropdown-panel'
          style={{
            position: 'absolute',
            top: `calc(100% + ${offsetY}px)`,
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
