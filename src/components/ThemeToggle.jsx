'use client'

import { useState, useEffect } from 'react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'light'
    setTheme(saved)
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
  }

  return (
    <button
      onClick={toggleTheme}
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 999,
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: '1px solid var(--stroke-medium)',
        background: 'var(--bg-default)',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '16px',
      }}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  )
}
