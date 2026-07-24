'use client'

import Link from 'next/link'

// TEMPORARY DIAGNOSTIC VERSION — the fetch-on-mount that checked
// whether the trash was empty has been pulled out entirely. If the
// links page opens again with this in place, that fetch (or the
// /api/links/trash/count route it called) was the actual problem;
// if the page still won't open, it wasn't this file at all. Always
// renders for now — the "hide when trash is empty" behavior is
// gone until the real cause is found, not forgotten.
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

export default function RecentlyDeletedLink() {
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
