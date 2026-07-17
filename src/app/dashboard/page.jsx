'use client'

import BackButton from '@/components/backbutton'

export default function DashboardPage() {
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
