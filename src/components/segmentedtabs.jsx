'use client'

import { useState, useRef, useEffect, useLayoutEffect } from 'react'

const DUR = 300
const EASE = 'var(--ease-out)'

// Wraps an item's icon so it only EXISTS visually on the active
// segment. Width and margin collapse to 0 while it fades and
// shrinks, so the label slides over to fill the space instead of
// jumping. marginRight here replaces a flex gap on the segment: a
// gap keeps its 6px even next to a 0-width child, which would leave
// inactive labels sitting 6px off where they belong.
function SegmentIcon({ active, reduced, children }) {
  return (
    <span
      aria-hidden={!active}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        width: active ? '16px' : '0px',
        marginRight: active ? '6px' : '0px',
        opacity: active ? 1 : 0,
        transform: active ? 'scale(1)' : 'scale(0.6)',
        overflow: 'hidden',
        transition: reduced
          ? 'none'
          : `width ${DUR}ms ${EASE}, margin-right ${DUR}ms ${EASE}, opacity 200ms ease, transform ${DUR}ms ${EASE}`,
      }}
    >
      {children}
    </span>
  )
}

// ─── SegmentedTabs ───
// items: [{ id, label, icon?, href? }]
//   href present  -> renders via `linkAs` (pass next/link to keep
//                    client routing), active state driven by activeId
//   href absent   -> renders a button and calls onChange(id)
//
// The pill is measured off the real rendered segments rather than
// guessing pixel values, so it stays correct at any font size or
// label length.
export default function SegmentedTabs({
  items,
  activeId,
  onChange,
  linkAs: LinkAs = 'a',
  padX = '16px',
  // The negative margin below exists to align the first label with content
  // above and below it. Inside a container there's nothing to align TO, and
  // it drags the control off-centre — so it's opt-out.
  bleed = true,
  // Draws a plate behind the tabs. It belongs INSIDE this component rather
  // than as a wrapper around it: the pill is positioned against the tablist,
  // so a plate outside can't contain it — the pill escapes the moment the
  // tablist is offset for any reason. Owning both means they can't drift.
  //
  // Turning it on turns the bleed off, since the two are contradictory: one
  // pulls the control out to align with its surroundings, the other draws a
  // box around it.
  track = false,
  // Applied to the outermost element, so a caller can centre or space the
  // control without adding a wrapper — a wrapper around this is exactly what
  // let the pill escape.
  style,
}) {
  const bleeding = bleed && !track
  const itemRefs = useRef(new Map())
  const [pill, setPill] = useState({ left: 0, width: 0 })
  // Transitions stay off until after the first measured paint,
  // otherwise the pill visibly slides in from 0 width at the corner
  // on every page load.
  const [ready, setReady] = useState(false)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChangeMq = (e) => setReduced(e.matches)
    mq.addEventListener('change', onChangeMq)
    return () => mq.removeEventListener('change', onChangeMq)
  }, [])

  useLayoutEffect(() => {
    function measure() {
      const el = itemRefs.current.get(activeId)
      if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth })
    }

    measure()

    // The active segment's own width ANIMATES (its icon grows in
    // over DUR), so a single measurement would capture the
    // pre-growth width and leave the pill visibly narrower than the
    // segment it highlights. The observer re-fires as the segment
    // resizes mid animation, and each update retargets the pill's
    // transition from wherever it currently is, so pill and segment
    // arrive together.
    const observer = new ResizeObserver(measure)
    for (const el of itemRefs.current.values()) observer.observe(el)
    window.addEventListener('resize', measure)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [activeId, items])

  useEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const tablist = (
    <div
      role='tablist'
      style={{
        position: 'relative',
        display: 'inline-flex',
        gap: '8px',
        // Cancels the first segment's own left padding so the label
        // optically aligns with content above and below, using the
        // SAME value as the padding itself. One number, so it can't
        // drift out of sync with itself.
        marginLeft: `calc(-1 * ${padX})`,
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${pill.left}px`,
          width: `${pill.width}px`,
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-surface)',
          transition:
            ready && !reduced
              ? `left ${DUR}ms ${EASE}, width ${DUR}ms ${EASE}`
              : 'none',
          zIndex: 0,
        }}
      />

      {items.map((item) => {
        const active = item.id === activeId
        const shared = {
          ref: (el) => {
            if (el) itemRefs.current.set(item.id, el)
            else itemRefs.current.delete(item.id)
          },
          className: 'label-sm',
          role: 'tab',
          'aria-selected': active,
          style: {
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            padding: `8px ${padX}`,
            borderRadius: 'var(--radius-full)',
            color: active ? 'var(--text-strong)' : 'var(--text-sub)',
            textDecoration: 'none',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            font: 'inherit',
            transition: reduced ? 'none' : `color ${DUR}ms ease`,
          },
        }

        const inner = (
          <>
            {item.icon && (
              <SegmentIcon active={active} reduced={reduced}>
                {item.icon}
              </SegmentIcon>
            )}
            {item.label}
          </>
        )

        return item.href ? (
          <LinkAs key={item.id} href={item.href} {...shared}>
            {inner}
          </LinkAs>
        ) : (
          <button
            key={item.id}
            type='button'
            onClick={() => onChange?.(item.id)}
            {...shared}
          >
            {inner}
          </button>
        )
      })}
    </div>
  )

  // No track: the tablist as it always was.
  if (!track) return tablist

  return (
    <div
      style={{
        display: 'inline-flex',
        // 4, matching the app's other segmented containers. The pill sits
        // flush to the tablist's edges, so less than this lets it nearly touch
        // the plate and read as a rendering fault.
        padding: '4px',
        borderRadius: 'var(--radius-full)',
        background: 'var(--bg-default)',
        boxShadow: '0 2px 10px rgba(54, 54, 54, 0.08)',
        ...style,
      }}
    >
      {tablist}
    </div>
  )
}
