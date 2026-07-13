'use client'

import { useState, useEffect, useRef } from 'react'

// ─── Sidebar index with scroll-based active state ───
// Finds its own scrollable ancestor (.legal-scroll-area, set up in
// page.jsx) and watches ITS scroll position — not window.scrollY —
// since the page no longer scrolls as a whole document.
export default function TermsSidebar({ sections }) {
  const [activeId, setActiveId] = useState(sections[0]?.id)
  const navRef = useRef(null)

  useEffect(() => {
    const scrollContainer = navRef.current?.closest('.legal-scroll-area')
    if (!scrollContainer) return

    function handleScroll() {
      const containerTop = scrollContainer.getBoundingClientRect().top
      const scrollPos = scrollContainer.scrollTop + 40

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id)
        if (!el) continue
        const elTop =
          el.getBoundingClientRect().top -
          containerTop +
          scrollContainer.scrollTop
        if (elTop <= scrollPos) {
          setActiveId(sections[i].id)
          break
        }
      }
    }

    // NOTE: was previously window.addEventListener('', handleScroll) —
    // empty string meant this never actually fired. Fixed to 'scroll'
    // and attached to the content container, not window.
    scrollContainer.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [sections])

  return (
    <nav
      ref={navRef}
      className='terms-sidebar'
      style={{
        width: '180px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        position: 'sticky',
        top: '20px',
        alignSelf: 'flex-start',
        height: 'fit-content',
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
  )
}
