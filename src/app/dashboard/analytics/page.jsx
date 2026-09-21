'use client'

import { useEffect, useState } from 'react'
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

  // Real numbers when mock is off. The page only read from `mock`, so with it
  // off every card on the dashboard was empty — the same gap the link detail
  // page had.
  const [live, setLive] = useState(null)

  const rangeDays =
    {
      'Last 7 days': 7,
      'Last 30 days': 30,
      'Last 60 days': 60,
      'Last 90 days': 90,
      'Last year': 365,
    }[selectedRange] || 30

  useEffect(() => {
    if (useMockData) {
      setLive(null)
      return
    }
    let cancelled = false
    // Filters go up as repeated params. Refetching on change rather than
    // filtering client-side, because the 50k row cap means the browser may not
    // have every row the filter would match.
    const qs = new URLSearchParams({ days: String(rangeDays) })
    for (const f of activeFilters) qs.append('f', `${f.type}:${f.label}`)

    fetch(`/api/analytics?${qs}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (!cancelled) setLive(d)
      })
      .catch(() => {
        if (!cancelled) setLive(null)
      })
    return () => {
      cancelled = true
    }
  }, [useMockData, rangeDays, activeFilters])

  // One source of truth below this line, whichever it came from. Both produce
  // the same shape, so nothing downstream changes.
  const view = useMockData ? mock : live

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
          stats={view?.stats}
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
            data={view?.chartData}
            // From whichever source is active. It was pinned to mock, so with
            // mock off, picking several links never split the chart.
            compareSeries={view?.chartCompareSeries}
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
          data={view?.cardData}
          filterOptions={view?.filterOptions}
          activeFilters={activeFilters}
          onToggleFilter={toggleFilter}
        />
      </div>
    </>
  )
}
