'use client'

import Image from 'next/image'
import { useId, useRef } from 'react'
import { Stage } from '@/components/stageshow/stage'
import { Phone } from '@/components/stageshow/phone'
import { Thread, Bubble } from '@/components/stageshow/messages'
import { Count } from '@/components/stageshow/motion/Count'
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

// ─── Use cases ───
// The four jobs under "Here's how you can use Luotain", two by two, each a
// grey panel with a phone rising out of its foot and its copy underneath.
// Each phone is the moment someone meets one of the same café's links, and
// where Luotain counts that moment a chip on the phone's edge says what it
// counted:
//
//   Job         The moment                                   Luotain's side
//   Print       a camera locking onto the code on a table    the table card's scans, +1
//   Campaigns   a tap on the link in the café's story        Instagram's clicks, +1
//   Client      the numbers sent to the owner, and the reply  the screenshot is the report
//   Apps        one link opened on an iPhone and on a Pixel   each lands on its own store
//
// Each plays once as it scrolls in, the right-hand one a beat after the left,
// and again once the pointer settles on its panel (landingmotion.js: a
// replay that has started plays to its end).

// Two compositions. Wide fills a panel at the desktop width of half the
// column: the phone centred, its chip straddling the phone's edge with room
// to. Compact is the narrower one, for tablets and the phone swipe row: the
// phone a gutter from the left and the chip inside the right edge.
const DESIGN = { width: 472, height: 380 }
const COMPACT = { below: 472, width: 320, height: 380 }
// About two thirds of the stage wide, so the iOS type inside reads, and
// cropped by the panel's foot a third of the way down.
const PHONE = 248

// The scroll-in plays each row left to right, a beat apart.
const LEAD = 500
const STEP = 650
// Long enough for a scene's last transition to land, so the run holds its
// lock until then and a replay can't start on top of the one before it.
const SETTLE = 1200
// On a replay, how long the rewind shows before the scene plays again.
const REWIND = 380

const PAINTING = '/assets/websiteimage.png'

// The column is the hover target, not the picture, so hovering the copy
// under a phone plays that phone too.
const caseOf = (node) => node.closest('.lu-case')

function usePicture(first, again) {
  const ref = useRef(null)
  const { script, replay } = useReplay(first, again)
  const engage = useEngage(replay)
  useHoverTarget(ref, engage, caseOf)
  return { ref, script }
}

export function UseCase({ title, picture, children }) {
  return (
    <article className='lu-case'>
      <div className='lu-shot' aria-hidden='true'>
        {picture}
      </div>
      <div className='lu-copy'>
        <h3 className='lu-title'>{title}</h3>
        <p className='lu-text'>{children}</p>
      </div>
    </article>
  )
}

// What Luotain counted, on the phone's corner. The count rolls on when the
// moment lands and drops back without rolling when the scene rewinds: the
// drop is a reset, not news.
function Chip({ icon, label, from, to, on, unit }) {
  return (
    <div className='lu-chip'>
      <span className='lu-chip-icon'>{icon}</span>
      <span className='lu-chip-text'>
        <span className='lu-chip-label'>{label}</span>
        <span className='lu-chip-value'>
          <Count value={on ? to : from} duration={on ? 700 : 0} />
          <span className='lu-chip-unit'>{unit}</span>
        </span>
      </span>
    </div>
  )
}

