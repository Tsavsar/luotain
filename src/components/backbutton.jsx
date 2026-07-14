'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

// ─── Back button, routes to wherever the person actually came from ───
// Reads a ?from= query param (set by whichever page linked here —
// login, get-started, etc.) and routes back to that specific page.
// Falls back to '/' if the param is missing or unrecognized, so this
// still works fine even from a direct link with no ?from= at all.
const DESTINATIONS = {
  login: '/login',
  'get-started': '/get-started',
}

export default function BackButton() {
  const searchParams = useSearchParams()
  const from = searchParams.get('from')
  const backHref = DESTINATIONS[from] || '/'

  return (
    <Link
      href={backHref}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        textDecoration: 'none',
        width: 'fit-content',
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
    </Link>
  )
}
