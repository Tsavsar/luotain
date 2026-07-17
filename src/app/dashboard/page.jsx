'use client'

import { Suspense } from 'react'
import BackButton from '@/components/backbutton'

// BackButton uses useSearchParams() internally (the ?from= routing
// logic from the legal pages), which requires a Suspense boundary
// for static prerendering to succeed — same fix as verification-code
// and the legal pages layout earlier tonight.
export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  return (
    <main
      style={{
        position: 'relative',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ position: 'fixed', top: '24px', left: '24px' }}>
        <BackButton />
      </div>

      <p className='title-h4' style={{ color: 'var(--text-strong)' }}>
        Dashboard
      </p>
    </main>
  )
}