// The dashboard's own QR glyph (dashboardnav.jsx).
function QrGlyph() {
  return (
    <svg width='20' height='20' viewBox='0 0 20 20' fill='none'>
      <path d='M16.5 16H18V18H16.5V16Z' fill='currentColor' />
      <path d='M15 14H16.5V16H15V14Z' fill='currentColor' />
      <path d='M16.5 12.5H18V14H16.5V12.5Z' fill='currentColor' />
      <path d='M13 16H15V18H13V16Z' fill='currentColor' />
      <path d='M11 12.5H13V16H11V12.5Z' fill='currentColor' />
      <path d='M13 11H16.5V12.5H13V11Z' fill='currentColor' />
      {[
        'M6.5 3H4.5C3.67157 3 3 3.67157 3 4.5V6.5C3 7.32843 3.67157 8 4.5 8H6.5C7.32843 8 8 7.32843 8 6.5V4.5C8 3.67157 7.32843 3 6.5 3Z',
        'M15.5 3H13.5C12.6716 3 12 3.67157 12 4.5V6.5C12 7.32843 12.6716 8 13.5 8H15.5C16.3284 8 17 7.32843 17 6.5V4.5C17 3.67157 16.3284 3 15.5 3Z',
        'M6.5 12H4.5C3.67157 12 3 12.6716 3 13.5V15.5C3 16.3284 3.67157 17 4.5 17H6.5C7.32843 17 8 16.3284 8 15.5V13.5C8 12.6716 7.32843 12 6.5 12Z',
      ].map((d) => (
        <path
          key={d}
          d={d}
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      ))}
    </svg>
  )
}

// ─── Print and packaging ───
// The camera, pointed at the code on a table card. It pulls focus, the
// yellow corners lock onto the code, the link comes up under it, and the
// table card's count goes up by one: the scan was counted against the card
// it came from, not against the café's link in general.

const UNSCANNED = { focus: false, locked: false, counted: false }
const SCANNED = { focus: true, locked: true, counted: true }

async function scan(a) {
  await a.set({ focus: true })
  await a.wait(460)
  await a.set({ locked: true })
  await a.wait(560)
  await a.set({ counted: true })
  await a.wait(SETTLE)
}

async function scanFirst(a) {
  await a.wait(LEAD)
  await scan(a)
}

async function scanAgain(a) {
  await a.wait(REWIND)
  await scan(a)
}

const CORNERS = ['tl', 'tr', 'bl', 'br']

export function ScanPicture() {
  const { ref, script } = usePicture(scanFirst, scanAgain)
  return (
    <div ref={ref} className='lu-picture'>
      <Stage
        width={DESIGN.width}
        height={DESIGN.height}
        compact={COMPACT}
        initial={UNSCANNED}
        poster={SCANNED}
        play='once'
        script={script}
        className='lu-stage'
      >
        {(s) => (
          <>
            <Phone width={PHONE} dark className='lu-phone'>
              <div
                className='lu-cam'
                data-focus={s.focus || undefined}
                data-locked={s.locked || undefined}
              >
                <div className='lu-cam-view'>
                  <div className='lu-cam-scene'>
                    <span className='lu-cam-cup' />
                    <div className='lu-tent'>
                      <span className='lu-tent-name'>Harbor Coffee</span>
                      <span className='lu-tent-code'>
                        <QrCode
                          value='https://www.luotain.app/?qr=table'
                          color='#2b1d14'
                          markerColor='#2b1d14'
                          pattern='square'
                          branding={false}
                          card={148}
                          margin={0}
                          radius={0}
                        />
                        {CORNERS.map((c) => (
                          <i key={c} className='lu-corner' data-at={c} />
                        ))}
                      </span>
                      <span className='lu-tent-line'>Scan for the menu</span>
                    </div>
                  </div>
                  <span className='lu-cam-pill'>luot.link/table</span>
                </div>
              </div>
            </Phone>
            <Chip
              icon={<QrGlyph />}
              label='Table card'
              from={96}
              to={97}
              on={s.counted}
              unit='scans'
            />
          </>
        )}
      </Stage>
    </div>
  )
}

// ─── Campaigns and social ───
// The café's story with its link sticker. The story plays, a finger taps the
// sticker, and Instagram's count goes up by one: the same link in the bio,
// the story and a post would all be one line in Luotain, so each place gets
// a link of its own and the referrer says which one earned the click.

const UNTAPPED = { playing: false, tapped: false }
const TAPPED = { playing: true, tapped: true }

async function tap(a) {
  await a.set({ playing: true })
  await a.wait(700)
  await a.click('sticker')
  await a.set({ tapped: true })
  await a.wait(SETTLE)
}

async function tapFirst(a) {
  await a.wait(LEAD + STEP)
  await tap(a)
}

async function tapAgain(a) {
  await a.wait(REWIND)
  await tap(a)
}

