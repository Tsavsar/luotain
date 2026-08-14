'use client'

// ─── Plan stage icons ───
// Free, Starter and Pro as a growing plant — a sprout, a bud on a stem, then a
// branched plant with three blossoms.
//
// Recoloured onto the brand palette rather than shipped as-is. The originals
// use a green stem with orange-yellow growth; here the stem is neutral and the
// growth is the brand orange, so the orange is what carries the tier rather than
// competing with a second hue.
//
// Tokens, not hex — unlike the card marks next door, which must keep their own
// colours. These are illustration, so they follow the theme: a near-black stem
// in light mode becomes near-white in dark, which a hardcoded green never would.
const STEM = 'var(--text-strong)'
const GROWTH = 'var(--primary-base)'
const GROWTH_EDGE = 'var(--primary-faint)'

function FreeIcon({ size = 32 }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={size}
      height={size}
      viewBox='0 0 80 80'
      aria-hidden='true'
      style={{ display: 'block', flexShrink: 0 }}
    >
      <g
        fill='none'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='4'
      >
        <path
          fill={STEM}
          stroke={STEM}
          d='M49.042 67.502A.46.46 0 0 0 49.5 68h5c.27 0 .48-.23.459-.498l-.806-9.668A2 2 0 0 0 52.16 56h-.32a2 2 0 0 0-1.993 1.834z'
        />
        <path stroke={STEM} d='M52 68V20a8 8 0 0 0-8-8H42' />
        <path
          className='plan-bloom'
          fill={GROWTH}
          stroke={GROWTH_EDGE}
          d='M25 10h17v8a8.5 8.5 0 0 1-17 0z'
        />
      </g>
    </svg>
  )
}

function StarterIcon({ size = 32 }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={size}
      height={size}
      viewBox='0 0 80 80'
      aria-hidden='true'
      style={{ display: 'block', flexShrink: 0 }}
    >
      <g
        fill='none'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='4'
      >
        <path fill={STEM} stroke={STEM} d='M37 72h6l-2-12h-2z' />
        <path stroke={STEM} d='M40 27v33m4-33h-8' />
        <path
          className='plan-bloom'
          fill={GROWTH}
          stroke={GROWTH_EDGE}
          d='M31 5h18l-1.5 17H32.5z'
        />
        <path stroke={GROWTH_EDGE} d='M40 13V5' />
      </g>
    </svg>
  )
}

function ProIcon({ size = 32 }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={size}
      height={size}
      viewBox='0 0 80 80'
      aria-hidden='true'
      style={{ display: 'block', flexShrink: 0 }}
    >
      <g
        fill='none'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='4'
      >
        <path fill={STEM} stroke={STEM} d='M37 70h6l-2-12h-2z' />
        <path stroke={STEM} d='M40 19v40m12-32H28m0-8v8m24-8v8' />
        {/* Staggered, not simultaneous. Three blossoms pulsing in unison read
            as a flash; offset, they read as something alive. The outer two are
            offset furthest so the eye starts at the tallest. */}
        <rect
          className='plan-bloom'
          style={{ animationDelay: '0.9s' }}
          width='12'
          height='12'
          x='22'
          y='11'
          fill={GROWTH}
          stroke={GROWTH_EDGE}
          rx='6'
        />
        <rect
          className='plan-bloom'
          width='12'
          height='12'
          x='34'
          y='6'
          fill={GROWTH}
          stroke={GROWTH_EDGE}
          rx='6'
        />
        <rect
          className='plan-bloom'
          style={{ animationDelay: '0.45s' }}
          width='12'
          height='12'
          x='46'
          y='11'
          fill={GROWTH}
          stroke={GROWTH_EDGE}
          rx='6'
        />
        <path stroke={STEM} d='M44 31h-8' />
      </g>
    </svg>
  )
}

export default function PlanIcon({ planId, size = 32 }) {
  if (planId === 'PRO') return <ProIcon size={size} />
  if (planId === 'STARTER') return <StarterIcon size={size} />
  return <FreeIcon size={size} />
}
