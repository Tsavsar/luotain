'use client'

import { useState, useEffect, useRef } from 'react'

// ─── Sidebar index, scrolls with the page (position:sticky) ───
// Reverted from position:fixed — fixed elements can visually "bob"
// during scroll on mobile browsers due to how they handle dynamic
// toolbars/momentum scrolling. Sticky avoids that entirely, and
// works correctly here because top is anchored to the REAL measured
// header height, not a guess.
export default function TermsSidebar({ sections }) {
  const [activeId, setActiveId] = useState(sections[0]?.id)
  const navRef = useRef(null)

  useEffect(() => {
    function getHeaderHeight() {
      const val = getComputedStyle(document.documentElement).getPropertyValue(
        '--legal-header-height'
      )
      return parseFloat(val) || 280
    }
    function handleScroll() {
      const scrollPos = window.scrollY + getHeaderHeight() + 20
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id)
        if (el && el.offsetTop <= scrollPos) {
          setActiveId(sections[i].id)
          break
        }
      }
    }
    window.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [sections])

  return (
    <div className='terms-sidebar' style={{ width: '180px', flexShrink: 0 }}>
      <nav
        ref={navRef}
        style={{
          position: 'sticky',
          top: 'calc(var(--legal-header-height, 280px) + 20px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className='para-xs'
            style={{
              color:
                activeId === s.id ? 'var(--text-strong)' : 'var(--text-soft)',
              fontWeight: activeId === s.id ? 500 : 400,
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
          >
            {s.title}
          </a>
        ))}
      </nav>
    </div>
  )
}
