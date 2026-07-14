'use client'

import { createContext, useContext, useState, useLayoutEffect } from 'react'

// ─── Single source of truth for the header's rendered height ───
// Every previous bug tonight (sidebar overlap, scroll-margin mismatch,
// bottom-padding blowing up) traced back to the SAME root cause:
// multiple components independently reading a CSS variable that
// another component wrote, with no guarantee about which ran first.
// React Context fixes this at the architecture level — there's one
// writer (LegalHeaderHeightProvider, used in layout.jsx) and every
// reader gets the value through React's own render cycle, which is
// synchronous and ordered correctly by design. No race is possible.

const LegalContext = createContext(280)

export function useLegalHeaderHeight() {
  return useContext(LegalContext)
}

export function LegalHeaderHeightProvider({ headerRef, children }) {
  const [headerHeight, setHeaderHeight] = useState(280)

  // useLayoutEffect (not useEffect) — runs synchronously right after
  // DOM changes, before the browser paints. Measures as early as
  // physically possible, so there's no visible flash of the wrong value.
  useLayoutEffect(() => {
    function measure() {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.getBoundingClientRect().height)
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [headerRef])

  return (
    <LegalContext.Provider value={headerHeight}>
      {children}
    </LegalContext.Provider>
  )
}
