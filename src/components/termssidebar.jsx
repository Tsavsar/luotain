'use client'

import { useState, useEffect, useRef } from 'react'

// ─── Sidebar index with scroll-based active state ───
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

    scrollContainer.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [sections])

  return (
    // OUTER wrapper — deliberately has NO alignSelf override, so it
    // stretches to match the content column's full height (flex row
    // default behaviour). This tall box is what gives the short inner
    // <nav> a "track" long enough to stay sticky for the ENTIRE scroll —
    // without it, sticky only holds within the nav's own short height
    // and then the sidebar disappears once you scroll past that point.
    <div style={{ width: '180px', flexShrink: 0 }}>
      <nav
        ref={navRef}
        className='terms-sidebar'
        style={{
          position: 'sticky',
          top: '20px',
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
