'use client'

import CountryFlag from '@/components/countryflag'
import { QrCode } from '@/components/qrdesigner'

// ─── Feature illustrations ───
//
// The grammar, taken from the Mintlify reference: a panel of SKELETON rows —
// grey blocks, not text — with exactly ONE real, accented detail that names
// the feature. The eye reads structure at a glance and lands on the one thing
// that matters.
//
// The previous version rendered everything literally, which meant the
// illustration competed with the copy beneath it instead of supporting it.
// Nothing here is meant to be read closely.

// ─── Primitives ───

// A skeleton line. Width is a percentage so a row reads as proportional
// content rather than a fixed-size bar.
// Skeleton lines were --bg-layer on --bg-surface: #f5f5f5 on #f7f7f7, two
// values apart and effectively invisible. They're a real step darker now, and
// the panel behind them is white, so there's actual contrast to read.
const SKELETON = 'rgba(23, 23, 23, 0.10)'
const SKELETON_SOFT = 'rgba(23, 23, 23, 0.06)'

function Bar({ w = 60, h = 6, tone = 'skeleton' }) {
  const bg =
    tone === 'accent'
      ? 'var(--primary-base)'
      : tone === 'soft'
        ? SKELETON_SOFT
        : SKELETON
  return (
    <span
      style={{
        display: 'block',
        width: `${w}%`,
        height: `${h}px`,
        borderRadius: '3px',
        background: bg,
      }}
    />
  )
}

function Dot({ tone = 'layer', size = 14 }) {
  return (
    <span
      style={{
        display: 'block',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: 'var(--radius-full)',
        background: tone === 'accent' ? 'var(--primary-base)' : SKELETON,
        flexShrink: 0,
      }}
    />
  )
}

// The one literal element per illustration. Small, in the brand orange, on a
// tinted plate — it should read as a tag on a diagram, not as UI copy.
function Marker({ children }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 7px',
        borderRadius: '5px',
        background: 'var(--primary-base)',
        color: 'var(--bg-default)',
        fontFamily: 'var(--font-sans)',
        fontWeight: 500,
        fontSize: '9px',
        lineHeight: '12px',
        letterSpacing: '0.18px',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  )
}

// A skeleton row on the panel. `active` gives it the outlined treatment the
// reference uses for the one row being pointed at.
function Row({ children, active, gap = 8 }) {
  return (
    <div
      className='landing-illo-row'
      data-active={active ? 'true' : 'false'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: `${gap}px`,
        padding: '8px 10px',
        borderRadius: '8px',
        // A tint AND a ring. The ring alone was a hairline on white, which
        // isn't enough colour to anchor the card — this is the one element
        // the eye is meant to land on.
        background: active ? 'rgba(250, 115, 25, 0.07)' : 'transparent',
        // A ring rather than a border, so an active row is the same height as
        // an inactive one and the list doesn't shift.
        boxShadow: active ? 'inset 0 0 0 1.5px var(--primary-base)' : 'none',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  )
}

// The floating panel. Wider than the well and pulled left, so it crops on the
// right — the reference's panels all run off their cards, which is what makes
// them read as a window rather than a diagram.
// Fills the well rather than floating in the middle of it. It was 260 wide in
// a 323 column — 63px of empty surface framing a small object, which is most
// of why the cards read as empty.
//
// Now it's inset 14 on three sides and runs PAST the bottom, so the list
// continues out of frame instead of stopping politely.
function Panel({ children, tall = false }) {
  return (
    <div
      className='landing-illo-panel'
      style={{
        position: 'absolute',
        top: '14px',
        left: '14px',
        right: '14px',
        bottom: tall ? '-28px' : '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        padding: '12px',
        borderRadius: '12px',
        background: 'var(--bg-default)',
        boxShadow: '0 2px 12px rgba(23, 23, 23, 0.06)',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}

// ─── Clicks with context ───
// A ranked list, one row surfaced with a real flag and a real number.
export function GeographyIllustration() {
  return (
    // tall: the list runs off the bottom of the well, so it reads as the top
    // of a longer list rather than four rows that happen to end.
    <Panel tall>
      <Row>
        <Dot />
        <Bar w={44} />
      </Row>
      <Row active>
        <CountryFlag country='Norway' size={15} />
        <Bar w={38} tone='soft' />
        <span style={{ flex: '1 0 0' }} />
        <Marker>248</Marker>
      </Row>
      <Row>
        <Dot />
        <Bar w={52} />
      </Row>
      <Row>
        <Dot />
        <Bar w={30} />
      </Row>
      <Row>
        <Dot />
        <Bar w={46} />
      </Row>
    </Panel>
  )
}

// ─── A QR code with every link ───
// The real renderer beside a skeleton control column, one swatch lit.
export function QrIllustration() {
  return (
    <Panel>
      <div
        style={{
          display: 'flex',
          gap: '14px',
          alignItems: 'center',
          padding: '4px 2px',
        }}
      >
        <QrCode
          value='https://luot.link/k3mq7t'
          card={86}
          margin={7}
          color='#171717'
          markerColor='#fa7319'
          pattern='rounded'
          branding={false}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            flex: '1 0 0',
          }}
        >
          <Bar w={54} h={5} />
          <div style={{ display: 'flex', gap: '6px' }}>
            {[0, 1, 2, 3].map((i) => (
              <Dot key={i} size={13} tone={i === 1 ? 'accent' : 'layer'} />
            ))}
          </div>
          <Bar w={38} h={5} />
          <Bar w={68} h={5} />
        </div>
      </div>
    </Panel>
  )
}

// ─── Control where it goes ───
// One row's destination replaced, the marker naming the change.
export function DestinationIllustration() {
  return (
    <Panel>
      <Row>
        <Bar w={30} h={5} />
        <span style={{ flex: '1 0 0' }} />
        <Bar w={14} h={5} />
      </Row>
      <Row active gap={7}>
        <Bar w={26} h={5} />
        <span style={{ flex: '1 0 0' }} />
        <Marker>Updated</Marker>
      </Row>
      <Row>
        <Bar w={44} h={5} />
        <span style={{ flex: '1 0 0' }} />
        <Bar w={14} h={5} />
      </Row>
      <Row>
        <Bar w={36} h={5} />
        <span style={{ flex: '1 0 0' }} />
        <Bar w={14} h={5} />
      </Row>
    </Panel>
  )
}

// ─── Your own domain ───
// A domain list, one verified. The tick is the accent rather than a plate,
// since "verified" is a state rather than a label.
export function DomainIllustration() {
  return (
    <Panel>
      <Row>
        <Bar w={40} h={5} />
      </Row>
      <Row active>
        <Bar w={46} h={5} />
        <span style={{ flex: '1 0 0' }} />
        <Marker>
          <svg
            width='8'
            height='8'
            viewBox='0 0 10 10'
            fill='none'
            aria-hidden='true'
          >
            <path
              d='M2 5.2 4.1 7.3 8 3.2'
              stroke='currentColor'
              strokeWidth='1.6'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
          Verified
        </Marker>
      </Row>
      <Row>
        <Bar w={34} h={5} />
      </Row>
      <Row>
        <Bar w={52} h={5} />
      </Row>
    </Panel>
  )
}

// ─── Nothing to install ───
// Two stacked plates: what you'd normally add, and what you add instead. The
// contrast IS the illustration, so neither carries a marker.
export function NoScriptIllustration() {
  return (
    <Panel>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '7px',
          padding: '10px',
          borderRadius: '9px',
          background: 'var(--bg-surface)',
          // Dimmed and struck through: this is the thing you DON'T do.
          opacity: 0.55,
        }}
      >
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <Bar w={22} h={5} />
          <Bar w={44} h={5} />
        </div>
        <Bar w={62} h={5} />
      </div>

      <div style={{ height: '4px' }} />

      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          padding: '10px',
          borderRadius: '9px',
          background: 'var(--bg-default)',
          boxShadow: '0 0 0 1.5px var(--primary-base)',
        }}
      >
        <Bar w={40} h={5} />
        <span style={{ flex: '1 0 0' }} />
        <Marker>Done</Marker>
      </div>
    </Panel>
  )
}

