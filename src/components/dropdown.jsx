'use client'

import {
  useCallback,
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  cloneElement,
  isValidElement,
} from 'react'
import { createPortal } from 'react-dom'

// Closest the panel is ever allowed to sit to the edge of the screen.
// Below this a scrolling menu shows too little to be usable — better to
// overflow slightly than to present a 40px window into a long list.
const MIN_PANEL_HEIGHT = 160
// Below this a menu is too narrow to read options in, whatever its trigger is.
const MIN_PANEL_WIDTH = 160
const SCREEN_MARGIN = 12

// Exit is faster than the 150ms enter. Asymmetric on purpose: entering is
// the system responding to you and wants to be seen; leaving is
// acknowledgement and shouldn't be waited on.
const EXIT_MS = 110

export function Dropdown({
  trigger,
  children,
  align = 'left',
  offsetX = 0,
  offsetY = 6,
  sideOffset = 0,
  triggerHover = false,
  // The root is inline-block-ish by default, which is right for icon
  // triggers like a row's "..." button — it shouldn't stretch. But when
  // the trigger IS a full-width control (the domain select on the create
  // form), that shrink-to-content collapses it to its text width and it
  // stops filling its field. Opt-in rather than default so no existing
  // dropdown changes shape.
  fullWidth = false,
}) {
  const [open, setOpen] = useState(false)
  // Kept mounted through the exit animation. Previously the panel unmounted
  // the instant it closed, so every dropdown in the app scaled in over 150ms
  // and then vanished on a single frame — the one direction anyone actually
  // watches closely, since they've just clicked something.
  const [closing, setClosing] = useState(false)
  const [canPortal, setCanPortal] = useState(false)
  const ref = useRef(null)
  const panelRef = useRef(null)
  const closeTimer = useRef(null)

  // document.body doesn't exist during SSR, so the portal target can
  // only be resolved after mounting on the client.
  useEffect(() => setCanPortal(true), [])

  // Every close path goes through here — outside click, Escape, and an
  // option being picked — so none of them can skip the exit.
  const beginClose = useCallback(() => {
    setOpen((isOpen) => {
      if (!isOpen) return false
      setClosing(true)
      clearTimeout(closeTimer.current)
      // Matches EXIT_MS below. The class has to be cleared as well as the
      // panel unmounted: without it the next open would start from the
      // closing scale rather than the resting pre-open one, which reads as
      // the menu flinching before it appears.
      closeTimer.current = setTimeout(() => setClosing(false), EXIT_MS)
      return false
    })
  }, [])

  // ─── Close on outside click ───
  useEffect(() => {
    function handleClickOutside(e) {
      // Has to check the PANEL as well as the trigger now. The panel
      // is portaled into document.body, so it's no longer a DOM
      // descendant of `ref` — testing only `ref` would treat every
      // click inside the menu as an outside click and close it before
      // the option's own handler ever ran.
      const inTrigger = ref.current?.contains(e.target)
      const inPanel = panelRef.current?.contains(e.target)
      if (!inTrigger && !inPanel) beginClose()
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
    // beginClose is stable (useCallback with no deps), so this only exists
    // to keep the dependency list honest.
  }, [open, beginClose])

  // ─── Position the panel ───
  // The panel is portaled to document.body and positioned `fixed`,
  // rather than `absolute` inside the component. That's the whole
  // point: nested absolutely, the panel could be covered by a later
  // sibling section, trapped inside any ancestor that happens to
  // create a stacking context, or clipped outright by an ancestor's
  // overflow (which is what cut off row menus inside the table's
  // horizontal scroll container on mobile). Portaling sidesteps every
  // one of those at once instead of patching them individually.
  //
  // The cost is that a fixed panel doesn't follow its trigger on its
  // own, so position is recomputed on scroll and resize below.
  useLayoutEffect(() => {
    if (!open) return
    const anchor = ref.current
    const panel = panelRef.current
    if (!anchor || !panel) return

    function position() {
      const a = anchor.getBoundingClientRect()

      // The panel matches its trigger unless a width was passed explicitly.
      // That's the sensible default for the common case — a field or a pill
      // opening a list of its own values — and it was previously hand-set per
      // call site, which is how seven different widths ended up in the app.
      //
      // Floored at MIN_PANEL_WIDTH so an icon-sized trigger doesn't produce an
      // unusable menu: a row menu's button is 24px wide, and a 24px list of
      // options is worse than one that ignores the trigger.
      // Skipped when the menu inside asked for its own width — reading it off
      // the DOM rather than threading a prop through, because the panel renders
      // whatever children it's given and doesn't know what they are.
      const fixed = panel.querySelector('[data-menu-fixed-width]')
      if (!fixed) {
        panel.style.width = `${Math.max(a.width, MIN_PANEL_WIDTH)}px`
      } else {
        panel.style.width = ''
      }

      const panelWidth = panel.offsetWidth

      // The panel had no height cap, so a long menu just kept growing — the
      // timezone picker's 40 rows came to about 1280px and ran clean off the
      // screen with no way to reach the bottom of it.
      //
      // Capped against the space actually available on the side it will open,
      // rather than a fixed max-height: a fixed number is either too tall on a
      // laptop or wastes room on a desktop, and the measurement is already
      // being taken here for the flip decision.
      // scrollHeight, NOT offsetHeight with the cap removed. The previous
      // version cleared maxHeight to measure, which was a real bug: this runs on
      // every scroll event, so each gesture briefly removed the overflow, the
      // browser clamped scrollTop to 0 because there was nothing to scroll, and
      // the panel snapped back to the top. Scrolling appeared to do nothing.
      //
      // scrollHeight is the content's full height whether it's capped or not, so
      // nothing has to be disturbed to read it.
      const naturalHeight = panel.scrollHeight
      const spaceBelow =
        window.innerHeight - (a.bottom + offsetY) - SCREEN_MARGIN
      const spaceAbove = a.top - offsetY - SCREEN_MARGIN
      // Opens wherever there's more room once the menu is taller than either
      // side — otherwise it would flip to a side that's also too short.
      const openUp = naturalHeight > spaceBelow && spaceAbove > spaceBelow
      const available = openUp ? spaceAbove : spaceBelow
      if (naturalHeight > available) {
        panel.style.maxHeight = `${Math.max(available, MIN_PANEL_HEIGHT)}px`
        panel.style.overflowY = 'auto'
      } else {
        // Cleared, not just left set. On a resize that opens up space a stale
        // cap would keep the menu short with nothing to scroll.
        panel.style.maxHeight = ''
        panel.style.overflowY = 'visible'
      }

      const panelHeight = panel.offsetHeight

      // Horizontal: align to the trigger, then clamp on-screen.
      let left =
        align === 'right'
          ? a.right - panelWidth - sideOffset - offsetX
          : a.left + sideOffset + offsetX
      left = Math.min(left, window.innerWidth - panelWidth - SCREEN_MARGIN)
      left = Math.max(left, SCREEN_MARGIN)

      // Vertical: below the trigger normally, flipped above it when
      // there isn't room below AND there is room above — otherwise a
      // menu opened near the bottom of the screen would run off it.
      // Reuses the decision made above, so the height cap and the direction
      // can't disagree — capping for one side and then opening on the other
      // would leave the menu overflowing again.
      const belowTop = a.bottom + offsetY
      const flip = openUp

      panel.style.left = `${left}px`
      panel.style.top = `${flip ? a.top - offsetY - panelHeight : belowTop}px`
      // Written straight to the element rather than held in state:
      // this runs on every scroll event, and setState there would
      // re-render the whole menu on each one.
      panel.style.transformOrigin = flip
        ? align === 'right'
          ? 'bottom right'
          : 'bottom left'
        : align === 'right'
          ? 'top right'
          : 'top left'
    }

    // Ignores scrolls that originate inside the panel: it hasn't moved relative
    // to its trigger, so there's nothing to recompute, and running the whole
    // measurement on every wheel tick inside a long list is wasted work.
    function onScroll(e) {
      if (panel.contains(e.target)) return
      position()
    }

    position()

    // Bring the selected row into view. Only matters for menus long enough to
    // scroll — for short ones there's nothing to scroll to, and the guard means
    // this costs nothing there.
    //
    // Centred rather than scrolled to the top edge, so the rows either side are
    // visible and you can see where you are in the list.
    const selected = panel.querySelector('[data-dropdown-selected="true"]')
    if (selected && panel.scrollHeight > panel.clientHeight) {
      const s = selected.getBoundingClientRect()
      const p = panel.getBoundingClientRect()
      panel.scrollTop += s.top - p.top - (p.height - s.height) / 2
    }

    window.addEventListener('resize', position)
    // capture: true so scrolling inside ANY scrollable ancestor
    // repositions the panel, not just scrolling the window itself.
    window.addEventListener('scroll', onScroll, true)
    return () => {
      window.removeEventListener('resize', position)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open, align, sideOffset, offsetX, offsetY])

  useEffect(() => () => clearTimeout(closeTimer.current), [])

  const close = beginClose

  const panel = (
    <div
      ref={panelRef}
      className={`dropdown-panel${closing ? ' is-closing' : ''}`}
      style={{
        position: 'fixed',
        // Real values are written by the layout effect above, which
        // runs before the browser paints — so there's no flash at
        // 0,0 first.
        top: 0,
        left: 0,
        // Below the modal's 200 on purpose: if a dropdown option
        // opens a modal, the modal belongs on top.
        zIndex: 150,
        transformOrigin: align === 'right' ? 'top right' : 'top left',
      }}
    >
      {isValidElement(children) ? cloneElement(children, { close }) : children}
    </div>
  )

  return (
    <div
      ref={ref}
      style={{ position: 'relative', width: fullWidth ? '100%' : undefined }}
    >
      {/* --- Trigger --- */}
      <div
        onClick={() => (open ? beginClose() : setOpen(true))}
        className={
          triggerHover ? `dropdown-trigger${open ? ' is-open' : ''}` : ''
        }
        style={{ cursor: 'pointer', width: fullWidth ? '100%' : undefined }}
      >
        {trigger}
      </div>

      {(open || closing) && canPortal
        ? createPortal(panel, document.body)
        : null}
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
const HIGHLIGHT_EASE = 'var(--ease-out)'

// width defaults to filling the panel, which Dropdown has already sized to the
// trigger. Passing a width here is now an override for the rare menu that
// genuinely shouldn't match its trigger — before, every call site set one, which
// is why seven different values existed.
export function DropdownMenu({ children, width = '100%', close }) {
  const containerRef = useRef(null)
  // Position is kept even after the pointer leaves, so the highlight
  // fades out where it actually is instead of shrinking back up to
  // the top of the menu as it disappears.
  const [highlight, setHighlight] = useState(null) // { top, height, danger, animate }
  const [hovering, setHovering] = useState(false)

  function handleMouseMove(e) {
    const container = containerRef.current
    if (!container) return
    const items = container.querySelectorAll('[data-dropdown-item]')
    const containerRect = container.getBoundingClientRect()
    for (const item of items) {
      const r = item.getBoundingClientRect()
      if (e.clientY >= r.top && e.clientY <= r.bottom) {
        const top = r.top - containerRect.top
        const height = r.height
        const danger = item.dataset.danger === 'true'
        const wasHovering = hovering
        setHovering(true)
        setHighlight((prev) => {
          // Same row, nothing actually changed — returning the SAME
          // object reference makes React bail out of the re-render
          // entirely, rather than re-rendering the whole menu (and
          // every child, via cloneElement) on every pixel of pointer
          // movement inside one row.
          if (prev && prev.top === top && prev.height === height) return prev
          // Animate ONLY when moving between rows. The first hover
          // after opening snaps straight into place: animating it
          // meant the bar visibly sprouted from zero height at the
          // top of the menu and slid down to reach the cursor, which
          // is the part that looked broken. Same on re-entering the
          // menu after leaving — wasHovering is false there too, so
          // it snaps to wherever the cursor came back in rather than
          // sliding from wherever it left off.
          return { top, height, danger, animate: prev !== null && wasHovering }
        })
        return
      }
    }
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHovering(false)}
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
      // Tells the panel not to size itself to the trigger. Only set for a real
      // fixed width — '100%' is the default and means "whatever the panel is".
      data-menu-fixed-width={width !== '100%' ? 'true' : undefined}
    >
      <div
        aria-hidden='true'
        style={{
          position: 'absolute',
          left: '4px',
          right: '4px',
          top: `${highlight?.top ?? 4}px`,
          height: `${highlight?.height ?? 0}px`,
          opacity: hovering ? 1 : 0,
          background: highlight?.danger
            ? 'var(--error-mute)'
            : 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          // Opacity and colour always transition; position only when
          // sliding between rows (see animate above). Built as a list
          // so the position transitions can be omitted outright
          // rather than set to 0s, which would still fire transition
          // events for no reason.
          transition: [
            'opacity 0.15s ease',
            'background 0.15s ease',
            highlight?.animate ? `top 0.2s ${HIGHLIGHT_EASE}` : null,
            highlight?.animate ? `height 0.2s ${HIGHLIGHT_EASE}` : null,
          ]
            .filter(Boolean)
            .join(', '),
          pointerEvents: 'none',
        }}
      />

      {Array.isArray(children)
        ? children.map((child) =>
            isValidElement(child)
              ? cloneElement(child, { close, menuHovering: hovering })
              : child
          )
        : isValidElement(children)
          ? cloneElement(children, { close, menuHovering: hovering })
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
      // Read by the panel's open effect, which scrolls this into view when the
      // menu is long enough to need it. An attribute rather than a ref, because
      // the panel doesn't know how many options there are or which component
      // rendered them.
      data-dropdown-selected={selected ? 'true' : undefined}
      className={`dropdown-item${showSelected ? ' is-selected' : ''}${danger ? ' is-danger' : ''}`}
      onClick={(e) => {
        onClick?.(e)
        close?.()
      }}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        // Vertical padding — text-box-trim (scoped to the
        // .dropdown-item-label class in globals.css, NOT applied to
        // the shared typography classes; the app-wide version broke
        // padding everywhere and was reverted) shrinks this text's
        // own line-box from its untrimmed ~16px down to roughly
        // cap-height-to-baseline, ~8-9px for a 12px font. So padding
        // tuned against the old untrimmed height reads as visibly
        // tight against the new, smaller one. 12px here.
        // 9px, down from 12. The text can't get smaller — 12px is already the
        // floor — so the row's weight comes from its padding, and 12px vertical
        // on a 12px font made each option about 33px tall. 9px brings that to
        // ~27px, which is still a comfortable target and reads far lighter in a
        // list of forty.
        padding: '9px 14px 9px 12px',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <p
        className='para-xs dropdown-item-label'
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
