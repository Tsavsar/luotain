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
function Bar({ w = 60, h = 6, tone = 'layer' }) {
  return (
    <span
      style={{
        display: 'block',
        width: `${w}%`,
        height: `${h}px`,
        borderRadius: '3px',
        background:
          tone === 'accent' ? 'var(--primary-base)' : 'var(--bg-layer)',
        opacity: tone === 'accent' ? 0.9 : 1,
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
        background:
          tone === 'accent' ? 'var(--primary-base)' : 'var(--bg-layer)',
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
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: `${gap}px`,
        padding: '8px 10px',
        borderRadius: '8px',
        background: active ? 'var(--bg-default)' : 'transparent',
        // The ring rather than a border, so an active row is the same height
        // as an inactive one and the list doesn't shift.
        boxShadow: active ? '0 0 0 1.5px var(--primary-base)' : 'none',
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
function Panel({ children, width = 260, top = '50%' }) {
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: '16px',
        transform: top === '50%' ? 'translateY(-50%)' : 'none',
        width: `${width}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '10px',
        borderRadius: '12px',
        background: 'var(--bg-default)',
        boxShadow: '0 2px 10px rgba(23, 23, 23, 0.05)',
        boxSizing: 'border-box',
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
    <Panel>
      <Row>
        <Dot />
        <Bar w={44} />
      </Row>
      <Row active>
        <CountryFlag country='Norway' size={14} />
        <Bar w={38} />
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
    </Panel>
  )
}

// ─── A QR code with every link ───
// The real renderer beside a skeleton control column, one swatch lit.
export function QrIllustration() {
  return (
    <Panel width={250}>
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
    <Panel width={244}>
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
    <Panel width={252}>
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
    <Panel width={256}>
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