export function StoryPicture() {
  const { ref, script } = usePicture(tapFirst, tapAgain)
  return (
    <div ref={ref} className='lu-picture'>
      <Stage
        width={DESIGN.width}
        height={DESIGN.height}
        compact={COMPACT}
        initial={UNTAPPED}
        poster={TAPPED}
        play='once'
        script={script}
        cursor={{ at: { x: 168, y: 300 }, style: 'touch' }}
        className='lu-stage'
      >
        {(s) => (
          <>
            <Phone width={PHONE} dark className='lu-phone'>
              <div
                className='lu-story'
                data-playing={s.playing || undefined}
              >
                <Image
                  src={PAINTING}
                  alt=''
                  fill
                  sizes='402px'
                  className='lu-story-photo'
                />
                <span className='lu-story-shade' />
                <span className='lu-story-bars'>
                  <i data-done='' />
                  <i data-now='' />
                  <i />
                </span>
                <span className='lu-story-head'>
                  <span className='lu-story-avatar'>
                    <Image
                      src={PAINTING}
                      alt=''
                      fill
                      sizes='40px'
                      className='lu-story-face'
                    />
                  </span>
                  <span className='lu-story-name'>harborcoffee</span>
                  <span className='lu-story-time'>2h</span>
                </span>
                <span className='lu-story-title'>The autumn menu is here</span>
                <span className='lu-sticker' data-target='sticker'>
                  <LinkIcon size={22} />
                  luot.link/autumn
                </span>
              </div>
            </Phone>
            <Chip
              icon={<SourceIcon domain='instagram.com' />}
              label='Instagram'
              from={2140}
              to={2141}
              on={s.tapped}
              unit='clicks'
            />
          </>
        )}
      </Stage>
    </div>
  )
}

// ─── Client work ───
// Messages with the café's owner. The question is how the menu did, the
// answer goes over as a screenshot of the link's report, and that's the
// whole update: the owner types, and the reply says it was enough. The
// screenshot is Luotain's side here, so this phone has no chip.

const ASKED = { sent: false, typing: false, replied: false }
const ANSWERED = { sent: true, typing: false, replied: true }

async function send(a) {
  await a.set({ sent: true })
  await a.wait(1000)
  await a.set({ typing: true })
  await a.wait(1300)
  await a.set({ typing: false, replied: true })
  await a.wait(SETTLE)
}

async function sendFirst(a) {
  await a.wait(LEAD)
  await send(a)
}

async function sendAgain(a) {
  await a.wait(REWIND)
  await send(a)
}

const TREND = [18, 22, 20, 27, 25, 31, 29, 36, 34, 41, 39, 47]
const SPARK = { w: 196, h: 44 }

function trendPath(w, h) {
  const lo = Math.min(...TREND)
  const hi = Math.max(...TREND)
  const pts = TREND.map((v, i) => [
    (i / (TREND.length - 1)) * w,
    h - 3 - ((v - lo) / (hi - lo)) * (h - 8),
  ])
  const line = pts
    .map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join('')
  return { line, area: `${line}L${w} ${h}L0 ${h}Z` }
}

const SPARK_PATH = trendPath(SPARK.w, SPARK.h)

function PhoneGlyph() {
  return (
    <svg width='16' height='16' viewBox='0 0 14 14' fill='none'>
      <rect
        x='3.6'
        y='1.6'
        width='6.8'
        height='10.8'
        rx='1.6'
        stroke='currentColor'
        strokeWidth='1.2'
      />
      <path
        d='M6.2 10.3h1.6'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinecap='round'
      />
    </svg>
  )
}

