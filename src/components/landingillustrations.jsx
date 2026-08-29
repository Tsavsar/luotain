'use client'

import CountryFlag from '@/components/countryflag'
import SourceIcon from '@/components/sourceicon'
import { QrCode } from '@/components/qrdesigner'

// ─── Feature illustrations ───
// Node 613:1223 and its siblings.
//
// Each one is a real surface from the app, floating on the card's well: the
// same rows, the same plates, the same type. That's deliberate — an
// illustration that invents its own visual language is a drawing OF the
// product rather than the product, and it dates the moment either changes.
//
// They're built from the app's own components where one exists (CountryFlag,
// SourceIcon, QrCode) and from the app's tokens where one doesn't.

// The floating white card every illustration sits on. 328 wide, inset 28 from
// the left and 34 from the top, cropped by the well — it runs off the right
// edge, which is what makes it read as a window onto something larger rather
// than a diagram sized to fit.
function Sheet({ children, top = 34, left = 28 }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`,
        width: '328px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '8px',
        borderRadius: '12px',
        background: 'var(--bg-default)',
      }}
    >
      {children}
    </div>
  )
}

// A measured row: an icon, a label on a bar sized to its value, and the count.
// The app's DataRow draws exactly this.
function Row({ icon, label, value, max }) {
  // Proportional from a floor, so a value of 1 is still a visible bar rather
  // than a sliver. The design's widths are hand-set; deriving them means a
  // different data set can't produce a nonsense chart.
  const MIN = 41
  const FULL = 273
  const width = MIN + (value / max) * (FULL - MIN)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: '10px',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          paddingLeft: '10px',
          paddingRight: '10px',
          paddingTop: '6px',
          paddingBottom: '6px',
          borderRadius: '9px',
          background: 'var(--bg-layer)',
          width: `${Math.round(width)}px`,
          flexShrink: 0,
          // The bar is the measurement, so a long label must not stretch it.
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            display: 'flex',
            flexShrink: 0,
            width: '18px',
            height: '18px',
          }}
        >
          {icon}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '14px',
            lineHeight: '20px',
            letterSpacing: '0.28px',
            color: 'var(--text-strong)',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      </div>

      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 500,
          fontSize: '14px',
          lineHeight: '20px',
          letterSpacing: '0.28px',
          color: 'var(--text-strong)',
          flexShrink: 0,
        }}
      >
        {value}
      </span>
    </div>
  )
}

// ─── Clicks with context ───
// Node 613:1223, verbatim: four countries, flags from the app's own component.
export function GeographyIllustration() {
  const rows = [
    ['Norway', 15],
    ['United States', 11],
    ['United Kingdom', 8],
    ['Singapore', 1],
  ]
  return (
    <Sheet>
      {rows.map(([label, value]) => (
        <Row
          key={label}
          label={label}
          value={value}
          max={15}
          icon={<CountryFlag country={label} size={18} />}
        />
      ))}
    </Sheet>
  )
}

// ─── Campaigns and social ───
// The same rows, measuring referrers instead — which is the point being made:
// one surface answers both questions.
export function SourcesIllustration() {
  const rows = [
    ['t.co', 32],
    ['i.instagram.com', 12],
    ['linkedin.com', 9],
    ['direct', 1],
  ]
  return (
    <Sheet>
      {rows.map(([label, value]) => (
        <Row
          key={label}
          label={label}
          value={value}
          max={32}
          icon={<SourceIcon domain={label} />}
        />
      ))}
    </Sheet>
  )
}

// ─── A QR code with every link ───
// The real renderer, on the same white sheet. A drawn stand-in would be a
// picture of a QR code that doesn't scan, which on a page selling QR codes is
// the wrong thing to show.
export function QrIllustration() {
  const SWATCHES = ['#171717', '#fa7319', '#2563eb', '#16a34a', '#db2777']
  return (
    <Sheet top={30} left={40}>
      <div
        style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          padding: '8px 4px',
        }}
      >
        <QrCode
          value='https://luot.link/k3mq7t'
          card={104}
          margin={9}
          color='#171717'
          markerColor='#fa7319'
          pattern='rounded'
          branding={false}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              lineHeight: 1,
              letterSpacing: '0.24px',
              color: 'var(--text-soft)',
            }}
          >
            Marker color
          </span>
          <div style={{ display: 'flex', gap: '7px' }}>
            {SWATCHES.map((hex, i) => (
              <span
                key={hex}
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: 'var(--radius-full)',
                  background: hex,
                  // The second is ringed, matching the marker colour on the
                  // code beside it — the illustration shows a state, not a
                  // palette floating free of anything.
                  boxShadow:
                    i === 1
                      ? '0 0 0 2px var(--bg-default), 0 0 0 3.5px var(--text-strong)'
                      : 'none',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  )
}

// ─── The well ───
// Wraps any illustration in the card's own surface, cropping whatever runs
// past its edges.
export default function Illustration({ children }) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '256 / 230',
        borderRadius: '8px',
        background: 'var(--bg-surface)',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}
