'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// Same exact SVG BackButton uses, mirrored horizontally via
// transform — not a separate icon. A back arrow flipped IS a
// forward arrow, so reusing the real asset here means this can never
// visually drift from what "Back" looks like elsewhere in the app.
function BackIconFlipped() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      style={{ transform: 'scaleX(-1)' }}
    >
      <path
        d='M2.40039 8.8H11.2004C12.526 8.8 13.6004 7.7256 13.6004 6.4V4'
        stroke='var(--text-sub)'
        strokeWidth='1.25'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M5.60039 5.6001L2.40039 8.8001L5.60039 12.0001'
        stroke='var(--text-sub)'
        strokeWidth='1.25'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

// Node 73:5103 — a small nav link, not a page or a toast. Only
// renders once there's actually something in the trash; checks a
// lightweight count endpoint on mount rather than showing itself
// unconditionally and linking to what might be an empty page. This
// is the restored version — confirmed the links page itself was a
// separate file-location issue, not this fetch, before bringing it
// back.
export default function RecentlyDeletedLink() {
  const [count, setCount] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/links/trash/count')
      .then((res) => (res.ok ? res.json() : { count: 0 }))
      .then((data) => {
        if (!cancelled) setCount(data.count ?? 0)
      })
      .catch(() => {
        if (!cancelled) setCount(0)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // null = still loading, not yet known either way — stays hidden
  // rather than flashing on then off once the real count arrives.
  if (!count) return null

  return (
    <Link
      href='/dashboard/links/trash'
      className='para-sm'
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: 'var(--text-sub)',
        textDecoration: 'none',
        width: 'fit-content',
      }}
    >
      Recently deleted
      <BackIconFlipped />
    </Link>
  )
}
