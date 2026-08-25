'use client'

import Link from 'next/link'

// ─── Landing primitives ───
// Every value here is transcribed from the design rather than approximated.
// Pulled out of the page so a spacing change happens once.

export const COLUMN = 800

// px 20 / py 8 / radius 48. The nav and hero use 48; the use-case and closing
// rows use 99 in the design — both are past the pill threshold at this height,
// so they render identically and one value avoids a distinction nobody can see.
export function Pill({ href, tone = 'dark', children }) {
  const dark = tone === 'dark'
  return (
    <Link
      href={href}
      className='landing-pill'
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 20px',
        borderRadius: '48px',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        fontFamily: 'var(--font-sans)',
        fontSize: '12px',
        lineHeight: '16px',
        letterSpacing: '0.24px',
        background: dark ? 'var(--text-strong)' : 'var(--bg-surface)',
        color: dark ? 'var(--bg-default)' : 'var(--text-sub)',
      }}
    >
      {children}
    </Link>
  )
}

// 440 is a real weight, not a rounding of 400. Inter is variable in this
// project, so the design's font-[440] renders exactly — on a static Inter it
// would round to 500 and read heavier than intended.
export function Heading({ size, width, weight = 440, children, id }) {
  return (
    <h2
      id={id}
      style={{
        margin: 0,
        fontFamily: 'var(--font-sans)',
        fontWeight: weight,
        fontSize: `${size}px`,
        lineHeight: 1.1,
        // The design's tracking is uniformly 2% of the size: 32→0.64,
        // 20→0.4, 16→0.32. Derived rather than listed, so it can't drift.
        letterSpacing: `${size * 0.02}px`,
        color: 'var(--text-strong)',
        width: width ? `${width}px` : undefined,
        maxWidth: '100%',
      }}
    >
      {children}
    </h2>
  )
}

// 12 / 16 / 0.24 — the design's Paragraph/X-Small, which is the app's para-xs.
export function Body({ children, width, tone = 'sub' }) {
  return (
    <p
      className='para-xs'
      style={{
        margin: 0,
        color: tone === 'strong' ? 'var(--text-strong)' : 'var(--text-sub)',
        width: width ? `${width}px` : undefined,
        maxWidth: '100%',
      }}
    >
      {children}
    </p>
  )
}

// 10 / 1.4 / 0.2. Not a token in the app — the dashboard's smallest is
// para-xs at 12 — so it's spelled out here rather than bent into an existing
// class that would render 2px larger.
export function Caption({ children, tone = 'sub' }) {
  return (
    <p
      style={{
        margin: 0,
        fontFamily: 'var(--font-sans)',
        fontSize: '10px',
        lineHeight: 1.4,
        letterSpacing: '0.2px',
        color: tone === 'strong' ? 'var(--text-strong)' : 'var(--text-sub)',
      }}
    >
      {children}
    </p>
  )
}

// Features and use cases share this: a 230px well, a 16px title, and copy.
// The use-case variant adds a lead line in text-strong above the body.
export function Card({ title, lead, body, image }) {
  return (
    <article
      className='landing-card'
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '21px',
        width: '256px',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          height: '230px',
          borderRadius: '8px',
          background: 'var(--bg-surface)',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        {image ? (
          <img
            src={image}
            alt=''
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : null}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          width: '100%',
        }}
      >
        <Heading size={16}>{title}</Heading>
        {lead ? <Caption tone='strong'>{lead}</Caption> : null}
        <Caption>{body}</Caption>
      </div>
    </article>
  )
}
