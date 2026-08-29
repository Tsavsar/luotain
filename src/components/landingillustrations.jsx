'use client'

import CountryFlag from '@/components/countryflag'
import { QrCode } from '@/components/qrdesigner'

// ─── Feature illustrations ───
//
// Five, one per feature, each saying ONE thing with room around it.
//
// The previous versions filled every frame edge to edge and pointed at the
// same idea three ways at once — a label, a tag and a colour all doing the
// same job. This is the subtraction pass: one idea, stated once, surrounded
// by space.
//
// Colour points, it doesn't decorate. Two of the five carry no accent at all,
// because on those the composition already carries the meaning.

const HAIRLINE = 'rgba(23, 23, 23, 0.07)'

// Text inside an illustration. Small, literal, quiet.
function T({ children, size = 11, tone = 'sub', strike, weight }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: `${size}px`,
        fontWeight: weight || (tone === 'strong' ? 500 : 400),
        lineHeight: `${Math.round(size * 1.4)}px`,
        letterSpacing: `${size * 0.02}px`,
        fontVariantNumeric: 'tabular-nums',
        color:
          tone === 'accent'
            ? 'var(--primary-base)'
            : tone === 'strong'
              ? 'var(--text-strong)'
              : tone === 'faint'
                ? 'var(--text-soft)'
                : 'var(--text-sub)',
        textDecoration: strike ? 'line-through' : 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

// The frame. Centred content with real padding — 22, not 14. The extra space
// is the point: these should feel composed rather than packed.
function Frame({ children, align = 'center' }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: align === 'center' ? 'center' : 'stretch',
        padding: '22px',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  )
}

// ─── Clicks with context ───
// Three rows, not eight. The claim is that a click carries context, and three
// examples make that point as well as eight do while leaving room to breathe.
export function GeographyIllustration() {
  const rows = [
    ['Norway', '1,204', true],
    ['United States', '892'],
    ['Germany', '308'],
  ]
  return (
    <Frame align='stretch'>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {rows.map(([label, value, accent]) => (
          <div
            key={label}
            className='illo-row'
            data-accent={accent ? 'true' : 'false'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: '9px 11px',
              borderRadius: '9px',
              background: 'var(--bg-default)',
              // A hairline, not a fill. The rows are separated by their edges
              // rather than by contrast, which keeps the card quiet.
              boxShadow: accent
                ? 'inset 0 0 0 1px rgba(250, 115, 25, 0.4)'
                : `inset 0 0 0 1px ${HAIRLINE}`,
            }}
          >
            <CountryFlag country={label} size={15} />
            <T size={11} tone={accent ? 'strong' : 'sub'}>
              {label}
            </T>
            <span style={{ flex: '1 0 0' }} />
            <T size={11} tone={accent ? 'accent' : 'strong'} weight={500}>
              {value}
            </T>
          </div>
        ))}
      </div>
    </Frame>
  )
}

// ─── A QR code with every link ───
// The code alone, at a size worth looking at, with the link beneath it.
// No palette, no controls — the feature is that every link HAS one, and a row
// of swatches was answering a question nobody asked here.
export function QrIllustration() {
  return (
    <Frame>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            padding: '12px',
            borderRadius: '14px',
            background: 'var(--bg-default)',
            boxShadow: `inset 0 0 0 1px ${HAIRLINE}`,
            lineHeight: 0,
          }}
        >
          <QrCode
            value='https://luot.link/k3mq7t'
            card={108}
            margin={0}
            color='#171717'
            markerColor='#171717'
            pattern='rounded'
            branding={false}
          />
        </div>
        <T size={11} tone='faint'>
          luot.link/k3mq7t
        </T>
      </div>
    </Frame>
  )
}

// ─── Control where it goes ───
// The code above, unchanged; the destination beneath it, replaced. That
// relationship is the entire feature, so nothing else is on the card.
export function DestinationIllustration() {
  return (
    <Frame>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          alignItems: 'center',
        }}
      >
        <QrCode
          value='https://luot.link/spring-menu'
          card={64}
          margin={0}
          color='#171717'
          markerColor='#171717'
          pattern='square'
          branding={false}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            alignItems: 'center',
          }}
        >
          {/* Struck and faded: where it used to go. */}
          <T size={10} tone='faint' strike>
            acme.co/menu/winter
          </T>
          <T size={12} tone='strong'>
            acme.co/menu/spring
          </T>
        </div>
      </div>
    </Frame>
  )
}

// ─── Your own domain ───
// Several domains, scrolling forever. The feature isn't one domain — it's that
// you can bring as many as you like — and a list that doesn't end says that
// better than a single example.
export function DomainIllustration() {
  const domains = [
    'go.yourbrand.com',
    'links.acme.co',
    's.northwind.io',
    'on.parcel.dev',
    'go.meridian.studio',
    'l.fieldnotes.co',
  ]

  const list = (hidden) => (
    <div
      aria-hidden={hidden || undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        paddingBottom: '6px',
      }}
    >
      {domains.map((host) => (
        <div
          key={host}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            padding: '9px 11px',
            borderRadius: '9px',
            background: 'var(--bg-default)',
            boxShadow: `inset 0 0 0 1px ${HAIRLINE}`,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: '5px',
              height: '5px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--success-base)',
              flexShrink: 0,
            }}
          />
          <T size={11}>{host}</T>
        </div>
      ))}
    </div>
  )

  return (
    <Frame align='stretch'>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          // Fades at both ends, so rows arrive and leave rather than snapping
          // on and off at a hard edge.
          maskImage:
            'linear-gradient(to bottom, transparent 0%, #000 18%, #000 82%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0%, #000 18%, #000 82%, transparent 100%)',
        }}
      >
        {/* Rendered twice and moved up by half the track — at the moment the
            first copy leaves, the second sits exactly where it began, so the
            loop has no seam. */}
        <div className='illo-marquee'>
          {list(false)}
          {list(true)}
        </div>
      </div>
    </Frame>
  )
}

// ─── Nothing to install ───
// One line of code, struck out. That's the whole idea, and anything added to
// it — a caption, a second block, a tick — states it twice.
export function NoScriptIllustration() {
  return (
    <Frame>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            padding: '14px 16px',
            borderRadius: '10px',
            background: 'var(--bg-default)',
            boxShadow: `inset 0 0 0 1px ${HAIRLINE}`,
            opacity: 0.5,
          }}
        >
          <T size={10} tone='faint' strike>
            &lt;script src=&quot;analytics.js&quot;&gt;
          </T>
          <T size={10} tone='faint' strike>
            &lt;/script&gt;
          </T>
        </div>

        <T size={12} tone='strong'>
          luot.link/k3mq7t
        </T>
      </div>
    </Frame>
  )
}

export default function Illustration({ children }) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}
