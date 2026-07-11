'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

const DOTS = [
  // North America
  { id: 1, x: 10, y: 35, flag: '/assets/flags/98.svg' },
  { id: 2, x: 15, y: 42, flag: null },
  { id: 3, x: 20, y: 38, flag: '/assets/flags/106.svg' },
  { id: 4, x: 8, y: 50, flag: null },
  { id: 5, x: 23, y: 55, flag: '/assets/flags/107.svg' },
  { id: 6, x: 18, y: 28, flag: null },
  // South America
  { id: 7, x: 24, y: 65, flag: '/assets/flags/108.svg' },
  { id: 8, x: 27, y: 75, flag: null },
  { id: 9, x: 22, y: 72, flag: null },
  // Europe
  { id: 10, x: 45, y: 22, flag: '/assets/flags/172.svg' },
  { id: 11, x: 48, y: 28, flag: null },
  { id: 12, x: 52, y: 20, flag: null },
  { id: 13, x: 50, y: 32, flag: null },
  { id: 14, x: 43, y: 30, flag: null },
  // Africa
  { id: 15, x: 47, y: 48, flag: '/assets/flags/218.svg' },
  { id: 16, x: 50, y: 58, flag: null },
  { id: 17, x: 45, y: 62, flag: null },
  { id: 18, x: 53, y: 52, flag: null },
  // Middle East
  { id: 19, x: 57, y: 36, flag: '/assets/flags/229.svg' },
  { id: 20, x: 60, y: 40, flag: null },
  // Asia
  { id: 21, x: 65, y: 26, flag: '/assets/flags/250.svg' },
  { id: 22, x: 72, y: 20, flag: null },
  { id: 23, x: 78, y: 28, flag: '/assets/flags/256.svg' },
  { id: 24, x: 75, y: 36, flag: null },
  { id: 25, x: 68, y: 40, flag: null },
  { id: 26, x: 82, y: 22, flag: '/assets/flags/278.svg' },
  { id: 27, x: 85, y: 32, flag: null },
  // Southeast Asia
  { id: 28, x: 78, y: 50, flag: null },
  { id: 29, x: 82, y: 46, flag: null },
  // Australia
  { id: 30, x: 83, y: 65, flag: null },
  { id: 31, x: 87, y: 60, flag: null },
  // Scattered
  { id: 32, x: 35, y: 35, flag: null },
  { id: 33, x: 60, y: 48, flag: null },
  { id: 34, x: 90, y: 42, flag: null },
  { id: 35, x: 55, y: 68, flag: null },
]

const FLAG_DOTS = DOTS.filter((d) => d.flag)
const RADIUS = 18

export default function Map() {
  const [mousePos, setMousePos] = useState(null)
  const [isHovering, setIsHovering] = useState(false)
  const [visibleFlags, setVisibleFlags] = useState(new Set())
  const containerRef = useRef(null)

  // stable per-dot animation values — initialised after mount to avoid SSR mismatch
  const [dotMeta, setDotMeta] = useState(() =>
    DOTS.map(() => ({ delay: 0, duration: 2.5 }))
  )

  useEffect(() => {
    setDotMeta(
      DOTS.map(() => ({
        delay: Math.random() * 4,
        duration: 2.5 + Math.random() * 1.5,
      }))
    )
  }, [])

  // randomly show/hide flags every 2-4 seconds
  useEffect(() => {
    function randomiseFlags() {
      const shuffled = [...FLAG_DOTS].sort(() => Math.random() - 0.5)
      const count = 2 + Math.floor(Math.random() * 2) // show 2-3 at a time
      setVisibleFlags(new Set(shuffled.slice(0, count).map((d) => d.id)))
    }

    randomiseFlags()
    const id = setInterval(randomiseFlags, 3000)
    return () => clearInterval(id)
  }, [])

  const handleMouseMove = useCallback((e) => {
    const rect = containerRef.current.getBoundingClientRect()
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }, [])

  const handleMouseEnter = useCallback(() => setIsHovering(true), [])
  const handleMouseLeave = useCallback(() => {
    setIsHovering(false)
    setMousePos(null)
  }, [])

  function getDotStyle(dot, index) {
    const { delay, duration } = dotMeta[index]

    // proximity calculation
    if (mousePos) {
      const dx = dot.x - mousePos.x
      const dy = dot.y - mousePos.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < RADIUS) {
        const t = 1 - distance / RADIUS
        return {
          ...base(dot, delay, duration),
          opacity: 0.3 + t * 0.7,
          transform: `translate(-50%, -50%) scale(${1 + t * 0.7})`,
          boxShadow:
            t > 0.4
              ? `0 0 ${Math.round(t * 14)}px ${Math.round(t * 5)}px rgba(250,115,25,0.5)`
              : 'none',
          animation: 'none',
          transition:
            'opacity 0.08s ease, transform 0.08s ease, box-shadow 0.08s ease',
        }
      }
    }

    // hovering map but not near this dot — brighter ambient pulse
    if (isHovering) {
      return {
        ...base(dot, delay, duration),
        animation: `dotPulseBright ${duration}s ease-in-out ${delay}s infinite`,
      }
    }

    return base(dot, delay, duration)
  }

  return (
    <div
      className='map-container'
      style={{
        position: 'fixed',
        bottom: 'calc(-50vh)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '1198px',
        maxWidth: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: -1,
      }}
    >
      <img
        src='/assets/map.svg'
        alt=''
        style={{ width: '100%', display: 'block' }}
      />

      {/* Dot + flag layer */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'auto',
        }}
      >
        {DOTS.map((dot, i) => (
          <div
            key={dot.id}
            style={{
              position: 'absolute',
              left: `${dot.x}%`,
              top: `${dot.y}%`,
            }}
          >
            {/* flag popup */}
            {dot.flag && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '14px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--bg-default)',
                  borderRadius: '8px',
                  padding: '4px',
                  boxShadow: 'var(--shadow-md)',
                  opacity: visibleFlags.has(dot.id) ? 1 : 0,
                  transition: 'opacity 0.4s ease',
                  pointerEvents: 'none',
                  lineHeight: 0,
                }}
              >
                <img src={dot.flag} width={24} height={24} alt='' />
              </div>
            )}

            {/* dot */}
            <div
              style={{
                ...getDotStyle(dot, i),
                position: 'relative',
                left: 'auto',
                top: 'auto',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function base(dot, delay, duration) {
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
