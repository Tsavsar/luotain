'use client'

import Link from 'next/link'

// Not a Figma export — a simple external/arrow-link glyph is
// standard enough to hand-draw rather than chase down the exact
// asset.
function ArrowIcon() {
  return (
    <svg width='14' height='14' viewBox='0 0 14 14' fill='none'>
      <path
        d='M4 10L10 4M10 4H5M10 4V9'
        stroke='var(--text-sub)'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

// Node 73:5103 — a small nav link, not a page or a toast. Placed on
// the links page so people can get to the trash whenever they want,
// not just right after deleting something.
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
      <ArrowIcon />
    </Link>
  )
}
