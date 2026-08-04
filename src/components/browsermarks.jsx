'use client'

// ─── Browser marks ───
// The small badge on a session's device circle. Simplified to read at 10px,
// which is the size they're actually used at — the real Chrome and Safari
// logos have detail that turns to mush below about 16px.
//
// Chrome keeps its brand colours because the three segments ARE the
// identity; the rest are monochrome on currentColor, since at this size a
// recognisable silhouette does more work than an approximate colour.

export function ChromeMark({ size = 10 }) {
  return (
    <svg width={size} height={size} viewBox='0 0 16 16' aria-hidden='true'>
      <circle cx='8' cy='8' r='7.4' fill='#fff' />
      <path
        d='M8 .6a7.4 7.4 0 0 1 6.4 3.7H8a3.7 3.7 0 0 0-3.5 2.5L2.3 3A7.4 7.4 0 0 1 8 .6Z'
        fill='#EA4335'
      />
      <path
        d='M2.3 3l2.2 3.8A3.7 3.7 0 0 0 7.3 12l-2.1 3.1A7.4 7.4 0 0 1 2.3 3Z'
        fill='#34A853'
      />
      <path
        d='M14.4 4.3a7.4 7.4 0 0 1-9.2 10.8l3.1-5.4a3.7 3.7 0 0 0 2.4-5.4h3.7Z'
        fill='#FBBC05'
      />
      <circle cx='8' cy='8' r='2.9' fill='#4285F4' />
    </svg>
  )
}

export function SafariMark({ size = 10 }) {
  return (
    <svg width={size} height={size} viewBox='0 0 16 16' aria-hidden='true'>
      <circle
        cx='8'
        cy='8'
        r='7.2'
        fill='#fff'
        stroke='currentColor'
        strokeWidth='1.1'
        opacity='0.85'
      />
      {/* The compass needle, which is the whole identity of the mark. */}
      <path
        d='M11.2 4.8 6.9 6.9 4.8 11.2l4.3-2.1 2.1-4.3Z'
        fill='currentColor'
      />
    </svg>
  )
}

export function FirefoxMark({ size = 10 }) {
  return (
    <svg width={size} height={size} viewBox='0 0 16 16' aria-hidden='true'>
      <circle cx='8' cy='8' r='7.2' fill='#fff' />
      <path
        d='M8 1.2a6.8 6.8 0 1 0 6.6 8.4c-.5 1.5-1.9 2.6-3.6 2.6a3.9 3.9 0 0 1-3.9-3.9c0-1.6 1-2.9 2.4-3.5-1.9-.5-3.6.3-4.4 1.6.4-2.2 2-3.9 4-4.5-.4-.4-.7-.6-1.1-.7Z'
        fill='currentColor'
      />
    </svg>
  )
}

export function GenericBrowserMark({ size = 10 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden='true'
    >
      <circle cx='8' cy='8' r='6.4' stroke='currentColor' strokeWidth='1.3' />
      <path
        d='M1.6 8h12.8M8 1.6a11 11 0 0 1 0 12.8A11 11 0 0 1 8 1.6Z'
        stroke='currentColor'
        strokeWidth='1.3'
      />
    </svg>
  )
}

export function browserMarkFor(browser) {
  if (browser === 'Chrome') return ChromeMark
  if (browser === 'Safari') return SafariMark
  if (browser === 'Firefox') return FirefoxMark
  return GenericBrowserMark
}
