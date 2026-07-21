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
// Figma's exact assets (node 391:1083) — temporary export URLs, they
// expire around July 28 2026 (~7 days from today). Before then:
// download these two and commit them to /public/assets/icons/, then
// swap the URLs below for local paths. Network access from this
// session couldn't reach figma.com to download them directly, or
// they'd already be committed rather than linked.
const ICONS = {
  success:
    'https://www.figma.com/api/mcp/asset/8a5936c9-14d9-4dda-bc0e-a7b44f22d99d',
}
const CLOSE_ICON_URL =
  'https://www.figma.com/api/mcp/asset/fa7fc010-cc76-47e6-a4c2-c5e17e620f31'

// Chevron for the stack's expand/collapse badge — this one's simple
// enough to hand-draw rather than needing a Figma export.
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
        border: '1px solid var(--stroke-soft)',
        borderRadius: 'var(--radius-xl)',
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
      <img
        src={ICONS[data.icon] || ICONS.success}
        alt=''
        width={24}
        height={24}
        style={{
          flexShrink: 0,
          filter: 'drop-shadow(0px 2px 2px rgba(54,54,54,0.04))',
        }}
      />
      <p
        className='label-md'
        style={{ flex: 1, minWidth: 0, color: 'var(--text-strong)', margin: 0 }}
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
          display: 'flex',
          flexShrink: 0,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <img
          src={CLOSE_ICON_URL}
          alt=''
          width={22}
          height={22}
          style={{ filter: 'drop-shadow(0px 2px 2px rgba(54,54,54,0.04))' }}
        />
      </button>

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
