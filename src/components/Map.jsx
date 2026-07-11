'use client'

import { useState, useRef, useCallback, useMemo } from 'react'

const DOTS = [
  // North America
  { id: 1, x: 10, y: 35 },
  { id: 2, x: 15, y: 42 },
  { id: 3, x: 20, y: 38 },
  { id: 4, x: 8, y: 50 },
  { id: 5, x: 23, y: 55 },
  { id: 6, x: 18, y: 28 },
  // South America
  { id: 7, x: 24, y: 65 },
  { id: 8, x: 27, y: 75 },
  { id: 9, x: 22, y: 72 },
  // Europe
  { id: 10, x: 45, y: 22 },
  { id: 11, x: 48, y: 28 },
  { id: 12, x: 52, y: 20 },
  { id: 13, x: 50, y: 32 },
  { id: 14, x: 43, y: 30 },
  // Africa
  { id: 15, x: 47, y: 48 },
  { id: 16, x: 50, y: 58 },
  { id: 17, x: 45, y: 62 },
  { id: 18, x: 53, y: 52 },
  // Middle East
  { id: 19, x: 57, y: 36 },
  { id: 20, x: 60, y: 40 },
  // Asia
  { id: 21, x: 65, y: 26 },
  { id: 22, x: 72, y: 20 },
  { id: 23, x: 78, y: 28 },
  { id: 24, x: 75, y: 36 },
  { id: 25, x: 68, y: 40 },
  { id: 26, x: 82, y: 22 },
  { id: 27, x: 85, y: 32 },
  // Southeast Asia
  { id: 28, x: 78, y: 50 },
  { id: 29, x: 82, y: 46 },
  // Australia
  { id: 30, x: 83, y: 65 },
  { id: 31, x: 87, y: 60 },
  // Scattered
  { id: 32, x: 35, y: 35 },
  { id: 33, x: 60, y: 48 },
  { id: 34, x: 90, y: 42 },
  { id: 35, x: 55, y: 68 },
]

const RADIUS = 16

export default function Map() {
  const [mousePos, setMousePos] = useState(null)
  const containerRef = useRef(null)

  // stable per-dot values — never recalculated
  const dotMeta = useMemo(
    () =>
      DOTS.map(() => ({
        delay: Math.random() * 4,
        duration: 2.5 + Math.random() * 1.5,
      })),
    []
  )

  const handleMouseMove = useCallback((e) => {
    const rect = containerRef.current.getBoundingClientRect()
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }, [])

  const handleMouseLeave = useCallback(() => setMousePos(null), [])

  function getDotStyle(dot, index) {
    const { delay, duration } = dotMeta[index]

    // no mouse — let CSS animation run freely
    if (!mousePos) {
      return baseStyle(dot, delay, duration)
    }

    const dx = dot.x - mousePos.x
    const dy = dot.y - mousePos.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance >= RADIUS) {
      return baseStyle(dot, delay, duration)
    }

    // in range — override animation with proximity values
    const t = 1 - distance / RADIUS // 1 at cursor, 0 at edge
    const opacity = 0.2 + t * 0.8 // 0.2 → 1.0
    const scale = 1 + t * 0.7 // 1.0 → 1.7
    const glow =
      t > 0.5
        ? `0 0 ${Math.round(t * 12)}px ${Math.round(t * 4)}px rgba(250, 115, 25, 0.45)`
        : 'none'

    return {
      ...baseStyle(dot, delay, duration),
      opacity,
      transform: `translate(-50%, -50%) scale(${scale})`,
      boxShadow: glow,
      animation: 'none',
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '1198px',
        maxWidth: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <img
        src='/assets/map.svg'
        alt=''
        style={{ width: '100%', display: 'block' }}
      />

      {/* Dot layer */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'auto',
        }}
      >
        {DOTS.map((dot, i) => (
          <div key={dot.id} style={getDotStyle(dot, i)} />
        ))}
      </div>

      {/* Terms */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
          fontSize: '12px',
          color: 'var(--text-soft)',
          fontFamily: 'var(--font-sans)',
          pointerEvents: 'none',
        }}
      >
        By continuing, you agree to our{' '}
        <a
          href='/terms'
          style={{ color: 'var(--text-sub)', pointerEvents: 'auto' }}
        >
          Terms
        </a>{' '}
        and{' '}
        <a
          href='/privacy'
          style={{ color: 'var(--text-sub)', pointerEvents: 'auto' }}
        >
          Privacy Policy
        </a>
        .
      </div>
    </div>
  )
}

function baseStyle(dot, delay, duration) {
  return {
    position: 'absolute',
    left: `${dot.x}%`,
    top: `${dot.y}%`,
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'var(--primary-base)',
    transform: 'translate(-50%, -50%) scale(1)',
    boxShadow: 'none',
    animation: `dotPulse ${duration}s ease-in-out ${delay}s infinite`,
    transition: 'opacity 0.1s ease, transform 0.1s ease, box-shadow 0.1s ease',
    pointerEvents: 'none',
  }
}
