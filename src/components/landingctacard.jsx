'use client'

import { Card } from '@/components/cardcontainer'

// ─── Closing card ───
// Node 613:1498. Three analytics cards cascading down-left over the image.
//
// These are the REAL dashboard cards, not a rebuild. The design draws them at
// 290px against the dashboard's full width, so each is scaled rather than
// re-styled — a second set of markup imitating Card would need updating every
// time the real one changed, and would drift the first time it didn't.
const IMAGE = '/websiteimage.png'

// The design's own numbers: each card steps 43.02px left and 39.69px down from
// the one before, later ones on top.
const STACK = [
  { right: 30, top: 8 },
  { right: 73.02, top: 47.69 },
  { right: 116.04, top: 87.38 },
]

// Static sample. Not the mock generator: that produces a fresh random spread
// per render, and a marketing page should show the same numbers to everyone —
// a screenshot that changes between visits reads as a bug.
const DEVICES = {
  Type: [
    { label: 'Desktop', value: 15 },
    { label: 'Mobile', value: 11 },
    { label: 'Tablet', value: 8 },
    { label: 'Smart TV', value: 3 },
    { label: 'Console', value: 2 },
  ],
}

const SOURCES = {
  Visitors: [
    { label: 't.co', value: 32 },
    { label: 'i.instagram.com', value: 12 },
    { label: 'linkedin.com', value: 9 },
    { label: 'direct', value: 1 },
  ],
}

const GEOGRAPHY = {
  Countries: [
    { label: 'Norway', value: 42, country: 'NO' },
    { label: 'United States', value: 21, country: 'US' },
    { label: 'United Kingdom', value: 8, country: 'GB' },
    { label: 'Singapore', value: 1, country: 'SG' },
  ],
}

// 290 / 380 ≈ 0.76. Scaling the real card keeps its internal proportions
// exactly, where re-specifying every inner size at 76% would round differently
// at each step and drift.
const SCALE = 0.76
const CARD_WIDTH = 290

function StackedCard({ right, top, children }) {
  return (
    <div
      style={{
        position: 'absolute',
        right: `${right}px`,
        top: `${top}px`,
        width: `${CARD_WIDTH / SCALE}px`,
        transform: `scale(${SCALE})`,
        // Top right, so the card scales toward its own corner and the `right`
        // offset stays the offset the design specifies. Centre origin would
        // shift every card inward by half its shrinkage.
        transformOrigin: 'top right',
        // Decorative. Nothing in this montage is interactive — the real cards
        // have hover states, filters and copy buttons that would invite clicks
        // that do nothing on a landing page.
        pointerEvents: 'none',
      }}
      aria-hidden='true'
    >
      {children}
    </div>
  )
}

export default function ClosingCard() {
  return (
    <div
      className='landing-closingcard'
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
      {/* Taller than the card and pulled up 16px, as the design has it — the
          halftone is cropped rather than squashed. */}
      <img
        src={IMAGE}
        alt=''
        style={{
          position: 'absolute',
          top: '-16px',
          left: 0,
          right: 0,
          height: '343px',
          width: '100%',
          objectFit: 'cover',
          pointerEvents: 'none',
        }}
      />

      <StackedCard {...STACK[0]}>
        <Card
          title='Devices'
          columnOptions={['Type']}
          showDropdown={false}
          dataByColumn={DEVICES}
        />
      </StackedCard>

      <StackedCard {...STACK[1]}>
        <Card
          title='Sources'
          columnOptions={['Visitors']}
          showDropdown={false}
          dataByColumn={SOURCES}
          iconType='favicon'
        />
      </StackedCard>

      <StackedCard {...STACK[2]}>
        <Card
          title='Geography'
          columnOptions={['Countries']}
          showDropdown={false}
          dataByColumn={GEOGRAPHY}
          iconType='flag'
        />
      </StackedCard>
    </div>
  )
}
