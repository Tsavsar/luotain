'use client'

import StatsCards from './statscards'

// Maps this page's stats shape into StatsCards' generic metrics
// format — StatsCards itself doesn't know or care that these three
// specific fields exist, it just renders whatever cards it's given.
export default function LinksStats({ stats, selectedRange, onRangeChange }) {
  const metrics = [
    {
      label: 'Total clicks',
      value: stats?.totalClicks,
      trend: stats?.clicksTrend,
    },
    {
      label: 'Unique visitors',
      value: stats?.uniqueVisitors,
      trend: stats?.visitorsTrend,
    },
    {
      label: 'Links created',
      value: stats?.linksCreated,
      trend: stats?.linksTrend,
    },
  ]

  return (
    <StatsCards
      title='All links'
      metrics={metrics}
      selectedRange={selectedRange}
      onRangeChange={onRangeChange}
    />
  )
}
