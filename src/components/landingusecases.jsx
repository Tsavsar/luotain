'use client'

import { useEffect, useRef, useState } from 'react'
import { Stage } from '@/components/stageshow/stage'
import { Bar } from '@/components/stageshow/window'
import { Count } from '@/components/stageshow/motion/Count'
import { Roll } from '@/components/stageshow/motion/Roll'
import { Chart } from '@/components/stageshow/chart'
import SourceIcon from '@/components/sourceicon'
import CountryFlag from '@/components/countryflag'
import './landingusecases.css'

// ─── Use-case pictures ───
// The three wells under "Here's how you can use Luotain", as live Stageshow
// stages in place of the old Figma exports. Each answers its card's copy with
// the part of the product that job lives in:
//
//   Card        The one thing                  On scroll in        On mouse enter
//   Print       scans split by placement       the bars draw in    a scan lands on a placement
//   Campaigns   clicks split by referrer       the bars draw in    a channel surges, the order changes
//   Client      the numbers you'd send         the line draws in   the pointer reads any day off it
//
// They sit in the page's own Card well, which is white like the page, so the
// picture's 16px corners are the shape you see — the same radius as the bento
// above, one figure language for the whole page.
//
// Unlike the bento, these scale with their well (Stage `fill`): the well is a
// fixed aspect ratio that runs from a 290px card in the phone scroller to a
// 460px one in two columns, and a 1:1 picture would leave half of the bigger
// one empty. Designed at the three-column size, where they show 1:1.

// The well's aspect is 256 / 230. A couple of pixels taller than that, so the
// card bleeding off the foot is always cut by the well and never stops a
// hairline short of it.
const DESIGN = { width: 309, height: 280 }

const LEAD = 450
const STEP = 110

// The card is the hover target, not the well — the rule the page's cards
// already follow — so a picture listens on the card it sits in.
function useCardHover(ref, onHover, onMove) {
  const handlers = useRef({ onHover, onMove })
  useEffect(() => {
    handlers.current = { onHover, onMove }
  })
  useEffect(() => {
    const card = ref.current?.closest('.landing-card')
    if (!card) return
    const enter = () => handlers.current.onHover?.(true)
    const leave = () => handlers.current.onHover?.(false)
    const move = (e) => handlers.current.onMove?.(e)
    card.addEventListener('mouseenter', enter)
    card.addEventListener('mouseleave', leave)
    card.addEventListener('mousemove', move)
    return () => {
      card.removeEventListener('mouseenter', enter)
      card.removeEventListener('mouseleave', leave)
      card.removeEventListener('mousemove', move)
    }
  }, [ref])
}

// The well's shape and ground, shared by all three.
function Well({ picture, children }) {
  return (
    <div ref={picture} className='lu-well' aria-hidden='true'>
      {children}
    </div>
  )
}

const grow = (i) => async (a) => {
  await a.wait(LEAD + i * STEP)
  await a.set({ grown: true })
}

// Made once, at module level. A stage restarts its script whenever the
// function it's given changes, and these pictures re-render on every hover —
// a script built in render would reset each one to its first frame mid-scrub.
const GROW = [grow(0), grow(1), grow(2)]
const START = { grown: false }
const GROWN = { grown: true }

// The product's QR glyph, from the hero card's tab.
function QrGlyph() {
  return (
    <svg width='14' height='14' viewBox='0 0 16 16' fill='none' aria-hidden='true'>
      <rect x='2.2' y='2.2' width='4.4' height='4.4' rx='1' stroke='currentColor' strokeWidth='1.3' />
      <rect x='9.4' y='2.2' width='4.4' height='4.4' rx='1' stroke='currentColor' strokeWidth='1.3' />
      <rect x='2.2' y='9.4' width='4.4' height='4.4' rx='1' stroke='currentColor' strokeWidth='1.3' />
      <path d='M9.4 9.4h1.8v1.8H9.4zM12.4 12.4h1.4v1.4h-1.4z' fill='currentColor' />
    </svg>
  )
}

// ─── Print and packaging ───
// One link, a code per placement, and the scans each one earned. Every time
// the pointer comes in, somebody scans one: it counts, its bar moves, and its
// row says so for a beat.

const PLACEMENTS = ['Shop window', 'Flyer', 'Menu card']
const PRINT_SCANS = [1204, 312, 96]
// Which placement the next hover scans: round the quieter ones first.
const PRINT_ORDER = [1, 2, 0]

