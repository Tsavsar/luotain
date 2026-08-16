'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PLANS } from '@/lib/plans'
import { useMockDataState } from '@/components/mockdatacontext'

// ─── Usage banner ───
// "You have used 3 out of your 5 free links."
//
// On the links page, where someone is looking at the thing being counted. The
// billing page carries the same sentence, but nobody visits billing to find out
// whether they're near a limit — they find out by being blocked.
//
// Renders nothing on an unlimited plan. A bar that can never fill is furniture.
function InfoIcon() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden='true'
    >
      <circle cx='8' cy='8' r='6' stroke='currentColor' strokeWidth='1.4' />
      <path
        d='M8 7.2v3.4'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
      />
      <circle cx='8' cy='5.2' r='0.85' fill='currentColor' />
    </svg>
  )
}

export default function UsageBanner({ linkCount }) {
  const router = useRouter()
  const { useMockData, mockPlan, ready } = useMockDataState()
  const [plan, setPlan] = useState(null)

  useEffect(() => {
    if (!ready) return
    if (useMockData) {
      setPlan(PLANS[mockPlan] || PLANS.FREE)
      return
    }
    let cancelled = false
    fetch('/api/plan')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (!cancelled && d?.plan) setPlan(PLANS[d.plan] || PLANS.FREE)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [ready, useMockData, mockPlan])

  // Nothing until both numbers are known. Showing "0 of 5" while the count
  // loads would tell someone with four links that they have none.
  if (!plan || plan.maxLinks == null || typeof linkCount !== 'number')
    return null

  const atLimit = linkCount >= plan.maxLinks
  // "Getting close" starts at 80%, so there's room to act before the create
  // button starts failing rather than warning at the moment it's too late.
  const near = !atLimit && linkCount >= plan.maxLinks * 0.8

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        padding: '8px 10px',
        borderRadius: '10px',
        background: atLimit
          ? 'var(--error-mute)'
          : near
            ? 'var(--primary-mute)'
            : 'var(--bg-surface)',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <span
        style={{
          display: 'flex',
          flexShrink: 0,
          color: atLimit
            ? 'var(--error-base)'
            : near
              ? 'var(--primary-base)'
              : 'var(--text-sub)',
        }}
      >
        <InfoIcon />
      </span>

      <p
        className='para-xs'
        style={{
          margin: 0,
          flex: '1 0 0',
          minWidth: 0,
          color: atLimit
            ? 'var(--error-base)'
            : near
              ? 'var(--primary-dark)'
              : 'var(--text-sub)',
        }}
      >
        {/* One sentence at every count, so it reads 4 of 5 then 5 of 5. Swapping
            the wording at the limit would mean the number you most want to see
            is the one that gets replaced. */}
        You have used {linkCount} out of your {plan.maxLinks}
        {plan.id === 'FREE' ? ' free' : ''} links
      </p>

      {/* Only once it's relevant. An upgrade prompt on an empty workspace is an
          advert; at 80% it's the next thing you need. */}
      {atLimit || near ? (
        <button
          type='button'
          onClick={() => router.push('/dashboard/settings/billing')}
          className='billing-action'
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            flexShrink: 0,
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            lineHeight: '16px',
            letterSpacing: '0.24px',
            color: atLimit ? 'var(--error-base)' : 'var(--primary-dark)',
            textDecoration: 'underline',
            textDecorationStyle: 'dotted',
            textUnderlineOffset: '3px',
          }}
        >
          Upgrade
        </button>
      ) : null}
    </div>
  )
}
