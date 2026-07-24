'use client'

import { useRouter, useSearchParams } from 'next/navigation'

// router.back() pops ONE step of browser history, which breaks the
// moment there's more than one step between "origin" and "here" —
// exactly what happens navigating origin -> Privacy -> Terms, where
// Back only undoes the Privacy<->Terms hop instead of returning to
// origin. legalheader.jsx already carries a ?from= param forward
// across that exact hop for this reason; this reads it and jumps
// straight there instead of asking history to reconstruct the path.
//
// ?from= is expected to be a full path, URL-encoded by whoever sets
// it first (e.g. from=%2Flogin) — that's the only form that can't be
// ambiguous. I haven't seen every page that sets it, so as a
// fallback for a bare keyword (from=login, no leading slash) this
// guesses by prefixing a "/", which is right for a single-segment
// route but won't be for anything nested. If any origin uses a
// keyword that maps to a nested path, send me that page and I'll
// special-case it here instead of guessing further.
export default function BackButton() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from')

  const handleBack = () => {
    if (from) {
      router.push(from.startsWith('/') ? from : `/${from}`)
      return
    }
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/dashboard/analytics')
    }
  }

  return (
    <button
      type='button'
      onClick={handleBack}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: 'fit-content',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
      }}
    >
      <svg
        width='16'
        height='16'
        viewBox='0 0 16 16'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
      >
        <path
          d='M2.40039 8.8H11.2004C12.526 8.8 13.6004 7.7256 13.6004 6.4V4'
          stroke='var(--text-soft)'
          strokeWidth='1.25'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <path
          d='M5.60039 5.6001L2.40039 8.8001L5.60039 12.0001'
          stroke='var(--text-soft)'
          strokeWidth='1.25'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>

      <span className='label-sm' style={{ color: 'var(--text-sub)' }}>
        Back
      </span>
    </button>
  )
}
