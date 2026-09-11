'use client'

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
// Capped at 240, below the artwork's own 256. objectFit: contain was stretching
// it to fill a 323px column — 1.26x the size it was drawn at — which is why the
// illustrations read as oversized rather than as objects sitting on the card.
//
// A notch under the design size, so the card has visible white around the
// artwork rather than the artwork being the card.
const MAX_WIDTH = 240

function Illustration({ file, alt }) {
  return (
    // Centred in the well, both axes. The image is no longer filling it, so
    // something has to place it — and the design has the artwork sitting
    // slightly high, which a flex centre gets closer than a top offset would
    // at every column width.
    <span
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
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
          // Its own size, capped — not 100% of the well. The well is the frame;
          // the artwork sits inside it.
          width: '100%',
          maxWidth: `${MAX_WIDTH}px`,
          height: 'auto',
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
