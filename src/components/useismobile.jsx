'use client'

import { useEffect, useState } from 'react'

// ─── useIsMobile ───
// Matches the project's 768px breakpoint.
//
// Returns null until mounted, not false. That distinction matters: a media
// query can't be read during server render, so guessing "desktop" and
// correcting on mount would flash the desktop layout on every phone load.
// Callers render nothing while it's null.
export default function useIsMobile(query = '(max-width: 768px)') {
  const [isMobile, setIsMobile] = useState(null)

  useEffect(() => {
    const mq = window.matchMedia(query)
    setIsMobile(mq.matches)
    const onChange = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])

  return isMobile
}