export function PrintPicture() {
  const picture = useRef(null)
  const [scans, setScans] = useState({ n: PRINT_SCANS, hit: null, turn: 0 })
  useCardHover(picture, (on) => {
    if (!on) return
    setScans((s) => {
      const i = PRINT_ORDER[s.turn % PRINT_ORDER.length]
      return {
        n: s.n.map((v, j) => (j === i ? v + 1 : v)),
        hit: i,
        turn: s.turn + 1,
      }
    })
  })
  // The row's highlight is a beat, not a state.
  useEffect(() => {
    if (scans.hit === null) return
    const id = setTimeout(() => setScans((s) => ({ ...s, hit: null })), 900)
    return () => clearTimeout(id)
  }, [scans.turn]) // eslint-disable-line react-hooks/exhaustive-deps
  const top = Math.max(...scans.n)
  return (
    <Well picture={picture}>
      <Stage
        width={DESIGN.width}
        height={DESIGN.height}
        fill
        initial={START}
        poster={GROWN}
        play='once'
        script={GROW[0]}
        className='lu-stage'
      >
        {(s) => (
          <div className='lu-card lu-card--print'>
            <div className='lu-card-title'>
              <span>Scans by placement</span>
              <Count className='lu-card-total' value={scans.n.reduce((t, v) => t + v, 0)} duration={480} />
            </div>
            {PLACEMENTS.map((label, i) => (
              <div
                key={label}
                className='lu-row'
                data-hit={scans.hit === i || undefined}
              >
                <span className='lu-glyph'>
                  <QrGlyph />
                </span>
                <span className='lu-row-main'>
                  <span className='lu-row-line'>
                    <span className='lu-row-label'>{label}</span>
                    <Count className='lu-row-value' value={scans.n[i]} duration={480} />
                  </span>
                  <span className='lu-track'>
                    <span
                      className='lu-fill'
                      data-lead={scans.n[i] === top || undefined}
                      style={{
                        '--w': s.grown ? scans.n[i] / top : 0,
                        '--i': i,
                      }}
                    />
                  </span>
                </span>
              </div>
            ))}
            {/* The list goes on past the crop: one quiet row says so. */}
            <div className='lu-row lu-row--filler'>
              <span className='lu-glyph' />
              <span className='lu-row-main'>
                <span className='lu-row-line'>
                  <Bar w={64} h={6} tone={3} />
                  <Bar w={22} h={6} tone={2} />
                </span>
                <span className='lu-track' />
              </span>
            </div>
          </div>
        )}
      </Stage>
    </Well>
  )
}

// ─── Campaigns and social ───
// The same link shared in four places, ranked by where the clicks came from.
// Each hover is a surge on one channel, and the rows re-rank to match — the
// order changing is the whole reason to look at a referrer list.

const CHANNELS = ['instagram.com', 'tiktok.com', 'linkedin.com', 'youtube.com']
const CHANNEL_CLICKS = [2140, 1620, 880, 410]
// Chosen so each one changes the order: a challenger overtaking, then the
// leader taking it back.
const SURGES = [
  { i: 1, n: 760 },
  { i: 3, n: 640 },
  { i: 0, n: 420 },
  { i: 2, n: 300 },
]
const ROW = 52

