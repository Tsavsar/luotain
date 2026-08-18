'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import PlanIcon from '@/components/planicons'
import { PLANS } from '@/lib/plans'
import { useMockDataState } from '@/components/mockdatacontext'

// ─── Plan badge ───
// In the header, left of the profile avatar.
//
// Only for PAID plans. A "Free" badge is a permanent reminder of what someone
// hasn't bought — it turns a status marker into an advert, and it's on every
// screen. Free users already get the usage banner on the links page, which is
// the same information at the moment it's actually useful.
//
// It was fixed bottom-right, which made it read as an overlay on whatever page
// it happened to be covering. A plan belongs to the account, so it sits where
// the account does.
export default function PlanBadge() {
  const router = useRouter()
  const { useMockData, mockPlan, ready } = useMockDataState()
  const [planId, setPlanId] = useState(null)

  useEffect(() => {
    if (!ready) return
    if (useMockData) {
      setPlanId(mockPlan)
      return
    }
    let cancelled = false
    fetch('/api/plan')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (!cancelled && d?.plan) setPlanId(d.plan)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [ready, useMockData, mockPlan])

  if (!planId || planId === 'FREE') return null

  const plan = PLANS[planId]
  if (!plan) return null

  return (
    <button
      type='button'
      onClick={() => router.push('/dashboard/settings/billing')}
      aria-label={`${plan.name} — manage billing`}
      className='plan-badge'
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        // Tighter than the floating version: in a header it sits next to other
        // controls and has to match their weight rather than announce itself.
        padding: '4px 10px 4px 6px',
        flexShrink: 0,
        borderRadius: 'var(--radius-full)',
        background: 'var(--bg-surface)',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontSize: '11px',
        lineHeight: '16px',
        letterSpacing: '0.22px',
        color: 'var(--text-sub)',
      }}
    >
      {/* 18px, not the 32 used on the billing page. The plant needs to read as
          a mark here, not as an illustration — at 32 it would compete with the
          page it's floating over. */}
      <PlanIcon planId={planId} size={16} />
      {/* plan.name is already "Starter" and "Pro" — only FREE carries the
          "Free plan" wording, and that never reaches here. */}
      {plan.name}
    </button>
  )
}
