'use client'

import Link from 'next/link'
import { useState } from 'react'
import LogoMark from '@/components/logomark'
import { PLANS, PLAN_FEATURES } from '@/lib/plans'
import Reveal from '@/components/reveal'

// ─── Landing page ───
// Node 554:2445. One 800px column, centred, on white.
//
// The pricing table is driven by PLANS rather than transcribed from the design.
// The design's table is already stale in two places — it shows custom slugs as
// paid and custom domains as Pro-only, both of which changed — and a marketing
// page that contradicts the product is worse than one that's plain.

// ─── Assets ───
// Figma's asset URLs expire after seven days, so the halftone has to be
// downloaded into /public before this goes live. Referenced from there, not
// from Figma.
const HALFTONE = '/landing/halftone.png'

const COLUMN = 800

function Nav() {
  return (
    <nav
      className='landing-nav'
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: `${COLUMN}px`,
        margin: '0 auto',
        padding: '54px 20px 0',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <LogoMark size={21} />
        <span
          aria-hidden='true'
          style={{
            width: '1.5px',
            height: '20px',
            borderRadius: '19px',
            background: 'var(--bg-surface)',
          }}
        />
        <div style={{ display: 'flex', gap: '31px', alignItems: 'center' }}>
          {[
            ['Home', '#top'],
            ['Features', '#features'],
            ['Use cases', '#use-cases'],
            ['Price', '#plans'],
          ].map(([label, href]) => (
            <a
              key={label}
              href={href}
              className='landing-nav-link'
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                lineHeight: '16px',
                letterSpacing: '0.24px',
                color: 'var(--text-strong)',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <Pill href='/login' tone='soft'>
          Demo
        </Pill>
        <Pill href='/get-started' tone='dark'>
          Get started
        </Pill>
      </div>
    </nav>
  )
}

// The two button shapes used across the page. One component rather than the
// same padding and radius repeated at six call sites.
function Pill({ href, tone = 'dark', children }) {
  const dark = tone === 'dark'
  return (
    <Link
      href={href}
      className='landing-pill'
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 20px',
        borderRadius: '48px',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        fontFamily: 'var(--font-sans)',
        fontSize: '12px',
        lineHeight: '16px',
        letterSpacing: '0.24px',
        background: dark ? 'var(--text-strong)' : 'var(--bg-surface)',
        color: dark ? 'var(--bg-default)' : 'var(--text-sub)',
      }}
    >
      {children}
    </Link>
  )
}

function SectionTag({ children }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 8px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-default)',
        border: '1px solid var(--stroke-soft)',
        boxShadow: '0 2px 2px rgba(54, 54, 54, 0.04)',
        fontFamily: 'var(--font-sans)',
        fontSize: '12px',
        lineHeight: '16px',
        letterSpacing: '0.24px',
        color: 'var(--text-sub)',
      }}
    >
      {children}
    </span>
  )
}

// A heading at the size the design uses for section titles. 440 weight is
// between regular and medium — Inter is variable, so it's a real weight rather
// than a rounded one.
function Heading({ size = 20, width, children }) {
  return (
    <h2
      style={{
        margin: 0,
        fontFamily: 'var(--font-sans)',
        fontWeight: 440,
        fontSize: `${size}px`,
        lineHeight: 1.1,
        letterSpacing: `${size * 0.02}px`,
        color: 'var(--text-strong)',
        maxWidth: width ? `${width}px` : undefined,
      }}
    >
      {children}
    </h2>
  )
}

function Body({ children, width, tone = 'sub' }) {
  return (
    <p
      style={{
        margin: 0,
        fontFamily: 'var(--font-sans)',
        fontSize: '12px',
        lineHeight: '16px',
        letterSpacing: '0.24px',
        color: tone === 'sub' ? 'var(--text-sub)' : 'var(--text-strong)',
        maxWidth: width ? `${width}px` : undefined,
      }}
    >
      {children}
    </p>
  )
}

// A feature or use-case card: an image well, a title, and copy.
function Card({ title, lead, body }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '21px',
        flex: '1 0 0',
        minWidth: 0,
      }}
    >
      {/* Empty in the design — a placeholder for the product shots that go
          here. Left as the surface colour rather than filled with something
          invented, so it's obvious what's still to come. */}
      <div
        style={{
          height: '230px',
          borderRadius: '8px',
          background: 'var(--bg-surface)',
          width: '100%',
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Heading size={16}>{title}</Heading>
        {lead ? (
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              lineHeight: 1.4,
              letterSpacing: '0.2px',
              color: 'var(--text-strong)',
            }}
          >
            {lead}
          </p>
        ) : null}
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-sans)',
            fontSize: '10px',
            lineHeight: 1.4,
            letterSpacing: '0.2px',
            color: 'var(--text-sub)',
          }}
        >
          {body}
        </p>
      </div>
    </div>
  )
}

