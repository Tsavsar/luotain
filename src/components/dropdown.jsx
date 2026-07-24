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

// One highlight that SLIDES between items on mouse move, instead of
// each item flashing its own background independently. Position is
// measured directly off the hovered item's DOM rect rather than
// tracked by index, so it works regardless of item height (a row
// with a flag or favicon icon is taller than a plain text row) with
// no per-item math to keep in sync.
//
// Colour-aware on purpose: the per-item CSS this replaces gave
// danger options (Delete, etc.) a red-tinted hover instead of the
// neutral gray, and that distinction is real information — losing
// it would make a destructive option look identical to a normal
// one until the moment it's clicked. data-danger on each item is
// how the highlight knows which tint to become as it slides onto it.
const HIGHLIGHT_EASE = 'cubic-bezier(0.23, 1, 0.32, 1)'

export function DropdownMenu({ children, width = '220px', close }) {
  const containerRef = useRef(null)
  const [highlight, setHighlight] = useState(null) // { top, height, danger } | null

  function handleMouseMove(e) {
    const container = containerRef.current
    if (!container) return
    const items = container.querySelectorAll('[data-dropdown-item]')
    const containerRect = container.getBoundingClientRect()
    for (const item of items) {
      const r = item.getBoundingClientRect()
      if (e.clientY >= r.top && e.clientY <= r.bottom) {
        setHighlight({
          top: r.top - containerRect.top,
          height: r.height,
          danger: item.dataset.danger === 'true',
        })
        return
      }
    }
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHighlight(null)}
      style={{
        position: 'relative',
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
      {/* Starts pinned at the top with zero height rather than at
          some arbitrary default position — with opacity also at 0
          until the first real measurement, it's invisible either
          way, but this means the very first slide-in (top row ->
          wherever the cursor lands) always has a correct starting
          point instead of animating in from a stale one. */}
      <div
        aria-hidden='true'
        style={{
          position: 'absolute',
          left: '4px',
          right: '4px',
          top: `${highlight?.top ?? 4}px`,
          height: `${highlight?.height ?? 0}px`,
          opacity: highlight ? 1 : 0,
          background: highlight?.danger
            ? 'var(--error-mute)'
            : 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          transition: `top 0.2s ${HIGHLIGHT_EASE}, height 0.2s ${HIGHLIGHT_EASE}, opacity 0.15s ease, background 0.15s ease`,
          pointerEvents: 'none',
        }}
      />

      {Array.isArray(children)
        ? children.map((child) =>
            isValidElement(child)
              ? cloneElement(child, { close, menuHovering: highlight !== null })
              : child
          )
        : isValidElement(children)
          ? cloneElement(children, { close, menuHovering: highlight !== null })
          : children}
    </div>
  )
}

export function DropdownOption({
  children,
  selected,
  danger,
  onClick,
  close,
  menuHovering,
}) {
  // Selected's own persistent background steps back for as long as
  // ANYTHING in the menu is being actively hovered — not just while
  // this particular option is — otherwise hovering a different
  // option left two things visibly highlighted at once (the sliding
  // highlight where the cursor actually is, plus the selected row's
  // own background sitting there unrelated to it). Once the cursor
  // leaves the whole menu, this reverts and the selected row's own
  // background reasserts itself — that's the "idle state" the
  // selected indicator normally lives in.
  const showSelected = selected && !menuHovering

  return (
    <div
      data-dropdown-item
      data-danger={danger ? 'true' : undefined}
      className={`dropdown-item${showSelected ? ' is-selected' : ''}${danger ? ' is-danger' : ''}`}
      onClick={(e) => {
        onClick?.(e)
        close?.()
      }}
      style={{
        position: 'relative',
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
