'use client'

import { useState } from 'react'
import { PLANS, PLAN_FEATURES, PLAN_ORDER } from '@/lib/plans'
import SegmentedTabs from '@/components/segmentedtabs'
import AnimatedNumber from '@/components/animatednumber'
import BackButton from '@/components/backbutton'
import PlanIcon from '@/components/planicons'

// ─── Plan picker ───
// The three-column pricing table, used by BOTH the billing page and the upgrade
// overlay.
//
// Extracted rather than kept in two places. There were two implementations of
// the same table and they had already drifted: the overlay tested
// priceMonthly === 0 to decide "Downgrade", which mislabels Starter for a Pro
// user, and its CTA styling, icons and check marks were all set separately. One
// component means a fix lands in both.
//
// `onBack` is optional — the billing page shows it as a step and needs a way
// out; the overlay has its own close.

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

export default function PlanPicker({
  currentPlan,
  onBack,
  onChoose,
  busyPlan,
  // Column width. 230 suits the settings panel it was built for; the landing
  // page passes a wider value so three columns fill a 1000px page instead of
  // leaving 246px empty.
  //
  // A prop rather than a CSS transform: transforms don't affect layout, so a
  // scaled picker would either clip at the bottom or overlap the section
  // below, depending on which hack papered over it.
  columnWidth = 230,
  // Multiplies every size in the picker — type, icons and the gaps between
  // them. The settings panel uses 1; the landing page uses 1.2 so the plans
  // read at the same weight as the rest of the site rather than as fine print.
  //
  // A prop rather than CSS zoom: zoom is a non-standard property with its own
  // rounding quirks, and it scales the shadows and borders too, which start
  // looking heavy well before the type looks right.
  scale = 1,
  // The lead-in above the table. The overlay has its own title, so it passes
  // false rather than repeating the sentence under one.
  showIntro = true,
}) {
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
        {/* Only where there's somewhere to go back TO. The billing page shows
            this as a step and needs a way out; the overlay has its own close, so
            a second dismissal would be one too many. */}
        {onBack ? <BackButton onBack={onBack} /> : null}
        {showIntro ? (
          <p
            className='para-xs'
            style={{ color: 'var(--text-sub)', margin: 0 }}
          >
            Every plan gets full analytics and a QR code with every link. The
            only thing that changes is how many links you need.
          </p>
        ) : null}
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

      {/* Always one horizontal row. Comparing plans works when they're side by
          side; a stacked column is a list you scroll rather than a comparison
          you read.

          The old .plan-columns is gone — it stacked below 900px, and the two
          surfaces using this had drifted onto different rules. */}
      {/* ALWAYS a row. The layout is INLINE, not in a class, so a stale or
              missing stylesheet cannot turn this into a column — that has now
              broken twice, once from a class-name collision and once from CSS
              that shipped a turn late.

              The class carries ONLY the mobile override, which has to be a media
              query and so can't be inline. If that rule ever goes missing the
              failure is 'doesn't stack on a phone', not 'stacked everywhere',
              which is the right direction to fail in. */}
      <div
        className='plan-picker-columns'
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          gap: '32px',
          alignItems: 'flex-start',
          // Takes the width it needs and overflows its container rather
          // than squeezing three columns into the panel's ~494px.
          width: 'max-content',
        }}
      >
        {Object.values(PLANS).map((plan) => {
          const isCurrent = plan.id === currentPlan
          // Same rule as the PlanCard: Pro is the featured tier unless you're
          // already on it.
          // Negative means this tier sits below the current one.
          const direction =
            PLAN_ORDER.indexOf(plan.id) - PLAN_ORDER.indexOf(currentPlan)
          // Pro is featured only when it's actually a step UP. Highlighting it
          // for someone already on Pro would be selling them what they have.
          const featured = plan.id === 'PRO' && direction > 0
          const price = annual ? plan.priceAnnual : plan.priceMonthly
          const busy = busyPlan === plan.id

          return (
            <div
              key={plan.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                // 16px, down from 20 — the icon adds a row, and the original
                // rhythm left the column reading as five loose blocks.
                gap: '16px',
                width: `${columnWidth}px`,
                flexShrink: 0,
              }}
            >
              {/* The same plant, so the tier you're reading about in the picker
                  and the one shown on the page above are marked the same way. */}
              <PlanIcon planId={plan.id} size={Math.round(28 * scale)} />

              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}
              >
                <p
                  style={{
                    color: 'var(--text-strong)',
                    margin: 0,
                    fontFamily: 'var(--font-sans)',
                    fontSize: `${14 * scale}px`,
                    fontWeight: 500,
                    lineHeight: 1.4,
                    letterSpacing: `${0.28 * scale}px`,
                  }}
                >
                  {plan.id === 'FREE' ? 'Free' : plan.name}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-sans)',
                    fontSize: `${10 * scale}px`,
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
                      style={{
                        color: 'var(--text-strong)',
                        margin: 0,
                        fontFamily: 'var(--font-sans)',
                        fontSize: `${18 * scale}px`,
                        fontWeight: 500,
                        lineHeight: 1.4,
                        letterSpacing: `${0.36 * scale}px`,
                      }}
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
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: `${12 * scale}px`,
                        lineHeight: `${16 * scale}px`,
                        letterSpacing: `${0.24 * scale}px`,
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
                      fontSize: `${10 * scale}px`,
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
                    borderRadius: 'var(--radius-full)',
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
                    // A downgrade reads muted. It's available, but styling it
                    // as invitingly as an upgrade puts the two moves on equal
                    // footing, and one of them costs you features.
                    color: featured
                      ? 'var(--text-inverse)'
                      : direction < 0
                        ? 'var(--text-sub)'
                        : 'var(--text-strong)',
                  }}
                >
                  {/* Compared against PLAN_ORDER rather than named tiers. Every
                      label was an upgrade before, so a Pro user looking at Free
                      read "Upgrade plan" for the tier BELOW them — which is
                      both wrong and the kind of wrong that makes someone
                      distrust the rest of the page. */}
                  {isCurrent
                    ? 'Current plan'
                    : // No current plan means a visitor rather than a customer
                      // — the landing page passes null. Free is where they'd
                      // begin, so it says so; "Upgrade plan" on the free tier
                      // is an offer to pay for what costs nothing.
                      !currentPlan && plan.id === 'FREE'
                      ? 'Get started'
                      : busy
                        ? 'Opening…'
                        : direction < 0
                          ? 'Downgrade plan'
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
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: `${12 * scale}px`,
                          lineHeight: `${16 * scale}px`,
                          letterSpacing: `${0.24 * scale}px`,
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
          fontSize: `${10 * scale}px`,
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
