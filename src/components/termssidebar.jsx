'use client'

import { useState, useEffect } from 'react'
import { useLegalHeaderHeight } from '@/components/legalcontext'

export default function TermsSidebar({ sections }) {
  const [activeId, setActiveId] = useState(sections[0]?.id)
  const measuredHeaderHeight = useLegalHeaderHeight()

  // The real fix for the index scrolling away lives in
  // legalcontext.jsx (the height was measured once, too early, and
  // never updated). This is the local guard: the failure mode was a
  // too-small offset pinning the nav BEHIND the opaque sticky header
  // rather than below it, and a bad offset here is invisible in code
  // review because `position: sticky` still "works", it just sticks
  // in the wrong place. So refuse anything that isn't a sane
  // positive number and fall back to the context's own default.
  const headerHeight =
    Number.isFinite(measuredHeaderHeight) && measuredHeaderHeight > 0
      ? measuredHeaderHeight
      : 280

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) setActiveId(visible[0].target.id)
      },
      { rootMargin: `-${headerHeight}px 0px -60% 0px`, threshold: 0 }
    )

    sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [sections, headerHeight])

  return (
    <div className='terms-sidebar' style={{ width: '180px', flexShrink: 0 }}>
      <nav
        style={{
          position: 'sticky',
          top: `${headerHeight}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          // 11 items runs ~570px tall. On a 13in laptop (~700px
          // viewport) minus the header there isn't room for that, and
          // without a ceiling the tail of the index simply gets cut
          // off with no way to reach it. The scrollbar only appears
          // when it's actually needed.
          maxHeight: `calc(100vh - ${headerHeight}px - 32px)`,
          overflowY: 'auto',
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
              transition: 'color 0.2s ease, font-weight 0.2s ease',
            }}
          > 
            {s.title}
          </a>
        ))}
      </nav>
    </div>
  )
}
