'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Stage } from '@/components/stageshow/stage'
import { Bar } from '@/components/stageshow/window'
import { Count } from '@/components/stageshow/motion/Count'
import { Chart } from '@/components/stageshow/chart'
import { Thread, Bubble, Receipt } from '@/components/stageshow/messages'
import { QrCode } from '@/components/qrdesigner'
import SourceIcon from '@/components/sourceicon'
import CountryFlag from '@/components/countryflag'
import { LinkIcon } from '@/components/landingfeatures'
import {
  useEngage,
  useHoverTarget,
  useReplay,
} from '@/components/landingmotion'
import './landingusecases.css'

// ─── Use-case pictures ───
// The three wells under "Here's how you can use Luotain", as live Stageshow
// stages. Each is a different kind of picture, so the row doesn't read as the
// same widget three times:
//
//   Card        Kind      The one thing                      On scroll in                  When the pointer settles
//   Print       Objects   three printed pieces, one link     put up, their scans counted   put up again, and one is scanned
//   Campaigns   Diagram   four channels into one short link  the routes draw, clicks run   drawn again, and one channel surges
//   Client      Thread    the update is a screenshot         sent, read, answered          the exchange plays again
//
// They sit in the page's own Card well, the same 16px corners as the bento
// above, one figure language for the whole page. Unlike the bento they scale
// with their well (Stage `fill`): the well is a fixed aspect ratio that runs
// from a 290px card in the phone scroller to a 460px one in two columns, and a
// 1:1 picture would leave half of the bigger one empty. Designed at the
// three-column size, where they show 1:1.
//
// The pointer rules are the bento's (landingmotion.js): a card answers once
// the pointer has settled on it, by playing its scene again, and a replay
// that has started plays to its end.

// The well's aspect is 256 / 230. A couple of pixels taller than that, so
// anything bleeding off the foot is always cut by the well and never stops a
// hairline short of it.
const DESIGN = { width: 309, height: 280 }

const LEAD = 450
const STEP = 110

// The card is the hover target, not the well — the rule the page's cards
// already follow — so a picture listens on the card it sits in.
const cardOf = (node) => node.closest('.landing-card')

function useCardEngage(ref, onEngage) {
  const engage = useEngage(onEngage)
  useHoverTarget(ref, engage, cardOf)
}

// The well's shape and ground, shared by all three.
function Well({ picture, children }) {
  return (
    <div ref={picture} className='lu-well' aria-hidden='true'>
      {children}
    </div>
  )
}

// A count that rolls up from nothing when its scene plays, and drops back to
// nothing without rolling when the scene rewinds: the drop is a reset, not
// news, so nobody should have to watch 1,204 count down to zero.
function Tally({ value, on, className }) {
  return (
    <span
      className={`lu-tally${className ? ` ${className}` : ''}`}
      data-on={on || undefined}
    >
      <Count value={on ? value : 0} duration={on ? 900 : 0} />
    </span>
  )
}

// ─── Print and packaging ───
// Three printed pieces for one link, each with a code of its own: a poster
// taped up in the shop window, a folded flyer, a menu card on the table. Under
// each, the scans it has earned, so the picture is the answer to "which one
// do people actually scan". When the pointer settles they're put up again and
// somebody scans one: a camera's corners find its code and its count ticks.

const PIECES = [
  { id: 'window', label: 'Shop window', scans: 1204 },
  { id: 'flyer', label: 'Flyer', scans: 312 },
  { id: 'menu', label: 'Menu card', scans: 96 },
]
// Which piece each replay scans: round the quieter ones first.
const PRINT_ORDER = [1, 2, 0]

const DOWN = { up: false }
const UP = { up: true }

async function printScript(a) {
  await a.wait(LEAD)
  await a.set({ up: true })
}

