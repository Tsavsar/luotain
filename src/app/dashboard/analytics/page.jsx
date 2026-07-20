'use client'

import { useState } from 'react'
import StatsSegment from '@/components/statssegment'
import ChartContainer from '@/components/chartcontainer'
import DashboardCards from '@/components/cardcontainer'
import { mockStats, mockChartData, mockCardData } from '@/lib/mockAnalytics'

export default function AnalyticsPage() {
  // Dev-only toggle — flips between the real empty state and the mock
  // dataset, so the populated look can be previewed/iterated on before
  // the actual click-tracking pipeline exists. Remove this (and the
  // toggle UI below) once real data replaces it for good.
  const [useMockData, setUseMockData] = useState(false)

  return (
    <>
      <div
        className='dashboard-section dashboard-section-3'
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          padding: '0 24px 24px',
        }}
      >
        <StatsSegment stats={useMockData ? mockStats : undefined} />
      </div>

      <div
        className='dashboard-section dashboard-section-4'
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          padding: '64px 24px 64px',
        }}
      >
        <ChartContainer data={useMockData ? mockChartData : undefined} />
      </div>

      <div
        className='dashboard-section dashboard-section-5'
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          padding: '0 24px 36px 24px',
          zIndex: 8,
        }}
      >
        <DashboardCards data={useMockData ? mockCardData : undefined} />
      </div>

      <button
        onClick={() => setUseMockData((v) => !v)}
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          background: '#171717',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 'var(--radius-full)',
          cursor: 'pointer',
          zIndex: 999,
        }}
      >
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: 'var(--radius-full)',
            background: useMockData
              ? 'var(--success-base)'
              : 'var(--text-disabled)',
          }}
        />
        <span className='para-xs' style={{ color: 'white' }}>
          Mock data: {useMockData ? 'ON' : 'OFF'}
        </span>
      </button>
    </>
  )
}
