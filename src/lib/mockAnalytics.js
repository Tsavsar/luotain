'use client'

import { useState } from 'react'
import { useMockDataState } from '@/components/mockdatacontext'
import StatsSegment from '@/components/statssegment'
import ChartContainer from '@/components/chartcontainer'
import DashboardCards from '@/components/cardcontainer'
import FilterPill from '@/components/filterpill'
import { getMockAnalytics } from '@/lib/mockAnalytics'

export default function AnalyticsPage() {
  // Shared across every page and persisted, so switching it on once
  // sticks instead of resetting on each navigation.
  // No ready-gate needed here: this page derives its mock data during
  // render rather than fetching, so there's no request to hold back —
  // it just renders empty for the first frame.
  const { useMockData, deletedUrls } = useMockDataState()
  const [selectedRange, setSelectedRange] = useState('Last 7 days')
  const [activeFilters, setActiveFilters] = useState([])

  const mock = useMockData
    ? getMockAnalytics(selectedRange, activeFilters, deletedUrls)
    : null

  function toggleFilter(filter) {
    setActiveFilters((prev) => {
      const exists = prev.some(
        (f) => f.type === filter.type && f.label === filter.label
      )
      if (exists) {
        return prev.filter(
          (f) => !(f.type === filter.type && f.label === filter.label)
        )
      }
      return [...prev, filter]
    })
  }

  function removeFilter(filter) {
    setActiveFilters((prev) =>
      prev.filter((f) => !(f.type === filter.type && f.label === filter.label))
    )
  }

  function clearAllFilters() {
    setActiveFilters([])
  }

  return (
    <>
      <div
        className='dashboard-section dashboard-section-3 dashboard-page-padding'
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          paddingTop: 0,
          paddingBottom: '24px',
        }}
      >
        <StatsSegment
          stats={mock?.stats}
          selectedRange={selectedRange}
          onRangeChange={setSelectedRange}
          filters={
            activeFilters.length > 0 ? (
              <FilterPill
                filters={activeFilters}
                onRemove={removeFilter}
                onClearAll={clearAllFilters}
              />
            ) : null
          }
        />
      </div>

      <div
        className='dashboard-section dashboard-section-4 dashboard-page-padding'
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '64px',
          paddingBottom: '64px',
        }}
      >
        <div className='chart-full-bleed' style={{ width: '100%' }}>
          <ChartContainer
            data={mock?.chartData}
            compareSeries={mock?.chartCompareSeries}
          />
        </div>
      </div>

      <div
        className='dashboard-section dashboard-section-5 dashboard-page-padding'
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          paddingTop: 0,
          paddingBottom: '36px',
          zIndex: 8,
        }}
      >
        <DashboardCards
          data={mock?.cardData}
          filterOptions={mock?.filterOptions}
          activeFilters={activeFilters}
          onToggleFilter={toggleFilter}
        />
      </div>
    </>
  )
}
