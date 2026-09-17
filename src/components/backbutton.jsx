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
// `onBack` overrides the navigation entirely — for multi-step flows where
// back means "previous step", not "previous page". The QR designer uses
// it so backing out of the design step returns to the details rather than
// abandoning the whole thing.
// Where back goes when there's nowhere sensible to return to. Analytics rather
// than '/dashboard', which has no page of its own.
const FALLBACK = '/dashboard/analytics'

export default function BackButton({ onBack, requireFrom = false }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from')

  const handleBack = () => {
    if (onBack) {
      onBack()
      return
    }
    if (from) {
      const target = from.startsWith('/') ? from : `/${from}`
      // `from` comes off the query string, so it gets checked before use.
      // Same-origin paths only, and '/dashboard' is rejected by name: it's a
      // layout with no page of its own, so it 404s. The workspace switcher
      // was passing exactly that, which is the bug this fixes.
      const safe =
        /^\/[^/]/.test(target) &&
        !target.startsWith('//') &&
        target !== '/dashboard'
      router.push(safe ? target : FALLBACK)
      return
    }
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(FALLBACK)
    }
  }

  // Nothing to go back to, so nothing to render. new-org uses this: someone
  // who arrived from the workspace switcher has a `from` and a place to
  // return to, but a first-time user with no workspace yet was being offered
  // a button to an analytics page they can't use.
  if (requireFrom && !from && !onBack) return null

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
