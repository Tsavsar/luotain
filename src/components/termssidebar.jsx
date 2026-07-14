'use client'

import { useState, useEffect } from 'react'
import { useLegalHeaderHeight } from '@/components/legalcontext'

export default function TermsSidebar({ sections }) {
  const [activeId, setActiveId] = useState(sections[0]?.id)
  const headerHeight = useLegalHeaderHeight()

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
