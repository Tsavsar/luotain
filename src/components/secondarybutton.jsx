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

export default function AuthButton({ icon, label, onClick }) {
  const [hovered, setHovered] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (loading || !onClick) return
    setLoading(true)

    const minDelay = new Promise((resolve) => setTimeout(resolve, 400))
    await Promise.all([onClick(), minDelay])

    setLoading(false)
  }

  return (
    <button
      className='auth-btn'
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '10px',
        background: loading
          ? 'var(--bg-surface)'
          : hovered
            ? 'var(--bg-subtle)'
            : 'var(--bg-surface)',
        color: loading
          ? 'var(--text-sub)'
          : hovered
            ? 'var(--text-strong)'
            : 'var(--text-sub)',
        border: 'none',
        borderRadius: 'var(--radius-lg)',
        cursor: loading ? 'default' : 'pointer',
        transition: 'background 0.15s ease, color 0.15s ease',
      }}
    >
      {loading ? (
        <div
          style={{
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Spinner />
        </div>
      ) : (
        <>
          {icon}
          <span className='para-md'>{label}</span>
        </>
      )}
    </button>
  )
}
