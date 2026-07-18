'use client'

import StatsSegment from '@/components/statssegment'
import ChartContainer from '@/components/chartcontainer'
import DashboardCards from '@/components/cardcontainer'

export default function AnalyticsPage() {
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
        <StatsSegment />
      </div>

      <div
        className='dashboard-section dashboard-section-4'
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          padding: '0 24px 24px',
        }}
      >
        <ChartContainer />
      </div>

      <div
        className='dashboard-section dashboard-section-5'
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          padding: '0 24px 36px 24px',
          zIndex: '8',
        }}
      >
        <DashboardCards />
      </div>
    </>
  )
}