// Printed codes are black. The colour and the logo are the bento's QR tile's
// story; here the code is just the thing on the paper that gets scanned.
function PrintedCode({ id, size }) {
  return (
    <span className='lu-code'>
      <QrCode
        value={`https://www.luotain.app/?qr=${id}`}
        color='#171717'
        markerColor='#171717'
        pattern='square'
        branding={false}
        card={size}
        margin={0}
        radius={0}
      />
      {/* The camera's corners. Drawn on every code, shown on the one being
          scanned. */}
      <span className='lu-finder'>
        <i />
        <i />
        <i />
        <i />
      </span>
    </span>
  )
}

function Piece({ id }) {
  if (id === 'window') {
    return (
      <div className='lu-paper'>
        <i className='lu-tape lu-tape--l' />
        <i className='lu-tape lu-tape--r' />
        <div className='lu-poster-art'>Open late</div>
        <PrintedCode id={id} size={52} />
      </div>
    )
  }
  if (id === 'flyer') {
    return (
      <div className='lu-paper'>
        <div className='lu-flyer-art' />
        <Bar w={44} h={5} tone={3} />
        <Bar w={58} h={5} tone={2} />
        <PrintedCode id={id} size={44} />
      </div>
    )
  }
  return (
    <div className='lu-paper'>
      <span className='lu-menu-word'>Menu</span>
      <PrintedCode id={id} size={44} />
    </div>
  )
}