// ─── Print and packaging ───
// Two codes, different placements, different scan counts — which is the point
// the copy makes.
export function PrintIllustration() {
  return (
    <Panel>
      <div style={{ display: 'flex', gap: '12px', padding: '2px' }}>
        {[0, 1].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              alignItems: 'center',
              flex: '1 0 0',
              padding: '10px 8px',
              borderRadius: '9px',
              background: i === 0 ? 'var(--bg-default)' : 'var(--bg-surface)',
              boxShadow: i === 0 ? '0 0 0 1.5px var(--primary-base)' : 'none',
              opacity: i === 0 ? 1 : 0.6,
            }}
          >
            <QrCode
              value={
                i === 0
                  ? 'https://luot.link/k3mq7t'
                  : 'https://luot.link/p8xw2n'
              }
              card={62}
              margin={5}
              color='#171717'
              markerColor='#171717'
              pattern='square'
              branding={false}
            />
            {i === 0 ? <Marker>82 scans</Marker> : <Bar w={54} h={5} />}
          </div>
        ))}
      </div>
    </Panel>
  )
}

// ─── Client work ───
// A row of stat tiles, one carrying a real figure.
export function StatsIllustration() {
  return (
    <Panel>
      <div style={{ display: 'flex', gap: '8px', padding: '2px' }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '9px',
              flex: '1 0 0',
              padding: '10px',
              borderRadius: '9px',
              background: i === 1 ? 'var(--bg-default)' : 'var(--bg-surface)',
              boxShadow: i === 1 ? '0 0 0 1.5px var(--primary-base)' : 'none',
            }}
          >
            <Bar w={62} h={4} />
            {i === 1 ? (
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 500,
                  fontSize: '15px',
                  lineHeight: '18px',
                  letterSpacing: '0.3px',
                  color: 'var(--text-strong)',
                }}
              >
                1,204
              </span>
            ) : (
              <Bar w={44} h={9} />
            )}
          </div>
        ))}
      </div>

      <div style={{ height: '2px' }} />
      <Row>
        <Dot size={12} />
        <Bar w={48} h={5} />
      </Row>
      <Row>
        <Dot size={12} />
        <Bar w={34} h={5} />
      </Row>
    </Panel>
  )
}

// ─── The well ───
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
