'use client'

import { useEffect } from 'react'
import { useLegalHeaderHeight } from '@/components/legalcontext'

// Reads header height from CONTEXT now, not a CSS-variable race.
// Still writes the RESULT (bottom padding) to a CSS variable, since
// layout.jsx's own padding style needs a plain string value and
// isn't set up to consume context itself — but the INPUT to this
// calculation is now guaranteed correct.
export default function LegalBottomSpacer({ lastSectionId }) {
  const headerHeight = useLegalHeaderHeight()

  useEffect(() => {
    function measure() {
      const el = document.getElementById(lastSectionId)
      const lastHeight = el ? el.getBoundingClientRect().height : 200
      const needed = Math.max(
        60,
        window.innerHeight - headerHeight - lastHeight - 40
      )
      document.documentElement.style.setProperty(
        '--legal-bottom-padding',
        `${needed}px`
      )
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [lastSectionId, headerHeight])

  return null
}
