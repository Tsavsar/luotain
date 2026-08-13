'use client'

import { useEffect, useState } from 'react'
import { PLANS, PLAN_FEATURES } from '@/lib/plans'
import SegmentedTabs from '@/components/segmentedtabs'
import BackButton from '@/components/backbutton'
import AnimatedNumber from '@/components/animatednumber'
import { toast } from '@/components/toast'
import { useMockDataState } from '@/components/mockdatacontext'
import { getMockBilling } from '@/lib/mockAnalytics'

// ─── Organisation → Billing ───
// Nodes 87:6798 (free), 106:1405 (paid) and 106:615 (the plan picker).
//
// One page, three states. The picker is a view of this page rather than a
// separate route, so Back returns you here without a navigation.

function PlanBadge({ planId }) {
  // A ring in the plan's own weight — Free hollow, paid filled. Cheaper than an
  // icon set and it reads as a tier at a glance.
  const filled = planId !== 'FREE'
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: 'var(--radius-full)',
        background: filled ? 'var(--text-strong)' : 'var(--bg-surface)',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: '12px',
          height: '12px',
          borderRadius: 'var(--radius-full)',
          border: `2px solid ${filled ? 'var(--bg-default)' : 'var(--text-soft)'}`,
          background: planId === 'PRO' ? 'var(--bg-default)' : 'transparent',
        }}
      />
    </span>
  )
}