// The report as it looks in Luotain, cropped to the card: the link, its
// clicks and the change, the week's line, and the three things a client
// asks about (where, on what, from where) as rows. At a screenshot's size
// only the figure has to read; the rows are their icons.
function Screenshot() {
  const id = useId().replace(/:/g, '')
  return (
    <div className='lu-screenshot'>
      <div className='lu-report'>
        <span className='lu-report-link'>
          <LinkIcon size={14} />
          luot.link/autumn
        </span>
        <span className='lu-report-figure'>
          <b>6,505</b>
          <span>clicks</span>
          <em>+18%</em>
        </span>
        <svg
          className='lu-report-spark'
          viewBox={`0 0 ${SPARK.w} ${SPARK.h}`}
          preserveAspectRatio='none'
        >
          <defs>
            <linearGradient id={`${id}-fill`} x1='0' y1='0' x2='0' y2='1'>
              <stop
                offset='0'
                stopColor='var(--primary-base)'
                stopOpacity='0.18'
              />
              <stop
                offset='1'
                stopColor='var(--primary-base)'
                stopOpacity='0'
              />
            </linearGradient>
          </defs>
          <path d={SPARK_PATH.area} fill={`url(#${id}-fill)`} />
          <path
            d={SPARK_PATH.line}
            fill='none'
            stroke='var(--primary-base)'
            strokeWidth='2'
            strokeLinejoin='round'
            strokeLinecap='round'
          />
        </svg>
        <span className='lu-report-rows'>
          <span>
            <CountryFlag country='Nigeria' size={16} />
            <i style={{ width: 92 }} />
          </span>
          <span>
            <PhoneGlyph />
            <i style={{ width: 128 }} />
          </span>
          <span>
            <SourceIcon domain='instagram.com' />
            <i style={{ width: 68 }} />
          </span>
        </span>
      </div>
    </div>
  )
}

