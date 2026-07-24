'use client'

import { useState } from 'react'

// "3rd July, 2026" — ordinal day, full month name, year. The teen
// exception (11th/12th/13th, not 11st/12nd/13rd) is why this can't
// just be a lookup on the last digit.
export function ordinal(n) {
  const suffixes = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0])
}
export function formatRowDate(date) {
  const d = new Date(date)
  const month = d.toLocaleString('en-US', { month: 'long' })
  return `${ordinal(d.getDate())} ${month}, ${d.getFullYear()}`
}

// Best-effort hostname for a destination favicon.
export function hostnameOf(url) {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

// Shown in place of the favicon when one isn't available — recolored
// from the sample's literal #e8e8e8 to var(--bg-subtle), which is
// what that hex already matches almost exactly, so it stays
// theme-correct instead of freezing at one specific gray forever.
export function NoFaviconIcon() {
  return (
    <svg width='16' height='16' viewBox='0 0 20 20' fill='none'>
      <g fill='var(--bg-subtle)'>
        <path
          d='m10,17c-1.3807,0-2.5-3.134-2.5-7s1.1193-7,2.5-7c1.1019,0,2.0373,1.9961,2.3701,4.7674'
          fill='none'
          stroke='var(--bg-subtle)'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
        />
        <path
          d='m10,17c-3.866,0-7-3.134-7-7s3.134-7,7-7c3.6244,0,6.6054,2.7545,6.9639,6.2843'
          fill='none'
          stroke='var(--bg-subtle)'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
        />
        <line
          x1='3'
          y1='10'
          x2='8.5'
          y2='10'
          fill='none'
          stroke='var(--bg-subtle)'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
        />
        <polygon
          points='11.5 11 17.5 13 14.5 14 13.5 17 11.5 11'
          fill='var(--bg-subtle)'
          stroke='var(--bg-subtle)'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
        />
      </g>
    </svg>
  )
}

// Tries the favicon first, swaps to NoFaviconIcon on load failure
// instead of just leaving a blank gap where a broken image used to
// silently hide itself.
export function DestinationIcon({ domain }) {
  const [failed, setFailed] = useState(false)
  if (!domain || failed) return <NoFaviconIcon />
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`}
      alt=''
      width={16}
      height={16}
      style={{ borderRadius: '4px', flexShrink: 0 }}
      onError={() => setFailed(true)}
    />
  )
}

// direction is 'asc' | 'desc' | null (null = this column isn't the
// one currently sorted). Three color states, not two: neutral gray
// on both arrows when nothing's active here, black on whichever
// arrow matches the active direction, and once a column IS active,
// the OTHER arrow drops to an even lighter gray — more contrast
// against the black one than the neutral gray gave.
export function SortIcon({ direction }) {
  const isActive = direction !== null
  const NEUTRAL = '#A3A3A3'
  const INACTIVE_WHILE_SORTING = 'var(--text-disabled)'
  const upColor =
    direction === 'asc'
      ? 'var(--text-strong)'
      : isActive
        ? INACTIVE_WHILE_SORTING
        : NEUTRAL
  const downColor =
    direction === 'desc'
      ? 'var(--text-strong)'
      : isActive
        ? INACTIVE_WHILE_SORTING
        : NEUTRAL

  return (
    <svg width='16' height='16' viewBox='0 0 16 16' fill='none'>
      <path
        d='M10.3996 5.60019L7.99961 3.2002L5.59961 5.60019'
        stroke={upColor}
        strokeWidth='1.25'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M10.3996 10.4004L7.99961 12.8004L5.59961 10.4004'
        stroke={downColor}
        strokeWidth='1.25'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export function CopyIcon() {
  return (
    <svg width='14' height='14' viewBox='0 0 16 16' fill='none'>
      <rect
        x='5.5'
        y='5.5'
        width='8'
        height='8'
        rx='1.5'
        stroke='var(--text-soft)'
        strokeWidth='1.2'
      />
      <path
        d='M3.5 10.5V4A1.5 1.5 0 0 1 5 2.5H10.5'
        stroke='var(--text-soft)'
        strokeWidth='1.2'
        strokeLinecap='round'
      />
    </svg>
  )
}

// Not a Figma export — a plain 3-dot "more" glyph is about as
// standard as icons get, safe to hand-draw rather than needing the
// real asset.
export function MoreIcon() {
  return (
    <svg width='16' height='16' viewBox='0 0 16 16' fill='none'>
      <circle cx='4' cy='8' r='1.3' fill='var(--text-soft)' />
      <circle cx='8' cy='8' r='1.3' fill='var(--text-soft)' />
      <circle cx='12' cy='8' r='1.3' fill='var(--text-soft)' />
    </svg>
  )
}

export const COL_LINK = '210px'
export const COL_DESTINATION = '220px'
export const COL_DATE = '150px'
// Link + Destination + Date + 3 gaps between the 4 columns (18px)
// account for 598px, leaving exactly 122px for Clicks within a
// 720px-wide table — matches Figma's own math, and the reason
// neither table reserves a 5th column for the more-button: it's an
// absolutely positioned overlay instead (see LinkRow/TrashRow), zero
// footprint in the row's own layout.
export const COL_CLICKS = '122px'
