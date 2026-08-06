'use client'

import { useEffect, useState } from 'react'
import Lightbox from '@/components/lightbox'
import {
  PLANS,
  PLAN_ORDER,
  PLAN_FEATURES,
  planFor,
  usageLabel,
} from '@/lib/plans'
import { toast } from '@/components/toast'

// ─── PlanCard ───
// Node 106:832.
//
// Every column is generated from src/lib/plans.js rather than written out per
// tier. That's the whole point: the API enforces limits from that same file,
// so the table physically cannot advertise something the endpoint refuses.
// Hand-writing three columns is how a pricing page ends up promising 50 links
// while the server allows 5.

function CheckIcon() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M3.4 8.4 6.3 11.3 12.6 5'
        stroke='var(--text-sub)'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function DashIcon() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden='true'
    >
      {/* A dash rather than a cross. These aren't errors — they're capabilities
          this tier doesn't include, and a red X reads as something being
          wrong. */}
      <path
        d='M4.5 8h7'
        stroke='var(--text-disabled)'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
    </svg>
  )
}

function BillingToggle({ annual, onChange }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '2px',
        alignItems: 'flex-start',
        padding: '3px',
        borderRadius: '9px',
        background: 'var(--bg-surface)',
        flexShrink: 0,
      }}
    >
      {[
        { id: false, label: 'Monthly' },
        { id: true, label: 'Annually (save 20%)' },
      ].map((opt) => (
        <button
          key={opt.label}
          type='button'
          onClick={() => onChange(opt.id)}
          aria-pressed={annual === opt.id}
          className='billing-toggle-option'
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '5px 14px',
            borderRadius: '6px',
            border: 'none',
            background: annual === opt.id ? 'var(--bg-default)' : 'transparent',
            color:
              annual === opt.id ? 'var(--text-strong)' : 'var(--text-soft)',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            lineHeight: '16px',
            letterSpacing: '0.24px',
            whiteSpace: 'nowrap',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function PlanColumn({ plan, current, annual, linkCount, onUpgrade, busy }) {
  const isCurrent = plan.id === current
  // Emphasised, because Starter and Pro had identical dark buttons in the
  // design and nothing guided the choice. Pro is the tier to steer toward.
  const featured = plan.id === 'PRO' && !isCurrent

  const price = annual ? plan.priceAnnual : plan.priceMonthly
  const period = annual ? '/year' : '/month'
  const note =
    plan.priceMonthly === 0
      ? plan.priceNote
      : annual
        ? 'Billed annually'
        : 'Billed monthly'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        alignItems: 'flex-start',
        justifyContent: 'center',
        width: '230px',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <p
          className='label-sm'
          style={{ color: 'var(--text-strong)', margin: 0 }}
        >
          {plan.name}
        </p>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-sans)',
            fontSize: '10px',
            lineHeight: 1.35,
            letterSpacing: '0.2px',
            color: 'var(--text-soft)',
          }}
        >
          {plan.tagline}
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end' }}>
            <p
              className='label-lg'
              style={{ color: 'var(--text-strong)', margin: 0 }}
            >
              ${price}
            </p>
            <p
              className='para-xs'
              style={{
                color: 'var(--text-strong)',
                margin: 0,
                paddingBottom: '3px',
              }}
            >
              {period}
            </p>
          </div>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              lineHeight: 1.35,
              letterSpacing: '0.2px',
              color: 'var(--text-soft)',
            }}
          >
            {note}
          </p>
        </div>

        {isCurrent ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 16px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-layer)',
                color: 'var(--text-strong)',
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                lineHeight: '16px',
                letterSpacing: '0.24px',
              }}
            >
              Current plan
            </div>
            {/* Usage against the limit, which is the thing that actually
                prompts an upgrade — "Current plan" alone tells you nothing
                about whether you're near the ceiling. Omitted on unlimited
                tiers, where there's no fraction to show. */}
            {usageLabel(plan.id, linkCount) ? (
              <p
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-sans)',
                  fontSize: '10px',
                  lineHeight: 1.35,
                  letterSpacing: '0.2px',
                  color:
                    plan.maxLinks !== null && linkCount >= plan.maxLinks
                      ? 'var(--error-base)'
                      : 'var(--text-soft)',
                }}
              >
                {usageLabel(plan.id, linkCount)}
              </p>
            ) : null}
          </div>
        ) : (
          <button
            type='button'
            onClick={() => onUpgrade(plan)}
            disabled={busy}
            className='plan-cta'
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 16px',
              borderRadius: 'var(--radius-lg)',
              border: featured ? 'none' : '1px solid var(--stroke-soft)',
              background: featured ? 'var(--bg-weak)' : 'var(--bg-default)',
              color: featured ? 'var(--text-inverse)' : 'var(--text-strong)',
              cursor: busy ? 'default' : 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              lineHeight: '16px',
              letterSpacing: '0.24px',
              whiteSpace: 'nowrap',
            }}
          >
            {plan.priceMonthly === 0 ? 'Downgrade' : 'Upgrade plan'}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {PLAN_FEATURES.map((f, i) => {
          const included = f.included(plan)
          return (
            <div
              key={i}
              style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
            >
              {included ? <CheckIcon /> : <DashIcon />}
              <span
                className='para-xs'
                style={{
                  color: included ? 'var(--text-sub)' : 'var(--text-disabled)',
                  whiteSpace: 'nowrap',
                }}
              >
                {f.label(plan)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function PlanCard({ open, onClose }) {
  const [data, setData] = useState(null)
  const [annual, setAnnual] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    fetch('/api/plan')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) setData(d)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [open])

  const current = data?.plan || 'FREE'

  function handleUpgrade(plan) {
    // TODO: needs a payment provider. Stopping here rather than switching the
    // plan: an upgrade button that grants a paid tier without taking payment
    // is the one thing in this flow that must not silently work.
    setBusy(true)
    toast('Checkout is not connected yet')
    setTimeout(() => setBusy(false), 400)
  }

  return (
    <Lightbox open={open} onClose={onClose} labelledBy='plan-card-title'>
      {({ entered }) => (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '28px',
            alignItems: 'flex-start',
            padding: '24px',
            borderRadius: '26px',
            background: 'var(--bg-default)',
            // Its own edge and shadow: the scrim is white, so without these
            // the card has no boundary at all.
            border: '1px solid var(--stroke-soft)',
            boxShadow: '0px 10px 20px 3px rgba(0, 0, 0, 0.06)',
            maxWidth: '100%',
            opacity: entered ? 1 : 0,
            transform: entered
              ? 'translateY(0) scale(1)'
              : 'translateY(8px) scale(0.985)',
            transition:
              'opacity var(--duration-modal) var(--ease-out), transform var(--duration-modal) var(--ease-out)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              width: '100%',
            }}
          >
            <p
              id='plan-card-title'
              className='label-lg'
              style={{ color: 'var(--text-strong)', margin: 0 }}
            >
              Plans
            </p>
            {/* Reworded from the design, which said only the link count
                changes — the table also gates CSV export, custom slugs and a
                custom domain, so the original copy contradicted the columns
                directly underneath it. */}
            <p
              className='para-xs'
              style={{ color: 'var(--text-sub)', margin: 0, maxWidth: '414px' }}
            >
              Every plan gets full analytics and a QR code with every link. Paid
              plans add more links, exports and your own domain.
            </p>
          </div>

          <BillingToggle annual={annual} onChange={setAnnual} />

          <div
            className='plan-columns'
            style={{ display: 'flex', gap: '32px' }}
          >
            {PLAN_ORDER.map((id) => (
              <PlanColumn
                key={id}
                plan={planFor(id)}
                current={current}
                annual={annual}
                linkCount={data?.linkCount ?? 0}
                onUpgrade={handleUpgrade}
                busy={busy}
              />
            ))}
          </div>

          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              lineHeight: 1.35,
              letterSpacing: '0.2px',
              color: 'var(--text-soft)',
            }}
          >
            Prices in USD. Cancel anytime, no long-term contracts.
          </p>
        </div>
      )}
    </Lightbox>
  )
}
