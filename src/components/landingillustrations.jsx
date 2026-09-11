'use client'

import { useEffect, useRef, useState } from 'react'

// ─── Feature illustrations ───
// Exported from Figma at 256×230, matching the card wells exactly.
//
// Served as <img> rather than inlined. The five come to about 560KB of path
// data — the "nothing to install" card alone is 292KB, because three blocks of
// code text got outlined into a few enormous paths. Inlined, that ships in the
// HTML on every request and can't be cached separately; as files, the browser
// caches them and the page stays small.
//
// They're outlined exports, so the type isn't text and the fills are hardcoded
// hex. That's why the landing page is pinned to light — see .landing-lock in
// globals.css. Worth knowing if these ever need to work on a dark background:
// they'd have to be re-exported, not re-styled.

const BASE = '/assets/illustrations'

// One component, because the only thing that differs is which file and what
// the alt text says. Five near-identical components would be five places to
// change when the well size does.
// No cap. I had this at 224, then 240, then 256, on the reasoning that
// scaling past the design size would soften it — which is wrong. These are
// vectors; enlarging them is lossless, and hairlines scaling proportionally is
// correct rather than blurry.
//
// The real constraint is the well. 16px padding, so the artwork nearly fills
// it with just enough inset that it reads as placed rather than cropped.
const PADDING = 16

function Illustration({ file, alt }) {
  const [shown, setShown] = useState(false)
  const ref = useRef(null)

  // Reveals once as it scrolls in. IntersectionObserver rather than a scroll
  // listener — this fires once per card, where a scroll handler runs on every
  // frame of every scroll for eight of them.
  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Anything already on screen at load skips the animation. A grid fading in
    // after the page has painted reads as a slow site; the effect is for cards
    // you scroll TO.
    if (el.getBoundingClientRect().top < window.innerHeight) {
      setShown(true)
      return
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      // Fires a little before it's fully visible, so the movement has finished
      // by the time you're looking at it rather than starting then.
      { rootMargin: '0px 0px -10% 0px', threshold: 0.15 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    // Centred in the well, both axes. The image is no longer filling it, so
    // something has to place it — and the design has the artwork sitting
    // slightly high, which a flex centre gets closer than a top offset would
    // at every column width.
    <span
      ref={ref}
      className='illo-art'
      data-shown={shown ? 'true' : 'false'}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${PADDING}px`,
        boxSizing: 'border-box',
      }}
    >
      <img
        src={`${BASE}/${file}.svg`}
        // Empty alt where the illustration restates the copy beside it — a
        // screen reader reading "three domain fields" after the heading and body
        // have already said it is noise. Where it shows something the copy
        // doesn't, it gets a real description.
        alt={alt || ''}
        width={256}
        height={230}
        // Lazy, since four of the five are below the fold. The eager one is
        // handled at the call site.
        loading='lazy'
        decoding='async'
        draggable={false}
        style={{
          display: 'block',
          // Fills the padded well. The artwork's ratio (256/230) matches the
          // well's, so `contain` leaves no letterboxing either way — but width
          // 100% is what actually makes it scale up.
          width: '100%',
          height: '100%',
          // contain, not cover: these are diagrams at a fixed aspect ratio, and
          // cover would crop their edges at any other ratio.
          objectFit: 'contain',
        }}
      />
    </span>
  )
}

// full-click, not clicks-with-context: the replacement is the complete
// composition rather than the three-row crop.
export function GeographyIllustration() {
  return <Illustration file='full-click' />
}

export function QrIllustration() {
  return <Illustration file='qr-code' />
}

export function ShortenIllustration() {
  return <Illustration file='short-links' />
}

export function DomainIllustration() {
  return <Illustration file='own-domain' />
}

export function NoScriptIllustration() {
  return <Illustration file='nothing-to-install' />
}

// ─── Use cases ───
// Same treatment as the features: 256x230 exports, filling a padded well.

export function PrintIllustration() {
  return <Illustration file='print-and-packaging' />
}

export function CampaignsIllustration() {
  return <Illustration file='campaigns-and-social' />
}

export function ClientWorkIllustration() {
  return <Illustration file='client-work' />
}
