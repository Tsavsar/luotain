// ─── QR design options ───
// The colours and patterns the designer offers.
//
// In a plain lib rather than the component because the API validates against
// this same list — a pattern the renderer doesn't know would silently fall
// back to squares, and an arbitrary colour string could be anything. Server
// routes can't import a 'use client' component without dragging React in with
// it, which is the same reason src/lib/plans.js exists.

export const QR_COLORS = [
  { id: 'black', hex: '#000000' },
  { id: 'pink', hex: '#fb4ba3' },
  { id: 'orange', hex: '#fa7319' },
  { id: 'yellow', hex: '#f6b51e' },
  { id: 'green', hex: '#1fc16b' },
  { id: 'teal', hex: '#22d3bb' },
  { id: 'sky', hex: '#47c2ff' },
  { id: 'blue', hex: '#335cff' },
  { id: 'purple', hex: '#7d52f4' },
]

export const QR_PATTERNS = [
  { id: 'square', label: 'Square' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'dots', label: 'Dots' },
  { id: 'classy', label: 'Classy' },
  { id: 'diamond', label: 'Diamond' },
  { id: 'cross', label: 'Cross' },
]
