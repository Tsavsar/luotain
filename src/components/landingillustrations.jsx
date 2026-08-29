'use client'

import { useEffect, useRef, useState } from 'react'
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

// The floating white card every illustration sits on.
//
// Centred and 240 wide rather than 328 inset from the left. A stacked deck
// only reads as a deck if it's surrounded by space on both sides — pinned to
// one edge, the cards behind look like a rendering fault rather than depth.
//
// It sits high in the well because the stack grows DOWNWARD: the cards behind
// need room beneath the front one.
function Sheet({ label, children }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '240px',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        padding: '10px',
        borderRadius: '12px',
        background: 'var(--bg-default)',
        // Separates the cards from each other, not just from the well — with
        // three overlapping, the edge between them is the only thing telling
        // you there's more than one.
        boxShadow: '0 4px 16px rgba(23, 23, 23, 0.08)',
        boxSizing: 'border-box',
      }}
    >
      {/* Says which card you're looking at. Without it the deck is three
          near-identical lists and the point — one surface, three questions —
          doesn't land. */}
      {label ? (
        <span
          style={{
            paddingLeft: '2px',
            paddingBottom: '2px',
            fontFamily: 'var(--font-sans)',
            fontWeight: 500,
            fontSize: '11px',
            lineHeight: '14px',
            letterSpacing: '0.22px',
            color: 'var(--text-soft)',
          }}
        >
          {label}
        </span>
      ) : null}
      {children}
    </div>
  )
}

// A measured row: an icon, a label on a bar sized to its value, and the count.
// The app's DataRow draws exactly this.
function Row({ icon, label, value, max }) {
  // Proportional from a floor, so a value of 1 is still a visible bar rather
  // than a sliver.
  //
  // The range is wider than it was — 46 to 196 across a narrower card, where
  // it used to be 41 to 273 across a wide one. A bigger spread over less width
  // is what makes the difference between 15 and 11 legible at a glance rather
  // than a subtle nudge.
  const MIN = 46
  const FULL = 196
  const width = MIN + (value / max) * (FULL - MIN)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: '6px',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          paddingLeft: '8px',
          paddingRight: '8px',
          paddingTop: '5px',
          paddingBottom: '5px',
          borderRadius: '8px',
          background: 'var(--bg-layer)',
          width: `${Math.round(width)}px`,
          flexShrink: 0,
          // The bar is the measurement, so a long label must not stretch it.
          overflow: 'hidden',
        }}
      >
        {icon ? (
          <span
            style={{
              display: 'flex',
              flexShrink: 0,
              width: '16px',
              height: '16px',
            }}
          >
            {icon}
          </span>
        ) : null}
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            // 12, down from 14 — the sheet is 240 rather than 328, and the
            // type has to come with it or the bars become all label.
            fontSize: '12px',
            lineHeight: '16px',
            letterSpacing: '0.24px',
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
          fontSize: '12px',
          lineHeight: '16px',
          letterSpacing: '0.24px',
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
    <Sheet label='Geography'>
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
    <Sheet label='Sources'>
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

// ─── Devices ───
// No icon column: the app's Devices card doesn't draw one either, because a
// generic phone glyph next to the word "Mobile" says nothing the word didn't.
export function DevicesIllustration() {
  const rows = [
    ['Desktop', 15],
    ['Mobile', 11],
    ['Tablet', 8],
    ['Smart TV', 3],
  ]
  return (
    <Sheet label='Devices'>
      {rows.map(([label, value]) => (
        <Row key={label} label={label} value={value} max={15} />
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

// ─── Cycling stack ───
// Three sheets stacked with depth. Every few seconds the front one drops to
// the back and the next comes forward, so the card shows geography, then
// sources, then devices, then round again.
//
// A card that loops forever is the point — it says "this is one surface
// answering three questions" better than three static cards would.
// 2000, down from 2600. At the slower pace the card sat still long enough to
// read as static between turns; this keeps it visibly in motion without
// rushing the transition itself.
const CYCLE_MS = 2000

export function CyclingStack({ items }) {
  const [front, setFront] = useState(0)
  const [visible, setVisible] = useState(false)
  const wrapRef = useRef(null)

  // Only runs while it's on screen. A timer looping in a card nobody is
  // looking at costs battery and, on a page with several of these, a
  // measurable amount of it.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.35 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    // Respects the OS setting: a card that cycles on its own is exactly the
    // kind of unprompted motion reduced-motion exists to stop. It settles on
    // the first item and stays there.
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (reduced?.matches) return

    const id = setInterval(() => {
      setFront((f) => (f + 1) % items.length)
    }, CYCLE_MS)
    return () => clearInterval(id)
  }, [visible, items.length])

  return (
    <div ref={wrapRef} style={{ position: 'absolute', inset: 0 }}>
      {items.map((item, i) => {
        // How far back this card sits, 0 at the front. Modulo so the card
        // that just left the front becomes the deepest rather than jumping
        // to a negative depth.
        const depth = (i - front + items.length) % items.length

        return (
          <div
            key={i}
            className='landing-stack-card'
            // A data attribute, not a z-index match in CSS. Matching on the
            // inline style string would also match z-index: 10 the moment
            // there were more than nine of these.
            data-depth={depth === items.length - 1 ? 'last' : 'front'}
            style={{
              position: 'absolute',
              inset: 0,
              // Back cards sit lower and smaller. Down rather than up, so the
              // stack reads as cards laid on a surface rather than floating.
              //
              // 26 and 0.09, up from 16 and 0.055 — at the smaller sheet size
              // the old offsets left the deck looking like one slightly
              // blurred card rather than three.
              transform: `translateY(${depth * 26}px) scale(${1 - depth * 0.09})`,
              // The deepest fades out — it's about to become the front, and
              // seeing it swap contents while visible would break the
              // illusion that these are three separate cards.
              opacity: depth === items.length - 1 ? 0 : 1,
              zIndex: items.length - depth,
              // Top centre, matching the sheet's own centring. A default
              // centre origin would scale the back cards inward AND upward,
              // closing the vertical gap that makes the stack read as a stack.
              transformOrigin: 'top center',
              // Its own layer only while it matters.
              willChange: 'transform, opacity',
            }}
          >
            {item}
          </div>
        )
      })}
    </div>
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