function Chevron() {
  return (
    <svg width='30' height='30' viewBox='0 0 30 30' fill='none'>
      <path
        d='M18.5 7 10.5 15l8 8'
        stroke='currentColor'
        strokeWidth='2.6'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export function ThreadPicture() {
  const { ref, script } = usePicture(sendFirst, sendAgain)
  return (
    <div ref={ref} className='lu-picture'>
      <Stage
        width={DESIGN.width}
        height={DESIGN.height}
        compact={COMPACT}
        initial={ASKED}
        poster={ANSWERED}
        play='once'
        script={script}
        className='lu-stage'
      >
        {(s) => (
          <Phone width={PHONE} className='lu-phone'>
            <div className='lu-chat'>
              <div className='lu-chat-head'>
                <span className='lu-chat-back'>
                  <Chevron />
                </span>
                <span className='lu-chat-avatar'>M</span>
                <span className='lu-chat-name'>Maya</span>
              </div>
              <div className='lu-chat-stamp'>
                <b>Today</b> 9:41
              </div>
              <Thread className='lu-thread'>
                <Bubble from='them' tail>
                  How did the autumn menu do?
                </Bubble>
                <div
                  className='ss-bubble-row lu-sent'
                  data-from='me'
                  data-on={s.sent || undefined}
                >
                  <Screenshot />
                </div>
                {(s.typing || s.replied) && (
                  <Bubble from='them' typing={s.typing} tail>
                    Perfect, that&rsquo;s all I need.
                  </Bubble>
                )}
              </Thread>
            </div>
          </Phone>
        )}
      </Stage>
    </div>
  )
}

// ─── Apps ───
// The same link opened on two phones, and each lands on its own store: the
// iPhone on the café app's App Store page, the Pixel on its Google Play page
// (lib/applink.js). Each shows the link loading first, so the store arrives
// as the redirect it is. Compact has room for one phone, the iPhone, and a
// chip says where Android goes instead. No count here: what the job is about
// is where the link sends people, not how many.

const UNOPENED = { open: false }
const OPENED = { open: true }

// The pair is narrower than a lone phone, so two fit the wide panel with the
// Pixel tucked behind the iPhone's edge
const PAIR = 224

async function openStores(a) {
  await a.wait(400)
  await a.set({ open: true })
  await a.wait(SETTLE)
}

async function storesFirst(a) {
  await a.wait(LEAD + STEP)
  await openStores(a)
}

async function storesAgain(a) {
  await a.wait(REWIND)
  await openStores(a)
}

// Both stores show the same icon: it's the same app
function AppIcon({ size }) {
  return (
    <span className='lu-app-icon' style={{ width: size, height: size }}>
      <Image src={PAINTING} alt='' fill sizes='120px' className='lu-app-art' />
    </span>
  )
}

// A store's screenshots: crops of the painting the icon is cut from, so the
// page reads as one app's listing rather than a row of empty frames
function Shots({ crops }) {
  return (
    <div className='lu-store-shots'>
      {crops.map((position) => (
        <span key={position} className='lu-store-shot'>
          <Image
            src={PAINTING}
            alt=''
            fill
            sizes='180px'
            style={{ objectFit: 'cover', objectPosition: position }}
          />
        </span>
      ))}
    </div>
  )
}

// What the phone shows while the link resolves, under the store page
function Loading() {
  return (
    <div className='lu-store-loading'>
      <span className='lu-store-url'>
        <LinkIcon size={22} />
        luot.link/app
      </span>
    </div>
  )
}

function AppStorePage({ open }) {
  return (
    <div className='lu-store' data-store='ios' data-open={open || undefined}>
      <Loading />
      <div className='lu-store-page'>
        <span className='lu-store-nav'>
          <Chevron />
          Search
        </span>
        <div className='lu-store-head'>
          <AppIcon size={118} />
          <div className='lu-store-title'>
            <span className='lu-store-name'>Harbor Coffee</span>
            <span className='lu-store-sub'>Order ahead, skip the line</span>
            <span className='lu-store-get'>Get</span>
          </div>
        </div>
        <div className='lu-store-facts'>
          <span>
            <small>12K ratings</small>
            <b>4.8</b>
            <i>★★★★★</i>
          </span>
          <span>
            <small>Age</small>
            <b>4+</b>
            <i>Years</i>
          </span>
          <span>
            <small>Chart</small>
            <b>No. 3</b>
            <i>Food &amp; Drink</i>
          </span>
        </div>
        <Shots crops={['18% 50%', '56% 50%']} />
      </div>
    </div>
  )
}

function PlayPage({ open }) {
  return (
    <div className='lu-store' data-store='play' data-open={open || undefined}>
      <Loading />
      <div className='lu-store-page'>
        <div className='lu-store-head'>
          <AppIcon size={88} />
          <div className='lu-store-title'>
            <span className='lu-store-name'>Harbor Coffee</span>
            <span className='lu-store-dev'>Harbor Coffee Co.</span>
          </div>
        </div>
        <div className='lu-store-facts'>
          <span>
            <b>4.7 ★</b>
            <small>8K reviews</small>
          </span>
          <span>
            <b>100K+</b>
            <small>Downloads</small>
          </span>
          <span>
            <b>E</b>
            <small>Everyone</small>
          </span>
        </div>
        <span className='lu-store-install'>Install</span>
        <Shots crops={['12% 50%', '44% 50%', '88% 50%']} />
      </div>
    </div>
  )
}

// Compact's stand-in for the Pixel: where Android goes, said on the iPhone's
// edge, low enough to sit over the screenshots rather than the app's name
function AndroidChip() {
  return (
    <div className='lu-chip lu-chip--low'>
      <span className='lu-chip-icon'>
        <SourceIcon domain='play.google.com' />
      </span>
      <span className='lu-chip-text'>
        <span className='lu-chip-label'>On Android</span>
        <span className='lu-chip-value'>Google Play</span>
      </span>
    </div>
  )
}

export function AppPicture() {
  const { ref, script } = usePicture(storesFirst, storesAgain)
  return (
    <div ref={ref} className='lu-picture'>
      <Stage
        width={DESIGN.width}
        height={DESIGN.height}
        compact={COMPACT}
        initial={UNOPENED}
        poster={OPENED}
        play='once'
        script={script}
        className='lu-stage'
      >
        {(s, rect, layout) => (
          <>
            {layout === 'wide' ? (
              <Phone
                width={PAIR}
                frame='android'
                className='lu-phone lu-phone--pixel'
              >
                <PlayPage open={s.open} />
              </Phone>
            ) : null}
            <Phone
              width={layout === 'wide' ? PAIR : PHONE}
              className='lu-phone lu-phone--iphone'
            >
              <AppStorePage open={s.open} />
            </Phone>
            {layout === 'wide' ? null : <AndroidChip />}
          </>
        )}
      </Stage>
    </div>
  )
}
