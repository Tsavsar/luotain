'use client'

import { useEffect, useState } from 'react'
import PlanPicker from '@/components/planpicker'
import { toast } from '@/components/toast'
import PlanIcon from '@/components/planicons'
import CardMark from '@/components/cardmarks'
import Tag from '@/components/tag'
import { useMockDataState } from '@/components/mockdatacontext'
import { getMockBilling } from '@/lib/mockAnalytics'

// ─── Organisation → Billing ───
// Nodes 87:6798 (free), 106:1405 (paid) and 106:615 (the plan picker).
//
// One page, three states. The picker is a view of this page rather than a
// separate route, so Back returns you here without a navigation.

function ArrowIcon() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M6 4l4 4-4 4'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

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

function SectionLabel({ children }) {
  return (
    <p
      className='para-xs'
      style={{ color: 'var(--text-soft)', margin: 0, width: '100%' }}
    >
      {children}
    </p>
  )
}

// A text link with a trailing arrow — Add payment method, Update, View.
function ActionLink({ children, onClick, disabled }) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      className='billing-action'
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'var(--font-sans)',
        fontSize: '12px',
        lineHeight: '16px',
        letterSpacing: '0.24px',
        color: 'var(--text-sub)',
      }}
    >
      {children}
      <ArrowIcon />
    </button>
  )
}

function formatDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ─── The plan picker ───
export default function BillingPage() {
  const { useMockData, mockPlan, ready: mockReady } = useMockDataState()
  const [data, setData] = useState(null)
  const [picking, setPicking] = useState(false)
  const [busyPlan, setBusyPlan] = useState(null)

  useEffect(() => {
    // Waits for the saved mock preference, or a reload with mock on fetches the
    // real endpoint once and throws the result away.
    if (!mockReady) return
    let cancelled = false

    if (useMockData) {
      // This page had NO mock branch, so it hit the real endpoint even with
      // mock data on — which meant the paid states could never be seen, since a
      // live workspace has no card and no invoices.
      setData(getMockBilling(mockPlan))
      return
    }

    setData(null)
    fetch('/api/org/billing')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => !cancelled && d && setData(d))
      .catch((err) => console.error('[Billing]', err))
    return () => {
      cancelled = true
    }
  }, [mockReady, useMockData, mockPlan])

  function notConnected() {
    if (useMockData) {
      toast('Mock data is on — nothing is charged')
      return
    }
    // Says what's actually true rather than failing silently. Checkout is the
    // one thing on this page that can't work until a provider is wired up.
    toast('Checkout is not connected yet')
  }

  function handleChoose(planId) {
    setBusyPlan(planId)
    notConnected()
    setBusyPlan(null)
  }

  if (!data) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          width: '100%',
        }}
      >
        <div
          className='skeleton-pulse'
          style={{
            width: '56px',
            height: '20px',
            borderRadius: '4px',
            background: 'var(--bg-surface)',
          }}
        />
        <div
          className='skeleton-pulse'
          style={{
            width: '100%',
            height: '48px',
            borderRadius: '12px',
            background: 'var(--bg-surface)',
          }}
        />
        <div
          className='skeleton-pulse'
          style={{
            width: '100%',
            height: '32px',
            borderRadius: '10px',
            background: 'var(--bg-surface)',
          }}
        />
      </div>
    )
  }

  if (picking) {
    return (
      <PlanPicker
        currentPlan={data.plan.id}
        onBack={() => setPicking(false)}
        onChoose={handleChoose}
        busyPlan={busyPlan}
      />
    )
  }

  const isFree = data.plan.id === 'FREE'
  const canManage = data.role === 'OWNER'
  const atLimit =
    data.plan.maxLinks != null && data.linkCount >= data.plan.maxLinks

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '30px',
        alignItems: 'flex-start',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          width: '100%',
        }}
      >
        <p
          className='label-sm'
          style={{ color: 'var(--text-strong)', margin: 0 }}
        >
          Billing
        </p>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {/* The plant marks the tier: a sprout on Free, a bud on Starter, a
              branched plant on Pro. It replaced a ring badge that distinguished
              the tiers only by fill, which is a distinction nobody reads. */}
          <PlanIcon planId={data.plan.id} size={32} />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              flex: '1 0 0',
              minWidth: 0,
            }}
          >
            <p
              className='para-xs'
              style={{ color: 'var(--text-strong)', margin: 0 }}
            >
              {isFree ? 'Free plan' : `${data.plan.name} plan`}
            </p>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-sans)',
                fontSize: '10px',
                lineHeight: 1.4,
                letterSpacing: '0.2px',
                color: 'var(--text-soft)',
              }}
            >
              {/* Three different sentences, because cancelled-but-active is a
                  real state and reading "auto renews" while it's winding down
                  would be actively wrong. */}
              {isFree
                ? 'Upgrade now to unlock more features!'
                : data.cancelAtPeriodEnd
                  ? `Your plan ends on ${formatDate(data.periodEnd)}.`
                  : data.periodEnd
                    ? `Your subscription will auto renew on ${formatDate(data.periodEnd)}.`
                    : 'Subscription active.'}
            </p>
          </div>

          {canManage ? (
            <button
              type='button'
              onClick={() => setPicking(true)}
              className='plan-cta'
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                cursor: 'pointer',
                flexShrink: 0,
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                lineHeight: '16px',
                letterSpacing: '0.24px',
                background: 'var(--bg-weak)',
                color: 'var(--text-inverse)',
              }}
            >
              {/* "Change plan" on Pro, since there's nowhere up from there and
                  the only move is sideways or down. */}
              {data.plan.id === 'PRO' ? 'Change plan' : 'Upgrade plan'}
            </button>
          ) : null}
        </div>

        {/* Only while there's a limit to be near. Pro is unlimited, so a usage
            line there would be a bar that can never fill. */}
        {data.plan.maxLinks != null ? (
          <div
            style={{
              display: 'flex',
              gap: '4px',
              alignItems: 'center',
              padding: '6px',
              borderRadius: '10px',
              background: atLimit ? 'var(--error-mute)' : 'var(--bg-surface)',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <span
              style={{
                display: 'flex',
                flexShrink: 0,
                color: atLimit ? 'var(--error-base)' : 'var(--text-sub)',
              }}
            >
              <InfoIcon />
            </span>
            <p
              className='para-xs'
              style={{
                margin: 0,
                color: atLimit ? 'var(--error-base)' : 'var(--text-sub)',
              }}
            >
              {/* One sentence at every count, so it reads 1 of 5, then 4 of 5,
                  then 5 of 5. It used to swap to "You've used all 5 of your
                  links" at the limit, which meant the count never actually
                  reached 5 out of 5 — the number you most want to see was the
                  one wording that replaced it. Colour carries the urgency
                  instead. */}
              You have used {data.linkCount} out of your {data.plan.maxLinks}{' '}
              {isFree ? 'free ' : ''}links
            </p>
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '100%',
        }}
      >
        <SectionLabel>Payment</SectionLabel>
        <div
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {data.card ? (
            <>
              <CardMark brand={data.card.brand} />
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  flex: '1 0 0',
                  minWidth: 0,
                }}
              >
                <p
                  className='para-xs'
                  style={{ color: 'var(--text-strong)', margin: 0 }}
                >
                  {data.card.brand}
                </p>
                <p
                  className='para-xs'
                  style={{ color: 'var(--text-strong)', margin: 0 }}
                >
                  • • • • {data.card.last4}
                </p>
              </div>
            </>
          ) : (
            <p
              className='para-xs'
              style={{ color: 'var(--text-sub)', margin: 0, flex: '1 0 0' }}
            >
              No payment method added
            </p>
          )}

          {canManage ? (
            <ActionLink onClick={notConnected}>
              {data.card ? 'Update' : 'Add payment method'}
            </ActionLink>
          ) : null}
        </div>
      </div>

      {/* Only once there are invoices. An empty "Invoices" heading on a Free
          workspace is a section that exists to say nothing. */}
      {data.invoices.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            width: '100%',
          }}
        >
          <SectionLabel>Invoices</SectionLabel>
          {data.invoices.map((inv) => (
            <div
              key={inv.id}
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <p
                className='para-xs'
                style={{
                  color: 'var(--text-strong)',
                  margin: 0,
                  flex: '1 0 0',
                }}
              >
                {formatDate(inv.date)}
              </p>
              <p
                className='para-xs'
                style={{
                  color: 'var(--text-strong)',
                  margin: 0,
                  flex: '1 0 0',
                }}
              >
                US${inv.amount}
              </p>
              <div style={{ flex: '1 0 0', display: 'flex' }}>
                {/* The shared Tag now — this markup was the original, and
                    domains needed the identical thing. */}
                <Tag
                  tone={inv.status === 'paid' ? 'success' : 'error'}
                  label={inv.status}
                />
              </div>
              <div
                style={{
                  flex: '1 0 0',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <ActionLink onClick={notConnected}>View</ActionLink>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Cancel only when there's something to cancel, and only for the owner. */}
      {!isFree && canManage && !data.cancelAtPeriodEnd ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                fontWeight: 500,
                lineHeight: '16px',
                letterSpacing: '0.24px',
                color: 'var(--text-strong)',
              }}
            >
              Cancel plan
            </p>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-sans)',
                fontSize: '10px',
                lineHeight: 1.5,
                letterSpacing: '0.2px',
                color: 'var(--text-soft)',
              }}
            >
              You&rsquo;ll keep full {data.plan.name} access until your current
              period ends
              {data.periodEnd ? ` on ${formatDate(data.periodEnd)}` : ''}. After
              that, this workspace moves to Free.
            </p>
          </div>
          <button
            type='button'
            onClick={notConnected}
            className='session-signout'
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              cursor: 'pointer',
              // 100px, not full width. Stretching a destructive action across
              // the page makes it the biggest target there, which is the
              // opposite of the emphasis it wants.
              width: '100px',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              lineHeight: '16px',
              letterSpacing: '0.24px',
              background: 'var(--error-mute)',
              color: 'var(--error-base)',
            }}
          >
            Cancel plan
          </button>
        </div>
      ) : null}
    </div>
  )
}
