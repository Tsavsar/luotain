'use client'

import { useEffect, useState } from 'react'

// ─── Cookie banner ───
// Node 75:4714.
//
// Nothing sets a tracking cookie yet, so this is dormant by default and shows
// only when told to. That's deliberate: a consent banner on a site that sets
// no optional cookies is asking permission for something that isn't happening,
// which is both pointless and the kind of thing that erodes trust in the
// banner when it DOES matter.
//
// Flip COOKIES_ACTIVE — or pass `active` — the day analytics or a marketing
// pixel actually lands.
const STORAGE_KEY = 'luotain:cookie-consent'

// The one switch. Set true when there's something to consent to.
export const COOKIES_ACTIVE = false

function CloseIcon() {
  return (
    <svg
      width='18'
      height='18'
      viewBox='0 0 18 18'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M5 5l8 8M13 5l-8 8'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
    </svg>
  )
}

// Read once, outside the component, so a decision already made never causes a
// flash of the banner on the way to being hidden.
function storedChoice() {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    // Private browsing throws on access. Treated as "no decision", which shows
    // the banner — the safe direction, since the alternative is assuming
    // consent nobody gave.
    return null
  }
}

export default function CookieBanner({ active = COOKIES_ACTIVE, onDecision }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!active) return
    // Deferred to an effect rather than useState's initialiser: localStorage
    // isn't available during the server render, and reading it there is a
    // hydration mismatch waiting to happen.
    if (!storedChoice()) setOpen(true)
  }, [active])

  function decide(choice) {
    try {
      window.localStorage.setItem(STORAGE_KEY, choice)
    } catch {
      // A failed write means they'll be asked again next visit. Annoying, not
      // broken — and better than blocking the dismissal on storage working.
    }
    setOpen(false)
    onDecision?.(choice)
  }

  if (!active || !open) return null

  return (
    <div
      role='dialog'
      aria-label='Cookie preferences'
      aria-live='polite'
      className='cookie-banner'
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        alignItems: 'flex-start',
        padding: '24px',
        borderRadius: '24px',
        background: 'var(--bg-default)',
        border: '1px solid var(--stroke-soft)',
        // boxShadow rather than the design's drop-shadow filter: on an opaque
        // rounded rect the two are indistinguishable, and box-shadow doesn't
        // force a new compositing layer.
        boxShadow: '0 10px 20px 3px rgba(0, 0, 0, 0.04)',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            width: '100%',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
              fontSize: '16px',
              lineHeight: '24px',
              letterSpacing: '0.32px',
              color: 'var(--text-strong)',
            }}
          >
            {/* "Luotain", not the design's "Loutain" — a typo in the product's
                own name on a consent notice is the worst place for one. */}
            Luotain user cookies
          </p>

          {/* Dismiss is NOT a decision. It closes for this visit and asks
              again next time, because treating a close as consent is exactly
              what consent rules exist to prevent. */}
          <button
            type='button'
            onClick={() => setOpen(false)}
            aria-label='Close, ask me again later'
            className='cookie-close'
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '18px',
              height: '18px',
              padding: 0,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: 'var(--text-soft)',
              flexShrink: 0,
            }}
          >
            <CloseIcon />
          </button>
        </div>

        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-sans)',
            fontSize: '14px',
            lineHeight: '20px',
            letterSpacing: '0.28px',
            color: 'var(--text-sub)',
          }}
        >
          We use essential cookies to make the site work. Optional ones help us
          understand how it&rsquo;s used and improve it. Choosing
          &ldquo;Accept&rdquo; agrees to the optional ones.
        </p>
      </div>

      <div
        className='cookie-actions'
        style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}
      >
        {/* Reject first, and the same size as Accept. A reject option that's
            smaller or greyer than accept is a dark pattern, and in several
            jurisdictions it's also non-compliant. */}
        <button
          type='button'
          onClick={() => decide('essential')}
          className='cookie-btn'
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 10px',
            width: '172px',
            borderRadius: '45px',
            border: 'none',
            cursor: 'pointer',
            background: 'var(--bg-surface)',
            fontFamily: 'var(--font-sans)',
            fontSize: '14px',
            lineHeight: '20px',
            letterSpacing: '0.28px',
            color: 'var(--text-sub)',
            whiteSpace: 'nowrap',
          }}
        >
          Reject non-essentials
        </button>

        <button
          type='button'
          onClick={() => decide('all')}
          className='cookie-btn'
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 20px',
            borderRadius: '45px',
            border: 'none',
            cursor: 'pointer',
            background: 'var(--text-strong)',
            fontFamily: 'var(--font-sans)',
            fontSize: '14px',
            lineHeight: '20px',
            letterSpacing: '0.28px',
            color: 'var(--bg-default)',
            whiteSpace: 'nowrap',
          }}
        >
          Accept
        </button>
      </div>
    </div>
  )
}
