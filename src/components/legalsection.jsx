'use client'

import { useLegalHeaderHeight } from '@/components/legalcontext'

// ─── Shared Section + List, used by BOTH terms and privacy pages ───
// Previously these were copy-pasted separately into each page.jsx,
// which is exactly how the scrollMarginTop mismatch happened — two
// copies of the same logic that silently drifted apart. One copy now.
export function Section({ id, title, children }) {
  const headerHeight = useLegalHeaderHeight()

  return (
    <div
      id={id}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        scrollMarginTop: `${headerHeight}px`,
      }}
    >
      <h2 className='label-lg' style={{ color: 'var(--text-strong)' }}>
        {title}
      </h2>
      <div
        className='para-sm'
        style={{ color: 'var(--text-sub)', lineHeight: '22px' }}
      >
        {children}
      </div>
    </div>
  )
}

export function List({ items }) {
  return (
    <ul
      style={{
        margin: '10px 0 0',
        padding: 0,
        listStyle: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {items.map((item, i) => (
        <li
          key={i}
          className='para-sm'
          style={{
            color: 'var(--text-sub)',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
          }}
        >
          <span style={{ color: 'var(--text-soft)', lineHeight: '20px' }}>
            •
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
