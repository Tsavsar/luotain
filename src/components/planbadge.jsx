'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import PlanIcon from '@/components/planicons'
import { PLANS } from '@/lib/plans'
import { useMockDataState } from '@/components/mockdatacontext'

// ─── Plan badge ───
// Bottom right, showing which tier the workspace is on.
//
// Only for PAID plans. A "Free" badge is a permanent reminder of what someone
// hasn't bought — it turns a status marker into an advert, and it's on every
// screen. Free users already get the usage banner on the links page, which is
// the same information at the moment it's actually useful.
//
// Bottom RIGHT because the dev controls own bottom left.
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
        position: 'fixed',
        right: '20px',
        bottom: '20px',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px 6px 8px',
        borderRadius: 'var(--radius-full)',
        background: 'var(--bg-default)',
        border: '1px solid var(--stroke-soft)',
        // The same raised plate as the status tags, so it reads as part of the
        // app rather than an overlay pinned on top of it.
        boxShadow: '0 2px 8px rgba(54, 54, 54, 0.08)',
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
      <PlanIcon planId={planId} size={18} />
      {/* plan.name is already "Starter" and "Pro" — only FREE carries the
          "Free plan" wording, and that never reaches here. */}
      {plan.name}
    </button>
  )
}
