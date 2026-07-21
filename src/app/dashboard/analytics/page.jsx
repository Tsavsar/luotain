'use client'

import { useState } from 'react'
import StatsSegment from '@/components/statssegment'
import ChartContainer from '@/components/chartcontainer'
import DashboardCards from '@/components/cardcontainer'
import FilterPill from '@/components/filterpill'
import { getMockAnalytics } from '@/lib/mockAnalytics'

export default function AnalyticsPage() {
  const [useMockData, setUseMockData] = useState(false)
  const [selectedRange, setSelectedRange] = useState('Last 7 days')
  const [activeFilter, setActiveFilter] = useState(null)

  // Filter now genuinely changes the numbers — it's passed straight
  // through to aggregation, same call either way.
  const mock = useMockData
    ? getMockAnalytics(selectedRange, activeFilter)
    : null

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
        <StatsSegment
          stats={mock?.stats}
          selectedRange={selectedRange}
          onRangeChange={setSelectedRange}
        />
      </div>

      {activeFilter && (
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            padding: '0 24px',
          }}
        >
          <div style={{ width: '100%', maxWidth: '720px' }}>
            <FilterPill
              filter={activeFilter}
              onClear={() => setActiveFilter(null)}
            />
          </div>
        </div>
      )}

      <div
        className='dashboard-section dashboard-section-4'
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          padding: '64px 24px 64px',
        }}
      >
        <ChartContainer data={mock?.chartData} />
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
        <DashboardCards
          data={mock?.cardData}
          activeFilter={activeFilter}
          onFilterSelect={setActiveFilter}
        />
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
