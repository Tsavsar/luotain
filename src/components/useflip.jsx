'use client'

import { useLayoutEffect, useRef } from 'react'

// ─── useFlip ───
// Morphs items from where they were to where they are, across a layout change.
//
// I argued against this the first time and was wrong. The objection was that
// table rows and gallery tiles "share no positions worth interpolating" — but
// they share the same ITEMS, and that's the only thing FLIP needs. Every code
// exists in all three layouts, so each one can be tracked from its old box to
// its new one. What I actually built instead was a cross-fade, which throws that
// information away and makes the change read as two unrelated screens.
//
// First, Last, Invert, Play:
//   read every tracked element's rect BEFORE the DOM changes
//   let React re-render into the new layout
//   read the rects again, apply the inverse as a transform so everything
//     appears not to have moved
//   then remove the transform and let it transition to zero
//
// Transform and opacity only, so it composites — animating width or top would
// mean layout on every frame across every item at once.
export default function useFlip(dependency) {
  // key -> element, populated by the register callback below.
  const nodes = useRef(new Map())
  const firstRects = useRef(new Map())

  // Called before the change, from the click handler. Has to be read at that
  // moment rather than in an effect: by the time an effect runs, React has
  // already committed the new layout and the old positions are gone.
  function capture() {
    firstRects.current = new Map()
    for (const [key, el] of nodes.current) {
      if (el) firstRects.current.set(key, el.getBoundingClientRect())
    }
  }

  useLayoutEffect(() => {
    const first = firstRects.current
    if (!first.size) return

    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    if (reduced) {
      firstRects.current = new Map()
      return
    }

    const animations = []

    for (const [key, el] of nodes.current) {
      const before = first.get(key)
      if (!el || !before) continue

      const after = el.getBoundingClientRect()
      const dx = before.left - after.left
      const dy = before.top - after.top
      // Scale as well as position: the same code is 20px in the table and 124px
      // in the gallery, so translating alone would have it snap size while
      // sliding, which reads worse than not animating at all.
      const sx = before.width / after.width
      const sy = before.height / after.height

      // Sub-pixel moves aren't worth a frame.
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < 0.01)
        continue

      animations.push(
        el.animate(
          [
            {
              transformOrigin: 'top left',
              transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
            },
            { transformOrigin: 'top left', transform: 'none' },
          ],
          {
            duration: 320,
            // The project's own ease-out, read from the stylesheet rather than
            // hardcoded, so the morph matches everything else.
            easing:
              getComputedStyle(document.documentElement)
                .getPropertyValue('--ease-out')
                .trim() || 'cubic-bezier(0.23, 1, 0.32, 1)',
            fill: 'none',
          }
        )
      )
    }

    firstRects.current = new Map()

    return () => {
      // Cancelled if the layout changes again mid-morph, so a second switch
      // starts from where things actually are rather than fighting the first.
      for (const a of animations) a.cancel()
    }
  }, [dependency])

  // Passed as ref to each tracked element. The key has to be stable across
  // layouts — the code's id — or nothing can be matched from one to the next.
  function register(key) {
    return (el) => {
      if (el) nodes.current.set(key, el)
      else nodes.current.delete(key)
    }
  }

  return { capture, register }
}
