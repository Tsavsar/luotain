'use client'

import CountryFlag from '@/components/countryflag'
import { QrCode } from '@/components/qrdesigner'

// ─── Feature illustrations ───
// Nodes 613:1223, 1230, 1237, 1242, 1247.
//
// The grammar across all five is the app's own INPUT FIELD in its focus
// state: an orange hairline with the two-step focus ring behind it. Every
// card has exactly one, and it's whatever the feature produces — the short
// link, the domain, the destination.
//
// That's a better idea than the skeleton rows I'd built, because it's the
// product's actual vocabulary rather than a diagram of it. Someone who has
// used the app recognises the shape before they read the label.

const LINK_ICON =
  'M8.5 11.5a3.2 3.2 0 0 0 4.8.35l2-2a3.2 3.2 0 0 0-4.5-4.5l-1.1 1.1M11.5 8.5a3.2 3.2 0 0 0-4.8-.35l-2 2a3.2 3.2 0 0 0 4.5 4.5l1.1-1.1'

// The focus ring, as two spread shadows — the same Focus Effects/focus-active
// style the design file uses. A single ring would sit directly against the
// orange border; the white spread between them is what makes it read as a
// focus state rather than a double border.
const FOCUS_RING =
  '0 0 0 2.5px var(--bg-default), 0 0 0 5px rgba(250, 115, 25, 0.24)'

function LinkGlyph({ size = 15 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 20 20'
      fill='none'
      aria-hidden='true'
      style={{ flexShrink: 0 }}
    >
      <path
        d={LINK_ICON}
        stroke='var(--primary-base)'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

// The motif. `focused` is the orange-ringed state; without it, the quiet
// bg-layer counterpart that every card pairs it with.
function Field({ children, focused, icon, weight, width, size = 11 }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '7.6px',
        paddingLeft: '10.1px',
        paddingRight: '12.6px',
        paddingTop: '7.6px',
        paddingBottom: '7.6px',
        borderRadius: '10.1px',
        width: width || undefined,
        boxSizing: 'border-box',
        background: focused ? 'var(--bg-default)' : 'var(--bg-layer)',
        border: focused ? '0.79px solid var(--primary-base)' : 'none',
        boxShadow: focused ? FOCUS_RING : 'none',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {icon ? <LinkGlyph /> : null}
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: `${size}px`,
          fontWeight: weight || 400,
          lineHeight: `${Math.round(size * 1.43 * 10) / 10}px`,
          letterSpacing: `${size * 0.02}px`,
          color: 'var(--text-strong)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {children}
      </span>
    </span>
  )
}

// The frame. Content is centred horizontally and positioned from the top,
// matching the design's own `top` offsets rather than being vertically
// centred — the cards all sit slightly high in their wells.
function Frame({ children, top = 40, align = 'center' }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: align,
        paddingTop: `${top}px`,
        paddingLeft: '16px',
        paddingRight: '16px',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  )
}

// ─── Clicks with context (613:1223) ───
// The ranked list, the one card that is data rather than a field.
export function GeographyIllustration() {
  const rows = [
    ['Norway', '1,204', true],
    ['United States', '892'],
    ['Germany', '308'],
  ]
  return (
    <Frame top={38} align='stretch'>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {rows.map(([label, value, accent]) => (
          <div
            key={label}
            className='illo-row'
            data-accent={accent ? 'true' : 'false'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              paddingLeft: '10.1px',
              paddingRight: '12.6px',
              paddingTop: '7.6px',
              paddingBottom: '7.6px',
              borderRadius: '10.1px',
              background: accent ? 'var(--bg-default)' : 'var(--bg-layer)',
              border: accent ? '0.79px solid var(--primary-base)' : 'none',
              boxShadow: accent ? FOCUS_RING : 'none',
            }}
          >
            <CountryFlag country={label} size={14} />
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '11px',
                lineHeight: '15.8px',
                letterSpacing: '0.22px',
                color: 'var(--text-strong)',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </span>
            <span style={{ flex: '1 0 0' }} />
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 500,
                fontSize: '11px',
                lineHeight: '15.8px',
                letterSpacing: '0.22px',
                fontVariantNumeric: 'tabular-nums',
                color: 'var(--text-strong)',
              }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>
    </Frame>
  )
}

// ─── A QR code with every link (613:1230) ───
// A 120px white card holding the code, with the destination field beneath.
export function QrIllustration() {
  return (
    <Frame top={30}>
      <div
        style={{
          width: '120px',
          height: '120px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '12px',
          background: 'var(--bg-default)',
          boxSizing: 'border-box',
        }}
      >
        <QrCode
          value='https://luot.link/7rw5ej'
          card={110}
          margin={0}
          color='#171717'
          markerColor='#171717'
          pattern='square'
          branding={false}
        />
      </div>

      {/* 165 from the top in the design, so 15px below the 120px card. */}
      <span style={{ marginTop: '15px' }}>
        <Field focused icon size={8.7}>
          https://example.com/your-page
        </Field>
      </span>
    </Frame>
  )
}

// ─── No more long links (613:1237) ───
// The long URL wrapping on bg-layer, the short one focused beneath it.
export function ShortenIllustration() {
  return (
    <Frame top={47}>
      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-start',
          width: '216px',
          paddingLeft: '10px',
          paddingRight: '10px',
          paddingTop: '6px',
          paddingBottom: '6px',
          borderRadius: '9px',
          background: 'var(--bg-layer)',
          boxSizing: 'border-box',
        }}
      >
        <span style={{ display: 'flex', paddingTop: '2px' }}>
          <LinkGlyph size={12} />
        </span>
        {/* Wraps on purpose — the length IS the point, so it can't be
            truncated the way a field's value would be. */}
        <span
          style={{
            flex: '1 0 0',
            minWidth: 0,
            fontFamily: 'var(--font-sans)',
            fontSize: '8px',
            lineHeight: 1.3,
            letterSpacing: '0.16px',
            color: 'var(--text-strong)',
            wordBreak: 'break-word',
          }}
        >
          https://acme.com/products/spring-2026/menu?utm_source=instagram&amp;utm_medium=social&amp;utm_campaign=spring-launch&amp;ref=bio
        </span>
      </div>

      <span style={{ marginTop: '18px' }}>
        <Field focused icon>
          luot.link/7rw5ej
        </Field>
      </span>
    </Frame>
  )
}

