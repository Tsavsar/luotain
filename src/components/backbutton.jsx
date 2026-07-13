// src/components/BackButton.jsx
'use client'

export default function BackButton() {
  return (
    <button
      onClick={() => window.history.back()}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
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
