'use client'

import { useRef } from 'react'
import LegalHeader from '@/components/legalheader'
import { LegalHeaderHeightProvider } from '@/components/legalcontext'

export default function LegalLayout({ children }) {
  const headerZoneRef = useRef(null)

  return (
    <LegalHeaderHeightProvider headerRef={headerZoneRef}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
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
            padding: '80px var(--legal-side-padding) 0',
          }}
        >
          <LegalHeader />
        </div>

        <div
          style={{
            width: '100%',
            paddingBottom: 'var(--legal-bottom-padding, 200px)',
          }}
        >
          {children}
        </div>
      </div>
    </LegalHeaderHeightProvider>
  )
}
