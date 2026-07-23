'use client'

import { createContext, useContext, useState, useLayoutEffect } from 'react'

// ─── Single source of truth for the header's rendered height ───
// One writer (LegalHeaderHeightProvider, used in layout.jsx), every
// reader gets the value through React's own render cycle, so no
// read/write race is possible.
//
// The remaining bug was never the race, it was the TIMING of the one
// measurement. useLayoutEffect with deps [headerRef] fires exactly
// once, on mount. At that moment the header zone is nowhere near its
// final height, for two independent reasons:
//
//   1. LegalHeader sits inside <Suspense fallback={null}> and calls
//      useSearchParams(), so it suspends. During the suspended pass
//      the zone renders EMPTY, and its height is just its own 80px
//      of top padding. The real header (~260px) arrives later.
//   2. Text reflows when Inter finishes loading, which changes the
//      height again. (legalbottomspacer.jsx already re-measures on
//      document.fonts.ready for exactly this reason. The provider
//      it depends on did not.)
//
// Neither of those fires a resize event, so the stale ~80px value
// stuck permanently. Every consumer inherited it: the sidebar pinned
// itself 80px from the top, i.e. UNDERNEATH the ~260px opaque
// sticky header, which is what made the index look like it was
// scrolling away. Section scroll-margins and the bottom spacer were
// quietly wrong by the same ~180px.
//
// A ResizeObserver on the zone itself fixes all of them at once: it
// fires whenever the element's box actually changes, whatever the
// reason (Suspense resolving, fonts loading, viewport resize, a tab
// switch changing the title's line count).

const LegalContext = createContext(280)

export function useLegalHeaderHeight() {
  return useContext(LegalContext)
}

export function LegalHeaderHeightProvider({ headerRef, children }) {
  const [headerHeight, setHeaderHeight] = useState(280)

  useLayoutEffect(() => {
    const el = headerRef.current
    if (!el) return

    let cancelled = false

    function measure() {
      if (cancelled || !headerRef.current) return
      const next = headerRef.current.getBoundingClientRect().height

      // A zero reading only happens when the element is detached or
      // hidden, never legitimately. Zero is also the single worst
      // value to publish here (it pins the sidebar at the very top of
      // the viewport, behind the header), so refuse it outright.
      if (!next) return

      // Sub-pixel churn would re-render every consumer for nothing.
      setHeaderHeight((prev) => (Math.abs(prev - next) < 0.5 ? prev : next))
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(el)
    window.addEventListener('resize', measure)

    // Belt and braces alongside the observer: the observer already
    // catches font-driven reflow, but this also covers the case where
    // fonts settle before the observer is wired up.
    if (document.fonts?.ready) document.fonts.ready.then(measure)

    return () => {
      cancelled = true
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [headerRef])

  return (
    <LegalContext.Provider value={headerHeight}>
      {children}
    </LegalContext.Provider>
  )
}