export function CampaignsPicture() {
  const picture = useRef(null)
  const [race, setRace] = useState({ n: CHANNEL_CLICKS, turn: 0, hit: null })
  useCardHover(picture, (on) => {
    if (!on) return
    setRace((r) => {
      const { i, n } = SURGES[r.turn % SURGES.length]
      return {
        n: r.n.map((v, j) => (j === i ? v + n : v)),
        turn: r.turn + 1,
        hit: i,
      }
    })
  })
  // Rank by clicks; each row travels to its place rather than the list
  // re-rendering in a new order, so the overtaking is something you watch.
  const order = race.n
    .map((v, i) => [v, i])
    .sort((a, b) => b[0] - a[0])
    .map(([, i]) => i)
  const rank = (i) => order.indexOf(i)
  const top = race.n[order[0]]
  return (
    <Well picture={picture}>
      <Stage
        width={DESIGN.width}
        height={DESIGN.height}
        fill
        initial={START}
        poster={GROWN}
        play='once'
        script={GROW[1]}
        className='lu-stage'
      >
        {(s) => (
          <div className='lu-card lu-card--race'>
            <div className='lu-card-title'>Clicks by source</div>
            <div className='lu-race' style={{ height: CHANNELS.length * ROW }}>
              {CHANNELS.map((source, i) => (
                <div
                  key={source}
                  className='lu-row lu-row--race'
                  data-hit={race.hit === i || undefined}
                  style={{ transform: `translateY(${rank(i) * ROW}px)` }}
                >
                  <span className='lu-favicon'>
                    <SourceIcon domain={source} />
                  </span>
                  <span className='lu-row-main'>
                    <span className='lu-row-line'>
                      <span className='lu-row-label'>{source}</span>
                      <Count className='lu-row-value' value={race.n[i]} duration={560} />
                    </span>
                    <span className='lu-track'>
                      <span
                        className='lu-fill'
                        data-lead={rank(i) === 0 || undefined}
                        style={{ '--w': s.grown ? race.n[i] / top : 0, '--i': i }}
                      />
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Stage>
    </Well>
  )
}

// ─── Client work ───
// The numbers you'd send someone: a fortnight of clicks, and what's behind
// them. The headline is the readout — run the pointer along the line and it
// reads out the day under it, the way the analytics page does, then returns
// to the total when the pointer leaves.

const DAYS = [312, 356, 341, 402, 388, 451, 430, 498, 476, 541, 520, 590, 566, 634]
const DAY_NAMES = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
]
const TOTAL = DAYS.reduce((n, d) => n + d, 0)
const PLOT_H = 84
// The card's inner width at the design size, so the line meets both edges.
const PLOT_W = DESIGN.width - 32 - 32

// The y of the drawn line at x: a short search along the path's own length,
// so the dot rides the curve under the pointer instead of hopping day to day.
function yOn(path, x) {
  if (!path) return null
  let lo = 0
  let hi = path.getTotalLength()
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (path.getPointAtLength(mid).x < x) lo = mid
    else hi = mid
  }
  return path.getPointAtLength(hi).y
}

export function ClientPicture() {
  const picture = useRef(null)
  const plot = useRef(null)
  const [scrub, setScrub] = useState({ day: null, x: null, y: null })
  useCardHover(
    picture,
    (on) => {
      if (!on) setScrub({ day: null, x: null, y: null })
    },
    (e) => {
      const el = plot.current
      if (!el) return
      const r = el.getBoundingClientRect()
      // Off the plot reads as no day, not the nearest edge one.
      if (e.clientX < r.left || e.clientX > r.right) {
        setScrub((s) => (s.day === null ? s : { day: null, x: null, y: null }))
        return
      }
      // The stage is scaled to its well, so the pointer is read back into the
      // design's own pixels before it touches the chart.
      const x = (e.clientX - r.left) / (r.width / PLOT_W)
      const step = PLOT_W / (DAYS.length - 1)
      const day = Math.max(0, Math.min(DAYS.length - 1, Math.round(x / step)))
      const y = yOn(el.querySelector('.ss-chart__line'), x)
      setScrub({ day, x, y })
    }
  )
  const on = scrub.day !== null
  return (
    <Well picture={picture}>
      <Stage
        width={DESIGN.width}
        height={DESIGN.height}
        fill
        initial={START}
        poster={GROWN}
        play='once'
        script={GROW[2]}
        className='lu-stage'
      >
        {(s) => (
          <div className='lu-card lu-card--client'>
            <div className='lu-readout'>
              <span className='lu-readout-label'>
                <Roll variant='fade'>
                  {on ? DAY_NAMES[scrub.day] : 'Clicks, last 14 days'}
                </Roll>
              </span>
              <span className='lu-readout-value'>
                <Roll stagger={25}>
                  {(on ? DAYS[scrub.day] : TOTAL).toLocaleString('en-US')}
                </Roll>
                <span className='lu-delta' data-hidden={on || undefined}>
                  +18%
                </span>
              </span>
            </div>
            <div ref={plot} className='lu-plot' data-crosshair={on || undefined}>
              <Chart
                data={DAYS}
                width={PLOT_W}
                height={PLOT_H}
                show={s.grown}
                dot={false}
              />
              <span
                className='lu-hair'
                data-on={on || undefined}
                style={{ left: scrub.x ?? 0 }}
              />
              <span
                className='lu-dot'
                data-on={(on && scrub.y !== null) || undefined}
                style={{ left: scrub.x ?? 0, top: scrub.y ?? 0 }}
              />
            </div>
            {/* What's behind the number, in the analytics page's own words:
                where, on what, from where. */}
            <div className='lu-facts'>
              <span className='lu-fact'>
                <span className='lu-fact-flag'>
                  <CountryFlag country='Nigeria' size={14} />
                </span>
                Nigeria
              </span>
              <span className='lu-fact'>Mobile</span>
              <span className='lu-fact'>
                <SourceIcon domain='google.com' />
                google.com
              </span>
            </div>
          </div>
        )}
      </Stage>
    </Well>
  )
}
