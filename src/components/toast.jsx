'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

// ─── Store ───
// Plain module-level array + subscriber list, not React context —
// the same reason Sonner is built this way: toast() needs to be
// callable from anywhere (an onClick, a fetch .then, a keyboard
// handler) without the caller needing hook access or being inside a
// provider's child tree.
let toasts = []
let listeners = []
let idCounter = 0

function emit() {
  listeners.forEach((fn) => fn(toasts))
}

// icon: 'success' for now (the only one Figma has designed) — add
// more entries to ICONS below as more toast types get designed.
export function toast(message, { icon = 'success', duration = 4000 } = {}) {
  const id = ++idCounter
  toasts = [...toasts, { id, message, icon }]
  emit()
  if (duration !== Infinity) {
    setTimeout(() => dismissToast(id), duration)
  }
  return id
}

export function dismissToast(id) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

function useToasts() {
  const [state, setState] = useState(toasts)
  useEffect(() => {
    listeners.push(setState)
    return () => {
      listeners = listeners.filter((fn) => fn !== setState)
    }
  }, [])
  return state
}

// ─── Icons ───
// Not using the Figma image exports here — pulled them apart from
// the raw styles: the checkmark's circle is var(--success-base) and
// the close mark is var(--text-strong), both theme-reactive. A
// flattened image export bakes in whatever those resolved to at
// export time (dark mode) and stays that color forever, so it'd
// have been visibly wrong the moment the page switched to light.
// Both shapes are simple enough (a circle + check, an X) to
// reproduce exactly without needing the real vector file.
function SuccessIcon() {
  return (
    <svg
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      style={{
        flexShrink: 0,
        filter: 'drop-shadow(0px 2px 4px rgba(54,54,54,0.04))',
      }}
    >
      <circle cx='12' cy='12' r='10.75' fill='var(--success-base)' />
      <path
        d='M8 12.5L10.5 15L16 9'
        stroke='white'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      width='22'
      height='22'
      viewBox='0 0 22 22'
      fill='none'
      style={{ filter: 'drop-shadow(0px 2px 4px rgba(54,54,54,0.04))' }}
    >
      <path
        d='M6.2 6.19L15.81 15.8M15.81 6.19L6.2 15.8'
        stroke='var(--text-strong)'
        strokeWidth='1.25'
        strokeLinecap='round'
      />
    </svg>
  )
}

