'use client'

import { useState } from 'react'

function Spinner() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className='btn-spinner'
    >
      <circle
        cx='8'
        cy='8'
        r='6'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeDasharray='28'
        strokeDashoffset='21'
      />
    </svg>
  )
}

export default function Continuebutton({ active, label, shaking, onClick }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (loading || !onClick) return
    setLoading(true)

    // Enforces a minimum visible duration — even a click handler that
    // resolves instantly still shows a brief, deliberate flash, so
    // clicking never feels like it did nothing.
    const minDelay = new Promise((resolve) => setTimeout(resolve, 400))
    await Promise.all([onClick(), minDelay])

    setLoading(false)
  }

  return (
    <button
      onClick={handleClick}
      className={shaking ? 'is-shaking' : ''}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '10px',
        background: loading
          ? 'var(--bg-surface)'
          : active
            ? 'var(--primary-base)'
            : 'var(--bg-surface)',
        color: loading
          ? 'var(--text-sub)'
          : active
            ? 'var(--text-inverse)'
            : 'var(--text-sub)',
        border: 'none',
        borderRadius: 'var(--radius-lg)',
        cursor: loading ? 'default' : 'pointer',
        transition: 'background 0.15s ease, color 0.15s ease',
      }}
    >
      {loading ? <Spinner /> : <span className='para-md'>{label}</span>}
    </button>
  )
}