// ─── Hero ───
function Hero() {
  return (
    <section
      id='top'
      className='landing-hero'
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '24px',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',
          flex: '1 0 320px',
          minWidth: 0,
          padding: '37px 0',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--font-sans)',
              fontWeight: 440,
              fontSize: '32px',
              lineHeight: 1.1,
              letterSpacing: '0.64px',
              color: 'var(--text-strong)',
              maxWidth: '341px',
            }}
          >
            No link you share goes unmeasured.
          </h1>
          <Body width={322}>
            Shorten a link, get a QR code with it, and see exactly who clicked
            from where. Clicks, scans, countries and devices, all in one place.
          </Body>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Pill href='/login' tone='soft'>
            View a demo
          </Pill>
          <Pill href='/get-started' tone='dark'>
            Get started
          </Pill>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '8px',
          background: 'var(--bg-surface)',
          width: '402px',
          maxWidth: '100%',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'relative',
            height: '343px',
            borderRadius: '8px',
            border: '2px solid var(--stroke-soft)',
            overflow: 'hidden',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <img
            src={HALFTONE}
            alt=''
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              pointerEvents: 'none',
            }}
          />
          <HeroForm />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px',
            borderRadius: '16px',
            background: 'var(--bg-surface)',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              lineHeight: 1.4,
              letterSpacing: '0.2px',
              color: 'var(--text-sub)',
              textAlign: 'center',
            }}
          >
            You get more control over your link creation when you create an
            account
          </p>
        </div>
      </div>
    </section>
  )
}

// The miniature create form sitting on the halftone. Static — it's a picture of
// the product, not a working form. A real one here would need auth, rate
// limiting and a place to put the result.
function HeroForm() {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        top: '52px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        alignItems: 'center',
        width: '240px',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '2px',
          padding: '2px',
          borderRadius: '21px',
          background: 'var(--bg-default)',
          border: '1px solid var(--stroke-soft)',
        }}
      >
        {['Short link', 'QR Code'].map((label, i) => (
          <span
            key={label}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-lg)',
              background: i === 0 ? 'var(--bg-layer)' : 'transparent',
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              lineHeight: 1,
              letterSpacing: '0.2px',
              color: 'var(--text-strong)',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '10px',
          borderRadius: '14px',
          background: 'var(--bg-default)',
          border: '1.25px solid var(--stroke-soft)',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <MiniField
          label='Destination'
          value='https://example.com/your-page'
          muted
        />
        <div style={{ display: 'flex', gap: '5px' }}>
          <div style={{ width: '60px', flexShrink: 0 }}>
            <MiniField label='Domain' value='luot.link' />
          </div>
          <div style={{ flex: '1 0 0', minWidth: 0 }}>
            <MiniField label='Slug' value='swift-otter' muted />
          </div>
        </div>
      </div>

      <span
        style={{
          padding: '5px 12px',
          borderRadius: '999px',
          background: 'var(--text-inverse)',
          fontFamily: 'var(--font-sans)',
          fontSize: '9px',
          lineHeight: '12px',
          letterSpacing: '0.17px',
          color: 'var(--bg-weak)',
          whiteSpace: 'nowrap',
        }}
      >
        Create link
      </span>
    </div>
  )
}

function MiniField({ label, value, muted }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '5px',
          fontWeight: 500,
          lineHeight: '6px',
          letterSpacing: '0.09px',
          color: 'var(--text-strong)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          display: 'block',
          padding: '6px 5px 6px 6px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-default)',
          border: '0.6px solid var(--stroke-soft)',
          boxShadow: '0 1.25px 2.5px rgba(54, 54, 54, 0.04)',
          fontFamily: 'var(--font-sans)',
          fontSize: '5.5px',
          lineHeight: '8px',
          letterSpacing: '0.11px',
          color: muted ? 'var(--text-soft)' : 'var(--text-strong)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
    </div>
  )
}