// ─── Nothing to install (613:1242) ───
// Three script cards fanned, with an error badge over the corner. The pile is
// the point: it's the setup you don't do.
export function NoScriptIllustration() {
  // The design's own rotations and offsets. Each card is the same content —
  // a stack of the same chore, not three different ones.
  const cards = [
    { rotate: -6.66, top: 43, left: -7.3 },
    { rotate: -2.11, top: 68.5, left: 8.5 },
    { rotate: 2.21, top: 89.7, left: -0.8 },
  ]

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {cards.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: `${c.top}px`,
            left: `calc(50% + ${c.left}px)`,
            transform: `translateX(-50%) rotate(${c.rotate}deg)`,
            width: '183.5px',
            display: 'flex',
            gap: '6.8px',
            alignItems: 'flex-start',
            paddingLeft: '8.5px',
            paddingRight: '8.5px',
            paddingTop: '5.1px',
            paddingBottom: '5.1px',
            borderRadius: '7.6px',
            background: 'var(--bg-layer)',
            // Two rings again, but grey — the same device as the focus state
            // with the colour taken out, which is what separates the cards
            // from each other in the pile.
            boxShadow:
              '0 0 0 1.7px var(--bg-default), 0 0 0 3.4px var(--bg-surface)',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          <span style={{ display: 'flex', paddingTop: '1.7px', flexShrink: 0 }}>
            <ChevronGlyph />
          </span>

          {/* Monospace. This is the one place on the page where it earns
              itself — the same lines in the app's sans read as crossed-out
              words rather than as code. */}
          <span
            style={{
              flex: '1 0 0',
              minWidth: 0,
              fontFamily:
                'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)',
              fontSize: '6.8px',
              lineHeight: 1.3,
              letterSpacing: '0.14px',
              color: 'var(--text-strong)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {'<script async src='}
            <span style={{ color: 'var(--text-soft)' }}>
              {'"googletagmanager.com/gtag/js?id=G-…"'}
            </span>
            {
              '></script>\n<script>\n  window.dataLayer = window.dataLayer || [];'
            }
          </span>
        </div>
      ))}

      {/* The badge, rotated 20deg and sitting over the pile's corner. */}
      <div
        style={{
          position: 'absolute',
          left: '199px',
          top: '120px',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--radius-full)',
          background: 'var(--error-base)',
          transform: 'rotate(20.14deg)',
          boxShadow: '0 0 0 3px var(--bg-default)',
        }}
      >
        <svg
          width='14'
          height='14'
          viewBox='0 0 16 16'
          fill='none'
          aria-hidden='true'
        >
          <path
            d='M5 5l6 6M11 5l-6 6'
            stroke='var(--bg-default)'
            strokeWidth='1.8'
            strokeLinecap='round'
          />
        </svg>
      </div>
    </div>
  )
}

function ChevronGlyph() {
  return (
    <svg
      width='10'
      height='10'
      viewBox='0 0 12 12'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M3.4 3.2 6.2 6l-2.8 2.8M7.2 8.8h1.6'
        stroke='var(--text-soft)'
        strokeWidth='1.1'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

// ─── Your own domain (613:1247) ───
// Three domain rows, each a focused domain field paired with its quiet slug.
export function DomainIllustration() {
  const rows = [
    ['s.acme.com', '/dfgw9d'],
    ['go.acme.com', '/qv96y8'],
    ['links.acme.com', '/yxrt7a'],
  ]
  return (
    <Frame top={52} align='stretch'>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16.4px' }}>
        {rows.map(([host, slug], i) => (
          <div
            key={host}
            className='illo-row'
            // Only the first carries the accent in hover terms, so the row
            // that moves is the one the eye already starts on.
            data-accent={i === 0 ? 'true' : 'false'}
            style={{
              display: 'flex',
              gap: '7.6px',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Field focused width='106px'>
              {host}
            </Field>
            <Field weight={500} width='101px'>
              {slug}
            </Field>
          </div>
        ))}
      </div>
    </Frame>
  )
}