export function PrintPicture() {
  const picture = useRef(null)
  const [scans, setScans] = useState({
    n: PIECES.map((p) => p.scans),
    hit: null,
    turn: 0,
  })
  const printAgain = useMemo(
    () => async (a) => {
      await a.wait(380)
      await a.set({ up: true })
      // Once the counts have landed, somebody scans one.
      await a.wait(1200)
      setScans((s) => {
        const i = PRINT_ORDER[s.turn % PRINT_ORDER.length]
        return {
          n: s.n.map((v, j) => (j === i ? v + 1 : v)),
          hit: i,
          turn: s.turn + 1,
        }
      })
      // The run holds until the scan has played, so another can't land on it.
      await a.wait(900)
    },
    []
  )
  const { script, replay } = useReplay(printScript, printAgain)
  useCardEngage(picture, replay)
  // The corners and the +1 are a beat, not a state.
  useEffect(() => {
    if (scans.hit === null) return
    const id = setTimeout(() => setScans((s) => ({ ...s, hit: null })), 1100)
    return () => clearTimeout(id)
  }, [scans.turn]) // eslint-disable-line react-hooks/exhaustive-deps
  const top = Math.max(...scans.n)
  return (
    <Well picture={picture}>
      <Stage
        width={DESIGN.width}
        height={DESIGN.height}
        fill
        initial={DOWN}
        poster={UP}
        play='once'
        script={script}
        className='lu-stage'
      >
        {(s) => (
          <div className='lu-print' data-up={s.up || undefined}>
            {PIECES.map((p, i) => (
              <figure
                key={p.id}
                className={`lu-piece lu-piece--${p.id}`}
                data-hit={scans.hit === i || undefined}
                style={{ '--i': i }}
              >
                {/* The stand carries the putting-up; the paper inside keeps
                    its own tilt, so the two transforms never fight. */}
                <div className='lu-stand'>
                  <Piece id={p.id} />
                </div>
                <figcaption className='lu-label'>
                  <span className='lu-label-name'>{p.label}</span>
                  <span
                    className='lu-label-count'
                    data-lead={scans.n[i] === top || undefined}
                  >
                    <Tally value={scans.n[i]} on={s.up} />
                    <span className='lu-plus'>+1</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </Stage>
    </Well>
  )
}

// ─── Campaigns and social ───
// The same link shared in four places, drawn as where its clicks come from:
// each channel a route into the one short link, clicks running down them. The
// busiest route is the accent, so "which earned the traffic" is the first
// thing you see. When the pointer settles the routes draw again and one
// channel surges, and if it overtakes, the accent moves to it.

const CHANNELS = ['instagram.com', 'tiktok.com', 'linkedin.com', 'youtube.com']
const CHANNEL_CLICKS = [2140, 1620, 880, 410]
// Who surges on each replay, and by how much they end up ahead. The gain is
// worked out from whoever leads at the time, so every surge takes the lead
// and the accent always moves, round after round: the change of leader is
// what a referrer list is for.
const SURGE_ORDER = [1, 3, 0, 2]
const MARGINS = [240, 180, 320, 210]
// Clicks per route on a draw, by the routes' usual share. Fixed rather than
// read off the live counts, so a surge doesn't remount the draw's own clicks.
const DRAW_SPARKS = [3, 3, 1, 1]

const ROUTE_Y = [56, 114, 172, 230]
// The link sits whole inside the well, a gutter short of its right edge: it's
// what the picture is about, so the crop never takes any of it.
const HUB = { x: 170, y: 143 }
// From just past the channel's count to the link's left edge, leaving flat
// and arriving flat so the curves read as routes, not as a fan.
const routeFor = (y) =>
  `M 100 ${y} C 140 ${y} 130 ${HUB.y} ${HUB.x} ${HUB.y}`
const ROUTES = ROUTE_Y.map(routeFor)

const UNDRAWN = { drawn: false }
const DRAWN = { drawn: true }

async function campaignsScript(a) {
  await a.wait(LEAD + STEP)
  await a.set({ drawn: true })
}

// Clicks travelling one route: a few dots, set off a beat apart. Keyed by the
// caller, so a new burst is a new set rather than the old one restarted.
function Sparks({ route, count, gap, delay = 0, lead }) {
  return Array.from({ length: count }, (_, k) => (
    <span
      key={k}
      className='lu-spark'
      data-lead={lead || undefined}
      style={{
        offsetPath: `path('${route}')`,
        animationDelay: `${delay + k * gap}ms`,
      }}
    />
  ))
}

export function CampaignsPicture() {
  const picture = useRef(null)
  const [race, setRace] = useState({ n: CHANNEL_CLICKS, turn: 0, surge: null })
  const campaignsAgain = useMemo(
    () => async (a) => {
      await a.wait(360)
      await a.set({ drawn: true })
      await a.wait(1300)
      setRace((r) => {
        const i = SURGE_ORDER[r.turn % SURGE_ORDER.length]
        const gain =
          Math.max(...r.n) - r.n[i] + MARGINS[r.turn % MARGINS.length]
        return {
          n: r.n.map((v, j) => (j === i ? v + gain : v)),
          turn: r.turn + 1,
          surge: i,
        }
      })
      await a.wait(1100)
    },
    []
  )
  const { script, replay } = useReplay(campaignsScript, campaignsAgain)
  useCardEngage(picture, replay)
  const total = race.n.reduce((t, v) => t + v, 0)
  const lead = race.n.indexOf(Math.max(...race.n))
  return (
    <Well picture={picture}>
      <Stage
        width={DESIGN.width}
        height={DESIGN.height}
        fill
        initial={UNDRAWN}
        poster={DRAWN}
        play='once'
        script={script}
        className='lu-stage'
      >
        {(s) => (
          <div className='lu-flow' data-drawn={s.drawn || undefined}>
            <svg
              className='lu-routes'
              width={DESIGN.width}
              height={DESIGN.height}
              viewBox={`0 0 ${DESIGN.width} ${DESIGN.height}`}
              aria-hidden='true'
            >
              {ROUTES.map((d, i) => (
                <path
                  key={i}
                  d={d}
                  pathLength={1}
                  className='lu-route'
                  data-lead={lead === i || undefined}
                  style={{ '--i': i }}
                />
              ))}
            </svg>

            {/* Mounted with the routes, so every draw sends its own clicks:
                more down the busier routes. The surge is its own burst. */}
            <div className='lu-sparks'>
              {s.drawn
                ? ROUTES.map((d, i) => (
                    <Sparks
                      key={`draw-${i}`}
                      route={d}
                      count={DRAW_SPARKS[i]}
                      gap={260}
                      delay={200 + i * 90}
                      lead={lead === i}
                    />
                  ))
                : null}
              {race.surge !== null ? (
                <Sparks
                  key={`surge-${race.turn}`}
                  route={ROUTES[race.surge]}
                  count={6}
                  gap={90}
                  lead={lead === race.surge}
                />
              ) : null}
            </div>

            {CHANNELS.map((domain, i) => (
              <div
                key={domain}
                className='lu-channel'
                data-lead={lead === i || undefined}
                style={{ top: ROUTE_Y[i] - 16 }}
              >
                <span className='lu-channel-mark'>
                  <SourceIcon domain={domain} />
                </span>
                <Tally className='lu-channel-count' value={race.n[i]} on={s.drawn} />
              </div>
            ))}

            <div
              className='lu-hub'
              style={{ left: HUB.x, top: HUB.y - 17 }}
            >
              <LinkIcon size={16} />
              <span>luot.link/drop</span>
            </div>
            <div className='lu-hub-total' style={{ left: HUB.x + 2, top: HUB.y + 26 }}>
              <Tally className='lu-hub-figure' value={total} on={s.drawn} />
              <span className='lu-hub-unit'>clicks</span>
            </div>
          </div>
        )}
      </Stage>
    </Well>
  )
}

// ─── Client work ───
// "So an update is a screenshot", taken literally: the client asks, you send
// the numbers as a picture, they're read, and that's the end of it. The
// screenshot is the analytics page's own card, which is the claim — what
// Luotain shows is already the thing you'd send. When the pointer settles the
// exchange plays again.

const DAYS = [312, 356, 341, 402, 388, 451, 430, 498, 476, 541, 520, 590, 566, 634]

const QUIET = { sent: false, read: false, typing: false, replied: false }
const ANSWERED = { sent: true, read: true, typing: false, replied: true }

async function exchange(a) {
  await a.set({ sent: true })
  await a.wait(900)
  await a.set({ read: true })
  await a.wait(450)
  await a.set({ typing: true })
  await a.wait(1300)
  await a.set({ typing: false, replied: true })
}

async function clientScript(a) {
  await a.wait(LEAD + STEP * 2)
  await exchange(a)
}

async function clientAgain(a) {
  await a.wait(380)
  await exchange(a)
}

// The analytics card, as a picture of itself: the figure, its change and the
// fortnight's line are real, everything around them is filler.
function Screenshot() {
  return (
    <div className='lu-shot'>
      <div className='lu-shot-head'>
        <Bar w={64} h={5} tone={3} />
      </div>
      <div className='lu-shot-figure'>
        <span>6,505</span>
        <span className='lu-shot-delta'>+18%</span>
      </div>
      <Chart data={DAYS} width={142} height={36} dot={false} />
      <div className='lu-shot-facts'>
        <span className='lu-shot-fact'>
          <CountryFlag country='Nigeria' size={12} />
          <Bar w={26} h={4} tone={2} />
        </span>
        <span className='lu-shot-fact'>
          <SourceIcon domain='google.com' />
          <Bar w={30} h={4} tone={2} />
        </span>
      </div>
    </div>
  )
}

export function ClientPicture() {
  const picture = useRef(null)
  const { script, replay } = useReplay(clientScript, clientAgain)
  useCardEngage(picture, replay)
  return (
    <Well picture={picture}>
      <Stage
        width={DESIGN.width}
        height={DESIGN.height}
        fill
        initial={QUIET}
        poster={ANSWERED}
        play='once'
        script={script}
        className='lu-stage'
      >
        {(s) => (
          // Everything is mounted from the start and shown as it happens, so
          // a replay can fade the exchange back out instead of cutting it.
          <Thread className='lu-thread'>
            <Bubble from='them' tail>
              How did the launch go?
            </Bubble>
            <div
              className='ss-bubble-row lu-shot-row'
              data-from='me'
              data-on={s.sent || undefined}
            >
              <Screenshot />
            </div>
            <Receipt show={s.sent}>{s.read ? 'Read' : 'Delivered'}</Receipt>
            <Bubble
              from='them'
              tail
              typing={!s.replied}
              className='lu-reply'
              data-on={s.typing || s.replied || undefined}
            >
              Perfect, that&rsquo;s all I need.
            </Bubble>
          </Thread>
        )}
      </Stage>
    </Well>
  )
}