// ─── Features ───
function Features() {
  return (
    <section
      id='features'
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '24px',
          width: '100%',
        }}
        className='landing-hero'
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            width: '210px',
            flexShrink: 0,
          }}
        >
          <SectionTag>Features</SectionTag>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
          >
            <Heading size={20}>
              The whole link,
              <br />
              not just the redirect.
            </Heading>
            <Body>
              Shortening is the easy part. What happens after someone clicks is
              the rest of it.
            </Body>
          </div>
        </div>

        <div
          className='landing-cards'
          style={{
            display: 'flex',
            gap: '16px',
            flex: '1 0 400px',
            minWidth: 0,
          }}
        >
          <Card
            title='Clicks with context'
            body='Country, device, browser and referrer on every click. Not a running total you have to guess at.'
          />
          <Card
            title='A QR code with every link'
            body='Design the pattern and colours, drop your logo in the middle, download it at whatever size you need.'
          />
        </div>
      </div>

      <div
        className='landing-cards'
        style={{ display: 'flex', gap: '16px', width: '100%' }}
      >
        <Card
          title='Control where it goes'
          body='Edit the destination and every link and code already shared follows. The QR itself never changes.'
        />
        <Card
          title='Your own domain'
          body='Point go.yourbrand.com at Luotain and every link carries your name instead of ours.'
        />
        <Card
          title='Nothing to install'
          body='No script on your site, no tag manager, no consent banner. The link is the measurement.'
        />
      </div>
    </section>
  )
}

// ─── Use cases ───
function UseCases() {
  return (
    <section
      id='use-cases'
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Heading size={20} width={389}>
            Here&rsquo;s how you can use Luotain.
          </Heading>
          <Body width={257}>Same link, three very different jobs.</Body>
        </div>

        <div
          className='landing-cards'
          style={{ display: 'flex', gap: '16px', width: '100%' }}
        >
          <Card
            title='Print and packaging'
            lead='You put a code on something physical'
            body='Give each placement its own and you find out which one people actually scan, not just that someone did. If the destination changes later, edit it once and every code already printed follows.'
          />
          <Card
            title='Campaigns and social'
            lead='You share the same link in five places'
            body='The bio link, the newsletter, the post, the DM. One short link each, and the referrer tells you which one earned the traffic. No UTM strings to build or remember.'
          />
          <Card
            title='Client work'
            lead='You need to show someone the numbers'
            body="Every link reports country, device and source, so a monthly update takes a screenshot rather than an afternoon. On your own domain, the links look like the client's, not like a tool you're using."
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <Pill href='/login' tone='soft'>
          View a demo
        </Pill>
        <Pill href='/get-started' tone='dark'>
          Get started
        </Pill>
      </div>
    </section>
  )
}

function TickIcon({ on }) {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden='true'
    >
      {on ? (
        <path
          d='M3.4 8.4 6.3 11.3 12.6 5'
          stroke='var(--primary-base)'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      ) : (
        <path
          d='M4.5 8h7'
          stroke='var(--text-disabled)'
          strokeWidth='1.5'
          strokeLinecap='round'
        />
      )}
    </svg>
  )
}

