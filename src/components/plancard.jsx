'use client'

import { useEffect, useState } from 'react'
import Lightbox from '@/components/lightbox'
import PlanPicker from '@/components/planpicker'
import { toast } from '@/components/toast'
import { useMockDataState } from '@/components/mockdatacontext'

// ─── Upgrade plan overlay ───
// The pricing table in a lightbox, opened from the profile menu.
//
// Rebuilt around the shared PlanPicker rather than keeping its own copy. There
// were two implementations of the same table and they had drifted: this one
// tested `priceMonthly === 0` to decide "Downgrade", which mislabels Starter for
// a Pro user, and its CTA styling, plan icons and check marks were all set
// separately from the billing page's. Whatever's fixed in one now lands in both.
//
// What stays here is what's genuinely the overlay's: the lightbox shell, the
// card's own edge and entrance, the title, and where the plan comes from.
export default function PlanCard({ open, onClose }) {
  const { useMockData, mockPlan, ready: mockReady } = useMockDataState()
  const [data, setData] = useState(null)
  const [busyPlan, setBusyPlan] = useState(null)

  useEffect(() => {
    if (!open || !mockReady) return
    let cancelled = false

    // This had no mock branch before, so it always fetched the REAL plan —
    // switching the mock tier changed the billing page and left this overlay
    // insisting you were on Free.
    if (useMockData) {
      setData({
        plan: mockPlan,
        linkCount: mockPlan === 'PRO' ? 138 : mockPlan === 'STARTER' ? 42 : 4,
      })
      return
    }

    fetch('/api/plan')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) setData(d)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [open, mockReady, useMockData, mockPlan])

  const current = data?.plan || 'FREE'

  function handleChoose(planId) {
    // Stops here rather than switching the plan: an upgrade button that grants
    // a paid tier without taking payment is the one thing in this flow that
    // must not silently work.
    setBusyPlan(planId)
    toast(
      useMockData
        ? 'Mock data is on — nothing is charged'
        : 'Checkout is not connected yet'
    )
    setTimeout(() => setBusyPlan(null), 400)
  }

  return (
    <Lightbox open={open} onClose={onClose} labelledBy='plan-card-title'>
      {({ entered, exitMs }) => (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            alignItems: 'flex-start',
            padding: '24px',
            borderRadius: '26px',
            background: 'var(--bg-default)',
            // Its own edge and shadow: the scrim is light, so without these the
            // card has no boundary at all.
            border: '1px solid var(--stroke-soft)',
            boxShadow: '0px 10px 20px 3px rgba(0, 0, 0, 0.06)',
            maxWidth: '100%',
            // The table is 754px wide, so the card is sized to hold it rather
            // than letting it overflow into the scrim.
            overflowX: 'auto',
            opacity: entered ? 1 : 0,
            transform: entered
              ? 'translateY(0) scale(1)'
              : 'translateY(8px) scale(0.985)',
            // Asymmetric, matching the shell: slower in, quicker out.
            transition: entered
              ? 'opacity var(--duration-modal) var(--ease-out), transform var(--duration-modal) var(--ease-out)'
              : `opacity ${exitMs}ms var(--ease-exit), transform ${exitMs}ms var(--ease-exit)`,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              width: '100%',
            }}
          >
            <p
              id='plan-card-title'
              className='label-lg'
              style={{ color: 'var(--text-strong)', margin: 0 }}
            >
              Choose your plan
            </p>
            <p
              className='para-xs'
              style={{ color: 'var(--text-sub)', margin: 0 }}
            >
              Every plan gets full analytics and a QR code with every link. The
              only thing that changes is how many links you need.
            </p>
          </div>

          {/* No onBack: the lightbox already closes on escape, on the scrim, and
              on its own button — a fourth way out is one too many.

              showIntro false because the title above already says it; the
              billing page has no title, which is why the picker carries one. */}
          <PlanPicker
            currentPlan={current}
            onChoose={handleChoose}
            busyPlan={busyPlan}
            showIntro={false}
          />
        </div>
      )}
    </Lightbox>
  )
}