// Chevron for the stack's expand/collapse badge.
function ChevronIcon() {
  return (
    <svg width='10' height='10' viewBox='0 0 10 10' fill='none'>
      <path
        d='M2.5 3.75L5 6.25L7.5 3.75'
        stroke='var(--text-inverse)'
        strokeWidth='1.3'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

// Only one designed so far — add more here as more toast types get
// designed (e.g. error: ErrorIcon), same pattern.
const TOAST_ICONS = { success: SuccessIcon }

// ─── One toast card ───
function ToastCard({
  data,
  isFront,
  stackCount,
  expanded,
  onToggleStack,
  onDismiss,
}) {
  const [open, setOpen] = useState(false)
  const Icon = TOAST_ICONS[data.icon] || SuccessIcon

  // Mounts closed, flips open next frame — that's what makes the
  // .t-toast → .t-toast.is-open transition actually play instead of
  // just appearing already-open.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const showBadge = isFront && stackCount > 1

  return (
    <div
      className={`t-toast${open ? ' is-open' : ''}`}
      onClick={() => {
        if (isFront && stackCount > 1 && !expanded) onToggleStack()
      }}
      style={{
        position: 'relative',
        background: 'var(--bg-default)',
        // outline, not border — matches the exact spec, and doesn't
        // add to the box's size the way a border would, so it can't
        // throw off the padding math below
        outline: '1px solid var(--stroke-soft)',
        outlineOffset: '-1px',
        borderRadius: '24px',
        boxShadow: 'var(--shadow-xs)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '16px 20px',
        width: '320px',
        maxWidth: 'calc(100vw - 40px)',
        cursor: isFront && stackCount > 1 && !expanded ? 'pointer' : 'default',
      }}
    >
      <Icon />

      {/* relative wrapper so the close mark can pin to its corner
          instead of sitting in its own flex column — matches the
          exact spec, and means the message can wrap to 2 lines
          without shoving the close mark sideways */}
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        <p
          className='label-md'
          style={{
            color: 'var(--text-strong)',
            margin: 0,
            paddingRight: '26px',
          }}
        >
          {data.message}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDismiss()
          }}
          title='Dismiss'
          style={{
            position: 'absolute',
            top: '1px',
            right: '-6px',
            display: 'flex',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <CloseIcon />
        </button>
      </div>

      {/* Stack-count badge, front card only, 2+ toasts. Chevron
          dissolves between pointing-up (tap to expand) and
          pointing-down (tap to collapse) via the icon-swap pattern —
          state lives on the badge itself so the two frames can sit
          in the same grid cell and cross-fade. */}
      {showBadge && (
        <div
          onClick={(e) => {
            e.stopPropagation()
            onToggleStack()
          }}
          title={expanded ? 'Collapse' : `${stackCount - 1} more`}
          style={{
            position: 'absolute',
            top: '-8px',
            left: '-8px',
            minWidth: '20px',
            height: '20px',
            padding: '0 5px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--primary-base)',
            border: '2px solid var(--bg-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <div
            className='t-icon-swap'
            data-state={expanded ? 'expanded' : 'collapsed'}
          >
            <span className='t-icon' data-icon='collapsed'>
              <span
                className='label-2xs'
                style={{ color: 'var(--text-inverse)' }}
              >
                {stackCount - 1}
              </span>
            </span>
            <span
              className='t-icon'
              data-icon='expanded'
              style={{ display: 'flex', transform: 'rotate(180deg)' }}
            >
              <ChevronIcon />
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Stack ───
// Mount this once, near the root layout. Toasts are absolutely
// positioned and animated purely with transform/opacity (not
// document flow) so collapsed-peek and expanded-list can be the same
// elements just re-targeted — nothing has to mount or unmount to
// switch between the two.
export function ToastStack() {
  const items = useToasts()
  const [expanded, setExpanded] = useState(false)
  const [heights, setHeights] = useState({})
  const elsRef = useRef({})

  const ordered = [...items].reverse() // index 0 = newest = front

  useLayoutEffect(() => {
    const next = {}
    ordered.forEach((t) => {
      const el = elsRef.current[t.id]
      if (el) next[t.id] = el.offsetHeight
    })
    setHeights(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, expanded])

  useEffect(() => {
    if (items.length <= 1) setExpanded(false)
  }, [items.length])

  if (items.length === 0) return null

  const GAP = 8
  let cumulative = 0
  const expandedOffset = ordered.map((t) => {
    const y = cumulative
    cumulative += (heights[t.id] || 72) + GAP
    return y
  })

  return (
    <div className='toast-stack'>
      {ordered.map((t, i) => {
        const depth = Math.min(i, 3)
        const translateY = expanded ? -expandedOffset[i] : depth * -10
        const scale = expanded ? 1 : 1 - depth * 0.04
        const opacity = expanded ? 1 : i > 3 ? 0 : 1

        return (
          <div
            key={t.id}
            ref={(el) => {
              elsRef.current[t.id] = el
            }}
            className='toast-stack-item'
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              zIndex: items.length - i,
              transformOrigin: 'bottom right',
              transform: `translateY(${translateY}px) scale(${scale})`,
              opacity,
              pointerEvents: opacity === 0 ? 'none' : 'auto',
            }}
          >
            <ToastCard
              data={t}
              isFront={i === 0}
              stackCount={items.length}
              expanded={expanded}
              onToggleStack={() => setExpanded((e) => !e)}
              onDismiss={() => dismissToast(t.id)}
            />
          </div>
        )
      })}
    </div>
  )
}