// ─── Plans ───
function Plans() {
  const [annual, setAnnual] = useState(false)

  return (
    <section
      id='plans'
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '392px',
        }}
      >
        <Heading size={20}>Plans</Heading>
        <Body>
          Every plan gets full analytics and a QR code with every link. The only
          thing that changes is how many links you need.
        </Body>
      </div>

      <div style={{ display: 'flex', gap: '2px', borderRadius: '21px' }}>
        {[
          [false, 'Monthly'],
          [true, 'Annually'],
        ].map(([value, label]) => (
          <button
            key={label}
            type='button'
            onClick={() => setAnnual(value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              cursor: 'pointer',
              background: annual === value ? 'var(--bg-layer)' : 'transparent',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              lineHeight: '16px',
              letterSpacing: '0.24px',
              color: 'var(--text-strong)',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
            {value ? (
              <span style={{ color: 'var(--primary-base)' }}>save 20%</span>
            ) : null}
          </button>
        ))}
      </div>

      <div
        className='landing-plans'
        style={{ display: 'flex', gap: '32px', width: '100%' }}
      >
        {Object.values(PLANS).map((plan) => {
          const price = annual ? plan.priceAnnual : plan.priceMonthly
          const isFree = plan.id === 'FREE'
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
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-sans)',
                    fontSize: '14px',
                    fontWeight: 500,
                    lineHeight: '20px',
                    letterSpacing: '0.28px',
                    color: 'var(--text-strong)',
                  }}
                >
                  {plan.name}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-sans)',
                    fontSize: '10px',
                    lineHeight: 1.2,
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
                    <span
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '18px',
                        fontWeight: 500,
                        lineHeight: '26px',
                        letterSpacing: '0.36px',
                        color: 'var(--text-strong)',
                      }}
                    >
                      ${annual ? Math.round(price / 12) : price}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '12px',
                        lineHeight: '16px',
                        letterSpacing: '0.24px',
                        color: 'var(--text-strong)',
                        paddingBottom: '4px',
                      }}
                    >
                      /month
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: 'var(--font-sans)',
                      fontSize: '10px',
                      lineHeight: 1.2,
                      letterSpacing: '0.2px',
                      color: 'var(--text-soft)',
                    }}
                  >
                    {isFree
                      ? plan.priceNote
                      : annual
                        ? `$${price} billed yearly`
                        : 'Billed monthly'}
                  </p>
                </div>

                <Link
                  href='/get-started'
                  className='landing-pill'
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-lg)',
                    alignSelf: 'flex-start',
                    textDecoration: 'none',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '12px',
                    lineHeight: '16px',
                    letterSpacing: '0.24px',
                    background: isFree ? 'var(--bg-layer)' : 'var(--bg-weak)',
                    color: isFree
                      ? 'var(--text-strong)'
                      : 'var(--text-inverse)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isFree ? 'Get started' : 'Upgrade plan'}
                </Link>
              </div>

              {/* Read from PLAN_FEATURES, so this table can't drift from what
                  the product actually enforces. The design's version already
                  had, showing custom slugs as paid and custom domains as
                  Pro-only after both had changed. */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {PLAN_FEATURES.map((f, i) => {
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
                      <span style={{ display: 'flex', flexShrink: 0 }}>
                        <TickIcon on={on} />
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: '12px',
                          lineHeight: '16px',
                          letterSpacing: '0.24px',
                          color: on
                            ? 'var(--text-sub)'
                            : 'var(--text-disabled)',
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
        })}
      </div>

      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-sans)',
          fontSize: '10px',
          lineHeight: 1.2,
          letterSpacing: '0.2px',
          color: 'var(--text-soft)',
        }}
      >
        Prices in USD. Cancel anytime, no long-term contracts.
      </p>
    </section>
  )
}

// ─── Closing ───
function Closing() {
  return (
    <section
      className='landing-hero'
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '24px',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          flex: '1 0 280px',
          minWidth: 0,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Heading size={20} width={297}>
            Start measuring your links.
          </Heading>
          <Body width={277} tone='strong'>
            Five links free, no card. See where your traffic actually comes
            from.
          </Body>
        </div>
        <div>
          <Pill href='/get-started' tone='dark'>
            Start for free
          </Pill>
        </div>
      </div>

      {/* The analytics cards from the design. Left as a well for now — the
          three overlapping cards are screenshots of real product surfaces, and
          rebuilding them in markup would be a second copy to keep in step with
          the actual dashboard. */}
      <div
        style={{
          position: 'relative',
          height: '277px',
          width: '457px',
          maxWidth: '100%',
          borderRadius: '8px',
          background: 'var(--bg-surface)',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <img
          src={HALFTONE}
          alt=''
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
          }}
        />
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        width: '100%',
        paddingTop: '64px',
        paddingBottom: '64px',
        flexWrap: 'wrap',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '15px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            lineHeight: '16px',
            letterSpacing: '0.24px',
            color: 'var(--text-strong)',
          }}
        >
          Luotain · © {new Date().getFullYear()}
        </span>
        <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <Link
            href='/terms'
            className='landing-nav-link'
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              lineHeight: '16px',
              letterSpacing: '0.24px',
              color: 'var(--text-strong)',
              textDecoration: 'none',
            }}
          >
            Terms
          </Link>
          <span style={{ color: 'var(--text-soft)', fontSize: '12px' }}>
            &amp;
          </span>
          <Link
            href='/privacy'
            className='landing-nav-link'
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              lineHeight: '16px',
              letterSpacing: '0.24px',
              color: 'var(--text-strong)',
              textDecoration: 'none',
            }}
          >
            Privacy Policy
          </Link>
        </span>
      </div>

      <LogoMark size={22} muted />
    </footer>
  )
}

export default function LandingPage() {
  return (
    <main style={{ background: 'var(--bg-default)', minHeight: '100vh' }}>
      <Nav />

      <div
        className='landing-stack'
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '120px',
          width: '100%',
          maxWidth: `${COLUMN}px`,
          margin: '0 auto',
          padding: '96px 20px 0',
          boxSizing: 'border-box',
        }}
      >
        <Hero />
        <Reveal>
          <Features />
        </Reveal>
        <Reveal>
          <UseCases />
        </Reveal>
        <Reveal>
          <Plans />
        </Reveal>
        <Reveal>
          <Closing />
        </Reveal>
        <Footer />
      </div>
    </main>
  )
}
