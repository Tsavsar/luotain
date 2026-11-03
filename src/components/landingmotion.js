'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// ─── Landing motion ───
// How the landing's pictures answer the pointer, shared by the feature bento
// (landingfeatures.jsx) and the use-case cards (landingusecases.jsx) so the
// whole page answers by one rule:
//
//   - A card answers once the pointer has settled on it, not as it passes.
//     Crossing the page on the way somewhere else sets nothing moving.
//   - What it answers with is its own animation, played again.
//   - A replay that has started plays to its end. Leaving doesn't cut it
//     short and coming back mid-way doesn't restart it, so running the
//     pointer in and out of a card moves it once, not every time.

// How long the pointer rests before a card answers. Long enough that a pass
// over the page on the way to something else doesn't count; short enough
// that stopping on a card is answered before it reads as a delay.
export const INTENT = 240

// `engaged` turns on INTENT after the pointer comes in, and off as soon as it
// leaves; onEngage runs at the moment it turns on.
//
// Bind enter/leave as native mouseenter/mouseleave listeners (useHoverTarget),
// not React's onMouseEnter. React builds that one out of mouseover, and when
// the element under a resting pointer is replaced — a replay swapping a QR
// layer, rolling a slug — it fires again as if the pointer had just arrived.
// Each replay then booked the next, and a tile looped for as long as the
// pointer sat on it.
export function useEngage(onEngage) {
  const [engaged, setEngaged] = useState(false)
  const timer = useRef(0)
  // Belt and braces for the same thing: an enter while already inside is
  // never a new visit, whatever fired it.
  const inside = useRef(false)
  const latest = useRef(onEngage)
  useEffect(() => {
    latest.current = onEngage
  })
  useEffect(() => () => clearTimeout(timer.current), [])
  const enter = useCallback(() => {
    if (inside.current) return
    inside.current = true
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setEngaged(true)
      latest.current?.()
    }, INTENT)
  }, [])
  const leave = useCallback(() => {
    inside.current = false
    clearTimeout(timer.current)
    setEngaged(false)
  }, [])
  return { engaged, enter, leave }
}

// Binds an engage's enter/leave to an element as native listeners. `find`
// picks the element from the ref'd node, for a picture whose hover target is
// an ancestor it doesn't render (a use-case card).
export function useHoverTarget(ref, engage, find = (node) => node) {
  const { enter, leave } = engage ?? {}
  const pick = useRef(find)
  useEffect(() => {
    const el = ref.current && pick.current(ref.current)
    if (!el || !enter) return
    el.addEventListener('mouseenter', enter)
    el.addEventListener('mouseleave', leave)
    return () => {
      el.removeEventListener('mouseenter', enter)
      el.removeEventListener('mouseleave', leave)
    }
  }, [ref, enter, leave])
}

// A stage's scene, played again on request. The first run is the scroll-in,
// `first`, which waits its turn in the page's reading order; every replay runs
// `again`, which starts at once. Both must be stable functions (module scope
// or memoised): a Stage restarts whenever its script changes.
//
// That restart is the mechanism. The Stage rewinds its scene to `initial` and
// runs the new script, and the scene's CSS transitions carry it back rather
// than cutting, so a replay reads as the picture gathering itself up and
// playing through.
//
// replay() returns whether it started one, so a picture can tie a change of
// its own (a new design, a new slug) to a replay rather than to every visit.
export function useReplay(first, again) {
  const [take, setTake] = useState(0)
  // Between asking for a replay and the stage rewinding, the old ending is
  // still on screen for a frame. Anything that reacts to the pointer against
  // that ending (a hover lift, a fold) holds off while this is true.
  const [cueing, setCueing] = useState(false)
  // The scroll-in counts as a run, so nothing replays before it has played.
  const busy = useRef(true)
  const script = useMemo(() => {
    const run = take === 0 ? first : again
    return async (a) => {
      busy.current = true
      setCueing(false)
      try {
        await run(a)
      } finally {
        // Also on an abort, when the stage scrolls away: it reruns the scene
        // from the start when it's back, and that run takes the lock again.
        busy.current = false
      }
    }
  }, [take, first, again])
  const replay = useCallback(() => {
    if (busy.current) return false
    busy.current = true
    setCueing(true)
    setTake((t) => t + 1)
    return true
  }, [])
  return { script, replay, cueing }
}
