'use client'

import StatsCards from './statscards'
import CountryFlag from './countryflag'

// Reconstructed from memory rather than a fresh copy of the current
// file — I haven't touched statssegment.jsx directly this session,
// so unlike the other files I've been iterating on, I can't be
// fully sure this still matches what's actually deployed. The 4
// fields here (clicks/scans/visitors/country) match what I have on
// record, but if anything's drifted since, send the real file and
// I'll reconcile it properly rather than layering a guess on a guess.
export default function StatsSegment({ stats, selectedRange, onRangeChange }) {
  const metrics = [
    {
      label: 'Total clicks',
      value: stats?.totalClicks,
      trend: stats?.clicksTrend,
    },
    {
      label: 'Total scans',
      value: stats?.totalScans,
      trend: stats?.scansTrend,
    },
    {
      label: 'Unique visitors',
      value: stats?.uniqueVisitors,
      trend: stats?.visitorsTrend,
    },
    {
      label: 'Top country',
      value: stats?.topCountry?.name,
      icon: stats?.topCountry ? (
        <CountryFlag country={stats.topCountry.name} />
      ) : null,
      trend: stats?.topCountry
        ? { label: `${stats.topCountry.percentage}%`, color: 'var(--text-sub)' }
        : null,
    },
  ]

  return (
    <StatsCards
      // Best guess at a title matching "All links" on the links
      // page — Figma's redesign frame only showed the links-page
      // instance, so this one's not confirmed against a real design.
      title='Overview'
      metrics={metrics}
      selectedRange={selectedRange}
      onRangeChange={onRangeChange}
    />
  )
}
