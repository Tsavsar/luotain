'use client'

import { useLayoutEffect, useRef } from 'react'
import { useLegalHeaderHeight } from '@/components/legalcontext'

// ─── Exact trailing space — not a flat overshoot ───
// Earlier version used a flat 100vh so Contact could ALWAYS reach the
// header, but that let scrolling continue past that point into truly
// empty space. This computes the precise minimum needed instead:
// viewport height − header height − the last section's own height.
// That means max-scroll lands exactly on "Contact at eye level,"
// never short of it, never past it.
// This is trustworthy now specifically because headerHeight comes
// from Context (real React state) instead of the old CSS-variable
// read, which had a race condition — that was the actual reason the
// calculated approach kept breaking earlier tonight, not the formula.
export default function LegalBottomSpacer({ lastSectionId }) {
  const headerHeight = useLegalHeaderHeight()
  const spacerRef = useRef(null)

  useLayoutEffect(() => {
    function measure() {
      const el = document.getElementById(lastSectionId)
      if (!spacerRef.current) return
      const lastHeight = el ? el.getBoundingClientRect().height : 0
      const needed = Math.max(0, window.innerHeight - headerHeight - lastHeight)
      spacerRef.current.style.height = `${needed}px`
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [lastSectionId, headerHeight])

  return <div ref={spacerRef} aria-hidden='true' />
}
