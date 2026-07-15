'use client'

import { useLayoutEffect, useRef } from 'react'
import { useLegalHeaderHeight } from '@/components/legalcontext'

export default function LegalBottomSpacer({ lastSectionId }) {
  const headerHeight = useLegalHeaderHeight()
  const spacerRef = useRef(null)

  useLayoutEffect(() => {
    function measure() {
      const el = document.getElementById(lastSectionId)
      if (!spacerRef.current) return

      const lastHeight = el ? el.getBoundingClientRect().height : 0
      const needed = Math.max(0, window.innerHeight - headerHeight - lastHeight)

      // Mobile browsers often report window.innerHeight as if the
      // address bar is hidden, even when it's visible — inflating
      // this calculation specifically on small screens. Cap the
      // ceiling lower on mobile to compensate.
      const isMobile = window.innerWidth <= 768
      const ceiling = isMobile ? window.innerHeight * 0.5 : window.innerHeight

      spacerRef.current.style.height = `${Math.min(needed, ceiling)}px`
    }

    measure()
    window.addEventListener('resize', measure)

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measure)
    }

    return () => window.removeEventListener('resize', measure)
  }, [lastSectionId, headerHeight])

  return <div ref={spacerRef} aria-hidden='true' />
}
