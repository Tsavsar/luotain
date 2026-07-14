'use client'

import { useEffect } from 'react'

// ─── Measures the real height of the LAST section and computes the
//     exact bottom padding needed so it can scroll all the way up
//     to the header. Replaces the static "240px" guess, which was
//     too small — same category of bug as the header-height guess
//     earlier. Renders nothing; just measures and sets a CSS var.
export default function LegalBottomSpacer({ lastSectionId }) {
  useEffect(() => {
    function measure() {
      const el = document.getElementById(lastSectionId)
      const headerHeight =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            '--legal-header-height'
          )
        ) || 280

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
  }, [lastSectionId])

  return null
}
