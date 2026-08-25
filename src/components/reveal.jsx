'use client'

import { useEffect, useRef, useState } from 'react'

// ─── Reveal ───
// Fades a section up as it enters the viewport.
//
// Marketing is the one place a longer, softer animation earns its place: it's
// seen once per visit, not tens of times a day, so the frequency test that
// kills most animation doesn't apply here.
//
// IntersectionObserver rather than a scroll listener — a scroll handler runs on
// every frame of every scroll and this needs to fire once per element.
export default function Reveal({
  children,
  delay = 0,
  as: Tag = 'div',
  ...rest
}) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Anything already on screen at load skips the animation entirely. The hero
    // fading in after the page has painted reads as a slow site, not a polished
    // one — the effect is for things you scroll TO.
    if (el.getBoundingClientRect().top < window.innerHeight) {
      setShown(true)
      return
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          // Disconnected immediately: this fires once, and leaving it attached
          // means an observer per section for the life of the page.
          io.disconnect()
        }
      },
      // Fires a little BEFORE the element is fully visible, so the movement has
      // finished by the time it's properly in view rather than starting then.
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      className='landing-reveal'
      style={{
        opacity: shown ? 1 : 0,
        // 12px, not 40. A large travel distance reads as a slideshow; a small
        // one reads as the page settling.
        transform: shown ? 'translateY(0)' : 'translateY(12px)',
        // Transitions, not keyframes, so an interrupted scroll retargets
        // instead of restarting.
        transition: `opacity 520ms var(--ease-out) ${delay}ms, transform 520ms var(--ease-out) ${delay}ms`,
        // Only while moving. Left on permanently it forces a compositing layer
        // for every section on the page.
        willChange: shown ? 'auto' : 'opacity, transform',
      }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
