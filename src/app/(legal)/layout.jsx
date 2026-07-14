'use client'

import { useRef, useEffect } from 'react'
import LegalHeader from '@/components/legalheader'

export default function LegalLayout({ children }) {
  const headerZoneRef = useRef(null)
  const contentRef = useRef(null)

  useEffect(() => {
    function measure() {
      if (headerZoneRef.current) {
        document.documentElement.style.setProperty(
          '--legal-header-height',
          `${headerZoneRef.current.getBoundingClientRect().height}px`
        )
      }
      if (contentRef.current) {
        document.documentElement.style.setProperty(
          '--legal-content-left',
          `${contentRef.current.getBoundingClientRect().left}px`
        )
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <div
        ref={headerZoneRef}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          width: '100%',
          background: 'var(--bg-default)',
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '80px',
        }}
      >
        <LegalHeader />
      </div>

      {/* content column — width/position measured above so the
          fixed sidebar (in termssidebar.jsx) can align to it exactly.
          paddingBottom is just enough room for the LAST section to
          reach the header, not a full screen of dead space. */}
      <div
        ref={contentRef}
        style={{
          width: '100%',
          maxWidth: '920px',
          paddingBottom: 'var(--legal-bottom-padding, 400px)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
