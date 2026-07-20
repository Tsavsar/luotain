'use client'

// ─── AnimatedNumber ───
// Splits a value into individual digits that cascade in with a
// stagger. Remounts whenever the value changes (key={value}), which
// is what replays the animation — no manual reflow tricks needed in
// React. Reduced-motion users get the value instantly via the CSS
// media query guard.
export default function AnimatedNumber({ value }) {
  if (value === undefined || value === null) return null

  const chars = String(value).split('')

  return (
    <span key={String(value)} className='t-digit-group is-animating'>
      {chars.map((char, i) => (
        <span
          key={`${i}-${char}`}
          className='t-digit'
          style={{ animationDelay: `calc(var(--digit-stagger) * ${i})` }}
        >
          {char}
        </span>
      ))}
    </span>
  )
}
