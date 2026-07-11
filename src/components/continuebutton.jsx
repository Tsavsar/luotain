'use client'

import { useState } from 'react'

export default function Continuebutton({ active, label, shaking, onClick }) {
  return (
    <button
      onClick={onClick}
      className={shaking ? 'is-shaking' : ''}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px',
        background: active ? 'var(--primary-base)' : 'var(--bg-surface)',
        color: active ? 'var(--text-inverse)' : 'var(--text-sub)',
        border: 'none',
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        transition: 'background 0.15s ease, color 0.15s ease',
      }}
    >
      <span className='para-md'>{label}</span>
    </button>
  )
}
