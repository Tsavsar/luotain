'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Stage } from '@/components/stageshow/stage'
import {
  useEngage,
  useHoverTarget,
  useReplay,
} from '@/components/landingmotion'
import { Window, Bar } from '@/components/stageshow/window'
import { Count } from '@/components/stageshow/motion/Count'
import { Collapse } from '@/components/stageshow/motion/Collapse'
import { Roll } from '@/components/stageshow/motion/Roll'
import { States } from '@/components/stageshow/motion/States'
import { Check } from '@/components/stageshow/parts/Check'
import CountryFlag from '@/components/countryflag'
import SourceIcon from '@/components/sourceicon'
import Tag from '@/components/tag'
import GradientAvatar from '@/components/gradientavatar'
import { QrCode } from '@/components/qrdesigner'
import { Heading, Body } from '@/components/landingparts'
import './landingfeatures.css'

// ─── Features ───
// A bento rather than five equal cards. Each tile is a different kind of
// picture, so neighbours never repeat a signal:
//
//   Tile      Span   Kind        The one thing                  On scroll in             When the pointer settles
//   Live      2 × 1  Hero UI     a link's visits arriving       visits land (loops)      a traffic spike
//   Install   1 × 1  Statement   the tags you no longer paste   two lines struck         struck again, then folded away
//   QR        1 × 1  Object      printed codes, designed        the stack is dealt out   dealt again, in the next design
//   Domain    1 × 1  Component   a domain going live            pending to verified      verified again, on a new slug
//   Team      1 × 1  Collection  a workspace of people          a new member sits down   sits down again, everyone lights up
//
// Built on Stageshow (components/stageshow): every picture is its own Stage
// at 1:1, pinned under its copy and cropped by the tile. The copy is page
// text, never inside a stage, so it keeps the page's type size at any width.
//
// The real components are used inside the stages wherever one exists — the
// flags, source favicons, tags, gradient avatars and the QR renderer — so the
// pictures can't drift from the product they describe.
//
// Only the live tile loops. The rest play once as the grid scrolls in, in
// reading order, then hold their last frame until the pointer settles on one,
// which plays its scene again (landingmotion.js has the rules): one thing
// leading, the others answering when asked.

// When the first supporting beat lands after the grid is seen, and the step
// between tiles after it.
const LEAD = 500
const STEP = 110

// ─── The tile ───
// One frame for all five: radius, padding and the copy at the top are shared,
// and the variety lives in the pictures. The whole tile is the hover target,
// copy included, so the picture answers wherever the pointer comes in.
//
// The pictures answer data-engaged, set once the pointer has settled (see
// useEngage), never :hover. :hover lit them up on every pass across the grid.
function Tile({ area, lead, children, picture, dark, engage, engaged }) {
  const ref = useRef(null)
  useHoverTarget(ref, engage)
  return (
    <article
      ref={ref}
      className={`lf-tile lf-tile--${area}`}
      data-dark={dark || undefined}
      data-engaged={engaged || undefined}
    >
      {/* Run-in: the point in --text-strong, the rest in --text-sub, at one
          size and weight. The same two-tone the page's headings use, so the
          tiles read as this page rather than something dropped onto it. */}
      <p className='lf-copy'>
        <span className='lf-lead'>{lead}</span> {children}
      </p>
      {picture}
    </article>
  )
}

