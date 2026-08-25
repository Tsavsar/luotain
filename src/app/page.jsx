'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import LogoMark from '@/components/logomark'
import Reveal from '@/components/reveal'
import PlanPicker from '@/components/planpicker'
import HeroCard from '@/components/landingherocard'
import ClosingCard from '@/components/landingctacard'
import {
  COLUMN,
  Pill,
  Heading,
  Body,
  Caption,
  Card,
} from '@/components/landingparts'

// ─── Landing page ───
// Node 554:2445, transcribed section by section.
//
// Everything the app already owns is pulled in rather than rebuilt: the plan
// columns are the real PlanPicker, the closing montage is the real analytics
// Card, and the logo is LogoMark. A marketing page that reimplements the
// product drifts from it the first time either changes.

// ─── Nav (555:2461) ───
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
        {/* 20.577 × 21.711 in the design. LogoMark is square, so 21 matches the
            height and the width follows the mark's own ratio. */}
        <LogoMark size={21} />

        {/* A 1.5px rule, not a border — it has its own radius and sits as a
            sibling, which a border-left on the list couldn't reproduce. */}
        <span
          aria-hidden='true'
          style={{
            width: '1.5px',
            height: '20px',
            borderRadius: '19px',
            background: 'var(--bg-surface)',
            flexShrink: 0,
          }}
        />

        <div
          className='landing-navlinks'
          style={{ display: 'flex', gap: '31px', alignItems: 'center' }}
        >
          {[
            ['Home', '#top'],
            ['Features', '#features'],
            ['Use cases', '#use-cases'],
            ['Price', '#plans'],
          ].map(([label, href]) => (
            <a
              key={label}
              href={href}
              className='landing-nav-link para-xs'
              style={{
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

      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
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

// ─── Hero (611:1114) ───
function Hero() {
  return (
    <section
      id='top'
      className='landing-split'
      style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',
          flex: '1 0 0',
          minWidth: 0,
          // 37px top and bottom, which is what sits the block's baseline
          // against the card beside it.
          padding: '37px 0',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--font-sans)',
              fontWeight: 440,
              fontSize: '36px',
              lineHeight: 1.1,
              letterSpacing: '0.72px',
              color: 'var(--text-strong)',
              width: '341px',
              maxWidth: '100%',
            }}
          >
            No link you share goes unmeasured.
          </h1>
          <Body width={360}>
            Shorten a link, get a QR code with it, and see exactly who clicked
            from where. Clicks, scans, countries and devices, all in one place.
          </Body>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <Pill href='/login' tone='soft'>
            View a demo
          </Pill>
          <Pill href='/get-started' tone='dark'>
            Get started
          </Pill>
        </div>
      </div>

      <HeroCard />
    </section>
  )
}

// ─── Features (613:1252) ───
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
      {/* One 3-column grid, not two rows that happen to look similar. The
          heading takes the first cell and five cards fill the rest, so every
          column lines up by construction rather than by arithmetic.

          The heading column widens 210 -> 256 as a result, which is what makes
          the two rows share edges. */}
      <div className='landing-grid'>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            // Bottom-aligned in its cell, so the heading sits on the same
            // baseline as the card titles beside it rather than floating at
            // the top of a 230px-tall row.
            justifyContent: 'flex-end',
            paddingBottom: '4px',
            minWidth: 0,
          }}
        >
          <Heading size={24} lead='The whole link,'>
            not just the redirect.
          </Heading>
          <Body>
            Shortening is the easy part. What happens after is the rest.
          </Body>
        </div>

        <Card
          title='Clicks with context'
          body='Country, device, browser and referrer on every click. Not a running total.'
        />
        <Card
          title='A QR code with every link'
          body='Design the pattern and colours, add your logo, download at any size.'
        />
        <Card
          title='Control where it goes'
          body='Change the destination and every code already shared follows.'
        />
        <Card
          title='Your own domain'
          body='Point go.yourbrand.com at Luotain and links carry your name, not ours.'
        />
        <Card
          title='Nothing to install'
          body='No script, no tag manager, no consent banner. The link is the measurement.'
        />
      </div>
    </section>
  )
}

// ─── Use cases (613:1253) ───
function UseCases() {
  return (
    <section
      id='use-cases'
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
        alignItems: 'flex-start',
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
          <Heading size={24} width={430} lead='Here&rsquo;s how'>
            you can use Luotain.
          </Heading>
          <Body width={300}>Same link, three very different jobs.</Body>
        </div>

        <div className='landing-grid'>
          <Card
            title='Print and packaging'
            lead='You put a code on something physical'
            body='Give each placement its own code and you learn which one people actually scan.'
          />
          <Card
            title='Campaigns and social'
            lead='You share the same link in five places'
            body='One short link each, and the referrer tells you which earned the traffic.'
          />
          <Card
            title='Client work'
            lead='You need to show someone the numbers'
            body='Country, device and source on every link, so an update is a screenshot.'
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
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

// ─── Plans (613:1296) ───
function Plans() {
  const router = useRouter()

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
          width: '392px',
          maxWidth: '100%',
        }}
      >
        {/* 400, not 440. The design uses font-normal on this one heading where
            every other section title is 440 — transcribed rather than
            normalised, since a heavier "Plans" would be visibly off. */}
        <Heading size={24} weight={400}>
          Plans
        </Heading>
        <Body>
          Every plan gets full analytics and a QR code with every link. The only
          thing that changes is how many links you need.
        </Body>
      </div>

      {/* The app's own picker, so the tiers, prices, features and the monthly /
          annually toggle all come from PLANS. The design's table is already
          stale in two places — it shows custom slugs as paid and custom domains
          as Pro-only, both of which changed — and a pricing page that
          contradicts the product is worse than a plain one.

          currentPlan is null: nobody visiting this page is on a plan, so every
          column offers to start rather than one saying "current". */}
      <PlanPicker
        currentPlan={null}
        showIntro={false}
        onChoose={() => router.push('/get-started')}
      />
    </section>
  )
}

// ─── Closing (613:2059) ───
function Closing() {
  return (
    <section
      className='landing-split'
      style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          flex: '1 0 0',
          minWidth: 0,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Heading size={24} weight={400} width={330}>
            Start measuring your links.
          </Heading>
          {/* text-strong here, not text-sub. Every other body on the page is
              sub; the design darkens this one because it's the last thing read
              before the button. */}
          <Body width={310} tone='strong'>
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

      <ClosingCard />
    </section>
  )
}

// ─── Footer (613:1495) ───
function Footer() {
  return (
    <footer
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        width: '100%',
        paddingBottom: '64px',
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
        <span className='para-xs' style={{ color: 'var(--text-strong)' }}>
          Luotain · © {new Date().getFullYear()}
        </span>
        <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <Link
            href='/terms'
            className='landing-nav-link para-xs'
            style={{ color: 'var(--text-strong)', textDecoration: 'none' }}
          >
            Terms
          </Link>
          <span className='para-xs' style={{ color: 'var(--text-strong)' }}>
            &amp;
          </span>
          <Link
            href='/privacy'
            className='landing-nav-link para-xs'
            style={{ color: 'var(--text-strong)', textDecoration: 'none' }}
          >
            Privacy Policy.
          </Link>
        </span>
      </div>

      {/* 34 × 22 in the design — the wordmark, wider than it is tall, rather
          than the square logomark used in the nav. */}
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
          // 120px between sections, from the design's own gap on 613:2060.
          gap: '120px',
          width: '100%',
          maxWidth: `${COLUMN}px`,
          margin: '0 auto',
          // 150 from the top of the page, less the 54 the nav already sits at.
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
