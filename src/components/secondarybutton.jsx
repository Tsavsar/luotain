'use client'

import { useState } from 'react'

export default function AuthButton({ icon, label, onClick }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      className='auth-btn'
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '10px',
        background: hovered ? 'var(--bg-subtle)' : 'var(--bg-surface)',
        color: hovered ? 'var(--text-strong)' : 'var(--text-sub)',
        border: 'none',
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        transition: 'background 0.15s ease, color 0.15s ease',
      }}
    >
      {icon}
      <span className='para-md'>{label}</span>
    </button>
  )
}
