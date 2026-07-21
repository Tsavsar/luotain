'use client'

function DirectLinkIcon() {
  return (
    <svg
      width='18'
      height='18'
      viewBox='0 0 18 18'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M9.9 5.4L8.13 3.63C6.89 2.39 4.87 2.39 3.63 3.63C2.39 4.87 2.39 6.89 3.63 8.13L5.4 9.9'
        stroke='var(--text-soft)'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M8.1 12.6L9.87 14.37C11.11 15.61 13.13 15.61 14.37 14.37C15.61 13.13 15.61 11.11 14.37 9.87L12.6 8.1'
        stroke='var(--text-soft)'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M10.8 10.8L7.2 7.2'
        stroke='var(--text-soft)'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

// ─── SourceIcon ───
// Was private to cardcontainer.jsx — pulled out here (same pattern
// as countryflag.jsx) now that filterpill.jsx needs the exact same
// favicon treatment for source-type filter tags.
export default function SourceIcon({ domain }) {
  if (!domain || domain.toLowerCase() === 'direct') {
    return <DirectLinkIcon />
  }
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`}
      alt=''
      width={18}
      height={18}
      style={{ borderRadius: '4px', flexShrink: 0 }}
      onError={(e) => {
        e.currentTarget.style.display = 'none'
      }}
    />
  )
}