// The tile owns the crop. The picture slot is whatever the copy leaves, and
// each stage is drawn at that size: a bleeding window never stops short of
// the tile's edge, and every picture starts one gutter under its copy however
// many lines the copy wraps to at this width.
export function usePictureSize(fallback) {
  const ref = useRef(null)
  const [size, setSize] = useState(fallback)
  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    const measure = () => {
      const r = node.getBoundingClientRect()
      const width = Math.max(1, Math.round(r.width))
      const height = Math.max(1, Math.round(r.height))
      setSize((s) =>
        s.width === width && s.height === height ? s : { width, height }
      )
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return [ref, size]
}

// The product's own link glyph, from the hero card's destination field.
export function LinkIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 20 20'
      fill='none'
      aria-hidden='true'
      style={{ flexShrink: 0 }}
    >
      <path
        d='M8.5 11.5a3.2 3.2 0 0 0 4.8.35l2-2a3.2 3.2 0 0 0-4.5-4.5l-1.1 1.1M11.5 8.5a3.2 3.2 0 0 0-4.8-.35l-2 2a3.2 3.2 0 0 0 4.5 4.5l1.1-1.1'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

// ─── Live (hero) ───
// The link page with its visits arriving. A system story, so no cursor:
// nobody is doing anything, the clicks just come in, and that is the point.

// Static, like the closing card's sample: everyone sees the same visits.
// Cities with real flags in /assets/flags. Scans come in with no referrer —
// a camera doesn't send one — which is why they read as direct.
const VISITS = [
  { city: 'Lagos', country: 'Nigeria', device: 'Mobile', source: 'youtube.com' },
  { city: 'Lisbon', country: 'Portugal', device: 'Mobile', source: null, scan: true },
  { city: 'Toronto', country: 'Canada', device: 'Desktop', source: 'reddit.com' },
  { city: 'Tokyo', country: 'Japan', device: 'Tablet', source: 'x.com' },
  { city: 'Berlin', country: 'Germany', device: 'Mobile', source: null, scan: true },
  { city: 'Nairobi', country: 'Kenya', device: 'Desktop', source: 'news.ycombinator.com' },
  { city: 'São Paulo', country: 'Brazil', device: 'Mobile', source: 'l.instagram.com' },
  { city: 'Accra', country: 'Ghana', device: 'Mobile', source: null, scan: true },
]
const visitFor = (id) => VISITS[id % VISITS.length]

// Rows kept mounted. More than the window shows, so the one that drops off
// the end has already left the crop.
const KEEP = 7

// rows are ids, newest first; `opened` is the newest id whose row has opened,
// so a new row can mount closed and then open, carrying the rest down.
const LIVE_START = { rows: [4, 3, 2, 1, 0], opened: 4, fresh: null, total: 2481 }

// A conveyor: it never rewinds in view. The stage resets it to the start only
// while it's off screen, where nobody sees the numbers go back.
//
// The pointer settling on the tile is a traffic spike. Read straight off the
// page rather than through React state: the script runs outside render and
// only needs to know at the moment it decides how long to wait.
const isHot = () => !!document.querySelector('.lf-tile--live[data-engaged]')

// Waits run in short steps, so a pointer arriving mid-pause brings the next
// visit at once rather than when the old pause runs out — a spike that starts
// a second late reads as unrelated.
async function nap(a, calm, busy) {
  for (let t = 0; t < (isHot() ? busy : calm); t += 100) await a.wait(100)
}

async function liveScript(a) {
  await a.wait(1200)
  for (;;) {
    await a.set((s) => ({ rows: [s.rows[0] + 1, ...s.rows].slice(0, KEEP) }))
    await a.wait(60)
    await a.set((s) => ({ opened: s.rows[0], fresh: s.rows[0] }))
    // The total moves once the row has landed — cause, then effect.
    await a.wait(isHot() ? 220 : 420)
    await a.set((s) => ({ total: s.total + 1 }))
    await nap(a, 1300, 300)
    await a.set({ fresh: null })
    await nap(a, 1100, 100)
  }
}

function Visit({ visit, compact }) {
  return (
    <div className='lf-visit'>
      <span className='lf-flag'>
        <CountryFlag country={visit.country} size={18} />
      </span>
      <span className='lf-place'>
        <span className='lf-city'>{visit.city}</span>
        <span className='lf-country'>{visit.country}</span>
      </span>
      {/* Early in the row, so it's still in view when the tile crops the
          window's right side. */}
      <span className='lf-kind'>
        <Tag
          tone={visit.scan ? 'pending' : 'neutral'}
          label={visit.scan ? 'Scan' : 'Click'}
        />
      </span>
      {compact ? null : (
        <>
          <span className='lf-device'>{visit.device}</span>
          <span className='lf-source'>
            <SourceIcon domain={visit.source} />
            <span>{visit.source || 'Direct'}</span>
          </span>
          <span className='lf-rest'>
            <Bar w={56} h={6} tone={2} />
          </span>
        </>
      )}
    </div>
  )
}

function LinkPage({ s, compact }) {
  return (
    <Window
      url='luotain.app/dashboard/links'
      urlShape='pill'
      className='lf-window'
      data-layout={compact ? 'compact' : 'wide'}
    >
      <div className='lf-page'>
        <div className='lf-linkhead'>
          <span className='lf-linkmark'>
            <LinkIcon />
          </span>
          <span className='lf-linktext'>
            <span className='lf-linkname'>luot.link/launch</span>
            <Bar w={128} h={6} tone={2} />
          </span>
          <Tag tone='success' label='Live' pulse />
        </div>

        {/* One number gets to be big. Everything else is a line. */}
        <div className='lf-total'>
          <Count value={s.total} className='lf-total-figure' duration={620} />
          <span className='lf-total-label'>clicks and scans this week</span>
        </div>

        <div className='lf-feed'>
          {s.rows.map((id) => (
            <Collapse key={id} open={id <= s.opened} reveal='clip'>
              <div
                className='lf-visit-wrap'
                data-fresh={id === s.fresh || undefined}
              >
                <Visit visit={visitFor(id)} compact={compact} />
              </div>
            </Collapse>
          ))}
        </div>
      </div>
    </Window>
  )
}

function Live() {
  const [picture, { width, height }] = usePictureSize({ width: 634, height: 320 })
  // Below this the device and source columns would be cut by the tile, and a
  // cut word reads as a mistake rather than a crop. The compact row keeps the
  // place and the scan-or-click, which is the part the story needs.
  const compact = width < 520
  const engage = useEngage()
  return (
    <Tile
      area='live'
      engage={engage}
      engaged={engage.engaged}
      lead='Every click, with context.'
      picture={
        <div ref={picture} className='lf-picture' aria-hidden='true'>
          <Stage
            width={width}
            height={height}
            initial={LIVE_START}
            poster={LIVE_START}
            play='once'
            script={liveScript}
            className='lf-stage'
          >
            {(s) => <LinkPage s={s} compact={compact} />}
          </Stage>
        </div>
      }
    >
      Country, city, device and source on every visit, the moment it lands.
    </Tile>
  )
}

// ─── Install (statement) ───
// What the page doesn't need any more, as the diff that removes it. The one
// inverted tile in the grid, so it punctuates the row rather than matching it.
// When the pointer settles, the diff plays again and this time finishes the
// job: the struck lines fold away and leave the link on its own.

// Widths for the lines after the diff: varied, and indented every so often,
// the way markup is.
const FILLER_LINES = [92, 64, 118, 48, 86, 72, 104, 56]

const INSTALL_START = { struck: 0, added: false, folded: false }
const INSTALL_END = { struck: 2, added: true, folded: false }

async function strike(a) {
  await a.set({ struck: 1 })
  await a.wait(320)
  await a.set({ struck: 2 })
  await a.wait(520)
  await a.set({ added: true })
}

async function installScript(a) {
  await a.wait(LEAD + STEP)
  await strike(a)
}

// Long enough for the strikes to draw back before they're struck again.
async function installAgain(a) {
  await a.wait(420)
  await strike(a)
  await a.wait(560)
  await a.set({ folded: true })
}

function CodeLine({ n, mark, struck, children }) {
  return (
    <div className='lf-line' data-struck={struck || undefined}>
      <span className='lf-line-n'>{n}</span>
      <span className='lf-line-mark' data-mark={mark || undefined}>
        {mark === 'del' ? '−' : mark === 'add' ? '+' : ''}
      </span>
      <span className='lf-line-text'>
        {children}
        <span className='lf-strike' />
      </span>
    </div>
  )
}

function Install() {
  const [picture, { width, height }] = usePictureSize({ width: 309, height: 300 })
  const { script, replay, cueing } = useReplay(installScript, installAgain)
  const engage = useEngage(replay)
  const engaged = engage.engaged && !cueing
  return (
    <Tile
      area='install'
      dark
      lead='Nothing to install.'
      engage={engage}
      engaged={engaged}
      picture={
        <div ref={picture} className='lf-picture' aria-hidden='true'>
          <Stage
            width={width}
            height={height}
            initial={INSTALL_START}
            poster={INSTALL_END}
            play='once'
            script={script}
            className='lf-stage'
          >
            {(s) => {
              // Folded only at the end of a replay, after they've been struck
              // and the link is in: folding away lines that haven't been
              // marked would delete them without saying why. Leaving unfolds
              // them, back to the diff the tile rests on.
              const clean = engaged && s.folded
              return (
                <div className='lf-code'>
                  <div className='lf-code-tab'>index.html</div>
                  <div className='lf-code-body'>
                    <Collapse open={!clean} reveal='clip'>
                      <CodeLine n={12} mark={s.struck >= 1 ? 'del' : null} struck={s.struck >= 1}>
                        {'<script src="gtag.js">'}
                      </CodeLine>
                      <CodeLine n={13} mark={s.struck >= 2 ? 'del' : null} struck={s.struck >= 2}>
                        {'<div id="consent">'}
                      </CodeLine>
                    </Collapse>
                    <Collapse open={s.added} reveal='clip'>
                      <div className='lf-line-add'>
                        <CodeLine n={14} mark='add'>
                          luot.link/menu
                        </CodeLine>
                      </div>
                    </Collapse>
                    {/* The rest of the file, as filler, so the panel reads as
                        an editor running off the tile rather than a box with
                        three lines in it. */}
                    {FILLER_LINES.map((w, i) => (
                      <div key={i} className='lf-line lf-line--filler'>
                        <span className='lf-line-n'>{15 + i}</span>
                        <span className='lf-line-mark' />
                        <Bar w={w} h={6} tone={2} style={{ marginLeft: i % 3 ? 16 : 0 }} />
                      </div>
                    ))}
                  </div>
                </div>
              )
            }}
          </Stage>
        </div>
      }
    >
      No script, no cookies, no consent banner. The link does the measuring.
    </Tile>
  )
}

// ─── QR (object) ───
// Paper, so the one place a tilt earns its keep: three codes for one link, in
// three designs. The top card names its design. When the pointer settles the
// hand gathers up and is dealt again, the top card in the next design — the
// designer's patterns and colours, one at a time, on something you'd actually
// print.
//
// They encode the real site rather than slugs that don't exist, so anyone who
// scans one off the page lands somewhere instead of a 404.

const DESIGNS = [
  { name: 'Classy', color: '#171717', marker: '#fa7319', pattern: 'classy' },
  { name: 'Diamond', color: '#7d52f4', marker: '#7d52f4', pattern: 'diamond' },
  { name: 'Dots', color: '#fa7319', marker: '#171717', pattern: 'dots' },
  { name: 'Cross', color: '#1fc16b', marker: '#171717', pattern: 'cross' },
]

const BACK_CARDS = [
  { id: 'menu', color: '#335cff', marker: '#335cff', pattern: 'rounded', angle: -7, x: -46, y: 18 },
  { id: 'flyer', color: '#fb4ba3', marker: '#171717', pattern: 'square', angle: 6, x: 44, y: 10 },
]

const QR_START = { fanned: false }
const QR_END = { fanned: true }

async function qrScript(a) {
  await a.wait(LEAD + STEP * 2)
  await a.set({ fanned: true })
}

function QrStack({ s, design }) {
  const cur = DESIGNS[design.cur]
  return (
    <div className='lf-qr' data-fanned={s.fanned || undefined}>
      {BACK_CARDS.map((c, i) => (
        <div
          key={c.id}
          className='lf-qr-card'
          style={{ '--angle': `${c.angle}deg`, '--x': `${c.x}px`, '--y': `${c.y}px`, '--i': i }}
        >
          <QrCode
            value={`https://www.luotain.app/?qr=${c.id}`}
            color={c.color}
            markerColor={c.marker}
            pattern={c.pattern}
            branding={false}
            card={116}
            margin={4}
            radius={4}
          />
          <div className='lf-qr-label'>
            <Bar w={c.id === 'menu' ? 54 : 70} h={6} tone={3} />
            <Bar w={40} h={5} tone={2} />
          </div>
        </div>
      ))}

      <div
        className='lf-qr-card'
        data-top
        style={{ '--angle': '-2deg', '--x': '0px', '--y': '0px', '--i': 2 }}
      >
        {/* The outgoing design stays underneath while the new one fades in
            over it, so the card never shows an empty frame between them. */}
        <div className='lf-qr-face'>
          {design.prev !== null ? (
            <div className='lf-qr-layer' key={`prev-${design.prev}`}>
              <QrCode
                value='https://www.luotain.app/?qr=window'
                color={DESIGNS[design.prev].color}
                markerColor={DESIGNS[design.prev].marker}
                pattern={DESIGNS[design.prev].pattern}
                branding
                card={116}
                margin={4}
                radius={4}
              />
            </div>
          ) : null}
          <div
            className='lf-qr-layer'
            data-new={design.prev !== null || undefined}
            key={`cur-${design.cur}`}
          >
            <QrCode
              value='https://www.luotain.app/?qr=window'
              color={cur.color}
              markerColor={cur.marker}
              pattern={cur.pattern}
              branding
              card={116}
              margin={4}
              radius={4}
            />
          </div>
        </div>
        <div className='lf-qr-label'>
          <span className='lf-qr-name'>
            <Roll variant='fade'>{cur.name}</Roll>
          </span>
          <span className='lf-qr-swatches'>
            <span className='lf-qr-swatch' style={{ background: cur.color }} />
            <span className='lf-qr-swatch' style={{ background: cur.marker }} />
            <span className='lf-qr-logo'>with logo</span>
          </span>
        </div>
      </div>
    </div>
  )
}

function Qr() {
  const [picture, { height }] = usePictureSize({ width: 309, height: 250 })
  const [design, setDesign] = useState({ cur: 0, prev: null })
  // Drop the outgoing layer once the new one has covered it.
  useEffect(() => {
    if (design.prev === null) return
    const id = setTimeout(() => setDesign((d) => ({ ...d, prev: null })), 520)
    return () => clearTimeout(id)
  }, [design])
  // The next design turns up as the hand is dealt, not the moment the pointer
  // lands, so the change and the deal are one gesture.
  const qrAgain = useMemo(
    () => async (a) => {
      await a.wait(420)
      setDesign((d) => ({ cur: (d.cur + 1) % DESIGNS.length, prev: d.cur }))
      await a.set({ fanned: true })
    },
    []
  )
  const { script, replay, cueing } = useReplay(qrScript, qrAgain)
  const engage = useEngage(replay)
  return (
    <Tile
      area='qr'
      lead='Codes worth printing.'
      engage={engage}
      engaged={engage.engaged && !cueing}
      picture={
        // A centred composition on a canvas wider than any tile, so the tile's
        // sides only ever crop empty ground.
        <div ref={picture} className='lf-picture' aria-hidden='true'>
          <div className='lf-canvas'>
            <Stage
              width={360}
              height={height}
              initial={QR_START}
              poster={QR_END}
              play='once'
              script={script}
              className='lf-stage'
            >
              {(s) => <QrStack s={s} design={design} />}
            </Stage>
          </div>
        </div>
      }
    >
      Your colours, your pattern, your logo, at any size.
    </Tile>
  )
}

// ─── Domain (component) ───
// The domain row as the settings page has it, going from pending to verified,
// with the link it unlocks arriving over the card's quiet lower half. When the
// pointer settles it verifies again and the link comes back on the next slug —
// the domain holds still, which is the point: every link after this one
// carries it too.

const SLUGS = ['spring', 'menu', 'jobs', 'press']

const DOMAIN_START = { phase: 'pending', link: false }
const DOMAIN_END = { phase: 'verified', link: true }

// `beforeLink` runs as the link is about to show, while it's still hidden.
async function verify(a, beforeLink) {
  await a.set({ phase: 'checking' })
  await a.wait(900)
  await a.set({ phase: 'verified' })
  await a.wait(480)
  beforeLink?.()
  await a.set({ link: true })
}

async function domainScript(a) {
  await a.wait(LEAD + STEP * 3)
  await verify(a)
}

function GlobeIcon() {
  return (
    <svg width='16' height='16' viewBox='0 0 16 16' fill='none' aria-hidden='true'>
      <circle cx='8' cy='8' r='6.25' stroke='currentColor' strokeWidth='1.3' />
      <path
        d='M1.75 8h12.5M8 1.75c1.7 1.8 2.5 3.9 2.5 6.25S9.7 12.45 8 14.25C6.3 12.45 5.5 10.35 5.5 8S6.3 3.55 8 1.75Z'
        stroke='currentColor'
        strokeWidth='1.3'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function Domain() {
  const [picture, { width, height }] = usePictureSize({ width: 309, height: 260 })
  const [slug, setSlug] = useState(0)
  // The slug moves on while the link is away, so it comes back as the next
  // link rather than rolling over in front of you on its way out.
  const domainAgain = useMemo(
    () => async (a) => {
      await a.wait(320)
      await verify(a, () => setSlug((i) => (i + 1) % SLUGS.length))
    },
    []
  )
  const { script, replay, cueing } = useReplay(domainScript, domainAgain)
  const engage = useEngage(replay)
  return (
    <Tile
      area='domain'
      lead='Your own domain.'
      engage={engage}
      engaged={engage.engaged && !cueing}
      picture={
        <div ref={picture} className='lf-picture' aria-hidden='true'>
          <Stage
            width={width}
            height={height}
            initial={DOMAIN_START}
            poster={DOMAIN_END}
            play='once'
            script={script}
            className='lf-stage'
          >
            {(s) => (
              <div className='lf-domain'>
                <div className='lf-domain-card'>
                  <div className='lf-domain-row'>
                    <span className='lf-domain-icon'>
                      <GlobeIcon />
                    </span>
                    <span className='lf-domain-name'>go.acme.co</span>
                    <States
                      value={s.phase === 'verified' ? 'verified' : 'pending'}
                      align='end'
                      className='lf-domain-status'
                      states={{
                        pending: <Tag tone='pending' label='Pending' pulse />,
                        verified: <Tag tone='success' label='Verified' />,
                      }}
                    />
                  </div>
                  <div className='lf-domain-record'>
                    <span className='lf-domain-type'>CNAME</span>
                    <Bar w={112} h={6} tone={3} />
                    <Check
                      className='lf-domain-check'
                      size={16}
                      pending={s.phase === 'checking'}
                      on={s.phase === 'verified'}
                    />
                  </div>
                  <div className='lf-domain-record lf-domain-record--filler'>
                    <Bar w={34} h={6} tone={2} />
                    <Bar w={84} h={6} tone={2} />
                  </div>
                  <div className='lf-domain-record lf-domain-record--filler'>
                    <Bar w={34} h={6} tone={2} />
                    <Bar w={60} h={6} tone={2} />
                  </div>
                </div>

                <div className='lf-domain-link' data-on={s.link || undefined}>
                  <LinkIcon size={16} />
                  <span className='lf-domain-url'>
                    go.acme.co/
                    <Roll className='lf-domain-slug'>{SLUGS[slug]}</Roll>
                  </span>
                </div>
              </div>
            )}
          </Stage>
        </div>
      }
    >
      Links carry your name, not ours.
    </Tile>
  )
}

// ─── Team (collection) ───
// A workspace of people as a field of the app's own gradient avatars, off every
// edge. One seat is open, and the new member takes it — the only one with
// words, lifted on a card the way the team page lists them. When the pointer
// settles they take the seat again, and once they're down the field lights up
// outward from them: the whole team, not just the newest.

const SEATS = 7
const ROWS = 4
// The middle column, so the card under the open seat has room on both sides
// at the narrowest tile.
const OPEN = { col: 3, row: 1 }
const SEED = 'luotain-team'

const TEAM_START = { joined: false }
const TEAM_END = { joined: true }

async function teamScript(a) {
  await a.wait(LEAD + STEP * 4)
  await a.set({ joined: true })
}

// Long enough for the seat to be seen empty before it's taken again.
async function teamAgain(a) {
  await a.wait(560)
  await a.set({ joined: true })
}

function Team() {
  const [picture, { height }] = usePictureSize({ width: 309, height: 250 })
  const { script, replay, cueing } = useReplay(teamScript, teamAgain)
  const engage = useEngage(replay)
  return (
    <Tile
      area='team'
      lead='Bring your team.'
      engage={engage}
      engaged={engage.engaged && !cueing}
      picture={
        <div ref={picture} className='lf-picture' aria-hidden='true'>
          <div className='lf-canvas lf-canvas--team'>
            <Stage
              width={420}
              height={height}
              initial={TEAM_START}
              poster={TEAM_END}
              play='once'
              script={script}
              className='lf-stage'
            >
              {(s) => (
                <div className='lf-team' data-joined={s.joined || undefined}>
                  <div className='lf-seats'>
                    {Array.from({ length: SEATS * ROWS }, (_, i) => {
                      const col = i % SEATS
                      const row = Math.floor(i / SEATS)
                      // Rings out from the open seat, for the hover ripple.
                      const ring = Math.max(
                        Math.abs(col - OPEN.col),
                        Math.abs(row - OPEN.row)
                      )
                      return col === OPEN.col && row === OPEN.row ? (
                        <span key={i} className='lf-seat lf-seat--open'>
                          <span className='lf-seat-ring' />
                          <span className='lf-seat-face'>
                            <GradientAvatar seed='ada-okafor' name='Ada' size={52} />
                          </span>
                        </span>
                      ) : (
                        <span key={i} className='lf-seat' style={{ '--ring': ring }}>
                          <GradientAvatar seed={`${SEED}-${i}`} size={52} showInitial={false} />
                        </span>
                      )
                    })}
                  </div>
                  <div className='lf-member'>
                    <span className='lf-member-name'>Ada Okafor</span>
                    <span className='lf-member-role'>Admin</span>
                  </div>
                </div>
              )}
            </Stage>
          </div>
        </div>
      }
    >
      One workspace, every link shared, a role for everyone.
    </Tile>
  )
}

export default function LandingFeatures() {
  return (
    <section id='features' className='lf'>
      <div className='lf-head'>
        <Heading size={24} lead='The whole link,'>
          not just the redirect.
        </Heading>
        <Body width={360}>
          Shortening is the easy part. What happens after is the rest.
        </Body>
      </div>

      <div className='lf-grid'>
        <Live />
        <Install />
        <Qr />
        <Domain />
        <Team />
      </div>
    </section>
  )
}