// The same marks as the PlanCard overlay, so a plan read here and a plan read
// there look like the same thing. Orange check for included; a DASH rather than
// a cross for excluded — these aren't errors, they're capabilities the tier
// doesn't have, and an X reads as something being wrong.
function CheckIcon({ on }) {
  if (!on) {
    return (
      <svg
        width='16'
        height='16'
        viewBox='0 0 16 16'
        fill='none'
        aria-hidden='true'
      >
        <path
          d='M4.5 8h7'
          stroke='var(--text-disabled)'
          strokeWidth='1.5'
          strokeLinecap='round'
        />
      </svg>
    )
  }
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
        stroke='var(--primary-base)'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

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

function CardMark({ brand }) {
  // A coloured chip rather than the real brand marks. Visa and Mastercard logos
  // are trademarks with usage rules, and a two-letter chip carries the same
  // information without shipping someone else's asset.
  const label = (brand || 'Card').slice(0, 4)
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '29px',
        height: '20px',
        borderRadius: '4px',
        background: 'var(--text-strong)',
        color: 'var(--bg-default)',
        fontFamily: 'var(--font-sans)',
        fontSize: '8px',
        letterSpacing: '0.3px',
        textTransform: 'uppercase',
        flexShrink: 0,
      }}
    >
      {label}
    </span>
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
function PlanPicker({ currentPlan, onBack, onChoose, busyPlan }) {
  const [annual, setAnnual] = useState(false)

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
          gap: '10px',
          width: '100%',
        }}
      >
        {/* The shared BackButton, which already carries this exact icon plus
            its label and hover. onBack overrides the navigation, which is what
            a step inside a page needs — this shouldn't leave the route. */}
        <BackButton onBack={onBack} />
        <p className='para-xs' style={{ color: 'var(--text-sub)', margin: 0 }}>
          Every plan gets full analytics and a QR code with every link. The only
          thing that changes is how many links you need.
        </p>
      </div>

      <SegmentedTabs
        items={[
          { id: 'monthly', label: 'Monthly' },
          {
            id: 'annual',
            // The discount in orange, matching the PlanCard overlay — the reason
            // to switch is the thing worth seeing first.
            label: (
              <>
                Annually
                <span
                  style={{ color: 'var(--primary-base)', marginLeft: '5px' }}
                >
                  save 20%
                </span>
              </>
            ),
          },
        ]}
        activeId={annual ? 'annual' : 'monthly'}
        onChange={(id) => setAnnual(id === 'annual')}
        padX='14px'
      />

      {/* Its own class, NOT .plan-columns — that one belongs to the PlanCard
          overlay and stacks below 900px, which this page was silently
          inheriting. Two components sharing a class name is how one gets a rule
          written for the other.

          Always one horizontal row, overflowing the settings panel to the
          right. Comparing plans works when they're side by side; a stacked
          column is a list you scroll rather than a comparison you read. */}
      <div className='billing-plan-columns'>
        {Object.values(PLANS).map((plan) => {
          const isCurrent = plan.id === currentPlan
          // Same rule as the PlanCard: Pro is the featured tier unless you're
          // already on it.
          const featured = plan.id === 'PRO' && !isCurrent
          const price = annual ? plan.priceAnnual : plan.priceMonthly
          const busy = busyPlan === plan.id

          return (
            <div
              key={plan.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                width: '230px',
                flexShrink: 0,
              }}
            >
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}
              >
                <p
                  className='label-sm'
                  style={{ color: 'var(--text-strong)', margin: 0 }}
                >
                  {plan.id === 'FREE' ? 'Free' : plan.name}
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
                  {plan.tagline}
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: '2px',
                      alignItems: 'flex-end',
                    }}
                  >
                    <p
                      className='label-lg'
                      style={{ color: 'var(--text-strong)', margin: 0 }}
                    >
                      {/* Only the number rolls — AnimatedNumber animates every
                          character it's given, so the $ and /month would tumble
                          with it. */}
                      $
                      {
                        <AnimatedNumber
                          value={annual ? Math.round(price / 12) : price}
                        />
                      }
                    </p>
                    <p
                      className='para-xs'
                      style={{
                        color: 'var(--text-sub)',
                        margin: 0,
                        paddingBottom: '3px',
                      }}
                    >
                      /month
                    </p>
                  </div>
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
                    {plan.id === 'FREE'
                      ? plan.priceNote
                      : annual
                        ? `$${price} billed yearly`
                        : 'Billed monthly'}
                  </p>
                </div>

                <button
                  type='button'
                  onClick={() => !isCurrent && onChoose(plan.id, annual)}
                  disabled={isCurrent || busy}
                  className={isCurrent ? 'create-secondary' : 'plan-cta'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-lg)',
                    cursor: isCurrent || busy ? 'default' : 'pointer',
                    // Fills the column. Sized to its label instead, the three
                    // CTAs came out at three different widths — "Current plan",
                    // "Upgrade plan" and "Get pro plan" are all different
                    // lengths — which read as three unrelated buttons rather
                    // than one choice made three ways.
                    width: '100%',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '12px',
                    lineHeight: '16px',
                    letterSpacing: '0.24px',
                    // The PlanCard's treatment: only the FEATURED plan is
                    // filled dark, the rest are outlined. Three dark buttons in
                    // a row give every tier the same weight, which is the one
                    // thing a pricing table shouldn't do.
                    border: featured ? 'none' : '1px solid var(--stroke-soft)',
                    background: featured
                      ? 'var(--bg-weak)'
                      : isCurrent
                        ? 'var(--bg-layer)'
                        : 'var(--bg-default)',
                    color: featured
                      ? 'var(--text-inverse)'
                      : 'var(--text-strong)',
                  }}
                >
                  {isCurrent
                    ? 'Current plan'
                    : busy
                      ? 'Opening…'
                      : plan.id === 'PRO'
                        ? 'Get pro plan'
                        : 'Upgrade plan'}
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {/* label and included are FUNCTIONS taking the plan, not a
                    lookup map — so "5 links" and "Unlimited links" are the same
                    row rendered per tier, and the list can't drift from what
                    the API enforces. */}
                {PLAN_FEATURES.map((f, i) => {
                  const label = f.label(plan)
                  const on = f.included(plan)
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'center',
                      }}
                    >
                      {/* No colour here — the mark sets its own, orange when
                          included. Tinting the wrapper would override it. */}
                      <span style={{ display: 'flex', flexShrink: 0 }}>
                        <CheckIcon on={on} />
                      </span>
                      <p
                        className='para-xs'
                        style={{
                          margin: 0,
                          color: on
                            ? 'var(--text-sub)'
                            : 'var(--text-disabled)',
                        }}
                      >
                        {label}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

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
        Prices in USD. Cancel anytime, no long-term contracts.
      </p>
    </div>
  )
}

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
          <PlanBadge planId={data.plan.id} />

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
                borderRadius: 'var(--radius-lg)',
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
                <span
                  style={{
                    display: 'flex',
                    gap: '6px',
                    alignItems: 'center',
                    padding: '6px 9px 6px 7px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-default)',
                    border: '1px solid var(--stroke-soft)',
                    boxShadow: '0 2px 2px rgba(54, 54, 54, 0.04)',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: 'var(--radius-full)',
                      background:
                        inv.status === 'paid'
                          ? 'var(--success-base)'
                          : 'var(--error-base)',
                    }}
                  />
                  <span
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '10px',
                      lineHeight: 1,
                      letterSpacing: '0.2px',
                      color: 'var(--text-sub)',
                      textTransform: 'capitalize',
                    }}
                  >
                    {inv.status}
                  </span>
                </span>
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
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
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
