'use client'

import { useState, useEffect } from 'react'

// ─── Fixed-position sidebar — cannot scroll, ever ───
// Previous versions used position:sticky, which is tied to its
// containing block's height. That's why it kept detaching near the
// end of the page. position:fixed has no such dependency — it's
// anchored purely to the viewport, so it truly never moves.
export default function TermsSidebar({ sections }) {
  const [activeId, setActiveId] = useState(sections[0]?.id)

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
    <>
      {/* invisible spacer — reserves the sidebar's width in the flex
          row so content doesn't shift left to fill the gap */}
      <div
        className='terms-sidebar'
        style={{ width: '180px', flexShrink: 0 }}
      />

      {/* the real sidebar — fixed, positioned from measured values,
          detached from document flow entirely */}
      <nav
        className='terms-sidebar'
        style={{
          position: 'fixed',
          left: 'var(--legal-content-left, 24px)',
          top: 'calc(var(--legal-header-height, 280px) + 20px)',
          width: '180px',
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
    </>
  )
}
