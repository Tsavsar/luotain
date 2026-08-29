'use client'

import CountryFlag from '@/components/countryflag'
import SourceIcon from '@/components/sourceicon'
import { QrCode } from '@/components/qrdesigner'

// ─── Feature illustrations ───
//
// Real data rather than skeleton bars — a wireframe reads as unfinished, a
// populated list reads as a product people already use.
//
// But each one has its OWN SHAPE. Eight cards showing the same ranked list is
// eight cards saying the same thing, whatever the labels are. A list, an
// object, a before/after, a comparison, a summary: the structure should carry
// as much of the meaning as the copy does.
//
// And the accent appears on four of the eight. Orange on every card is orange
// on none of them.

// A line of text inside an illustration. Not actually monospaced — it's the
// app's own sans — but it plays the role monospace usually does here: small,
// literal, quiet.
function Mono({ children, size = 10, tone = 'sub', strike = false }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: `${size}px`,
        fontWeight: tone === 'strong' ? 500 : 400,
        lineHeight: `${Math.round(size * 1.35)}px`,
        letterSpacing: `${size * 0.02}px`,
        fontVariantNumeric: 'tabular-nums',
        color:
          tone === 'accent'
            ? 'var(--primary-base)'
            : tone === 'strong'
              ? 'var(--text-strong)'
              : 'var(--text-sub)',
        textDecoration: strike ? 'line-through' : 'none',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {children}
    </span>
  )
}

function Tag({ children }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 6px',
        borderRadius: '4px',
        background: 'var(--primary-base)',
        color: 'var(--bg-default)',
        fontFamily: 'var(--font-sans)',
        fontWeight: 500,
        fontSize: '8px',
        lineHeight: '11px',
        letterSpacing: '0.16px',
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  )
}

// An endlessly scrolling column. The children are rendered TWICE and the
// track moves up by half its own height — at the moment the first copy has
// fully left, the second is exactly where the first started, so there's no
// visible seam.
//
// aria-hidden on the duplicate: it's the same content, and a screen reader
// shouldn't hear the list twice.
function Marquee({ children }) {
  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        flex: '1 0 0',
        minHeight: 0,
      }}
    >
      <div className='illo-marquee'>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            paddingBottom: '5px',
          }}
        >
          {children}
        </div>
        <div
          aria-hidden='true'
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            paddingBottom: '5px',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

// A row: icon, label, and a right-aligned figure. The whole grammar.
function Row({ icon, label, value, accent }) {
  return (
    <div
      className='illo-row'
      data-accent={accent ? 'true' : 'false'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
        padding: '7px 9px',
        borderRadius: '7px',
        background: accent ? 'rgba(250, 115, 25, 0.08)' : 'transparent',
        boxShadow: accent ? 'inset 0 0 0 1px rgba(250, 115, 25, 0.35)' : 'none',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {icon ? (
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '15px',
            height: '15px',
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
      ) : null}

      <span
        style={{
          flex: '1 0 0',
          minWidth: 0,
          fontFamily: 'var(--font-sans)',
          fontSize: '11px',
          lineHeight: '15px',
          letterSpacing: '0.22px',
          color: 'var(--text-sub)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>

      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 500,
          fontSize: '11px',
          lineHeight: '15px',
          letterSpacing: '0.22px',
          // Tabular figures, so the numbers align down the right edge instead
          // of shifting with each digit's width.
          fontVariantNumeric: 'tabular-nums',
          color: accent ? 'var(--primary-base)' : 'var(--text-strong)',
          flexShrink: 0,
        }}
      >
        {value}
      </span>
    </div>
  )
}

// The panel. Fills the well and runs PAST the bottom, with a fade over the
// last rows — that's what says the list continues rather than ending.
function Panel({ children, pad = 10, bleed = true }) {
  return (
    <div
      className='illo-panel'
      style={{
        position: 'absolute',
        top: '14px',
        left: '14px',
        right: '14px',
        // The ranked list runs past the bottom on purpose — it's the one that
        // should look like it continues. The composed ones fit their frame,
        // because a cropped composition just looks cut off.
        bottom: bleed ? '-40px' : '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        padding: `${pad}px`,
        borderRadius: '11px',
        background: 'var(--bg-default)',
        boxShadow: '0 2px 12px rgba(23, 23, 23, 0.06)',
        boxSizing: 'border-box',
        overflow: 'hidden',
        // Fades into the well rather than being cut by it — a hard crop reads
        // as clipping, a fade reads as depth.
        maskImage: bleed
          ? 'linear-gradient(to bottom, #000 68%, transparent 100%)'
          : undefined,
        WebkitMaskImage: bleed
          ? 'linear-gradient(to bottom, #000 68%, transparent 100%)'
          : undefined,
      }}
    >
      {children}
    </div>
  )
}

// ─── Clicks with context ───
// The only one that IS a list. It's the feature about ranked data, so it gets
// the ranked-data shape and the others don't.
export function GeographyIllustration() {
  const rows = [
    ['Norway', '1,204', true],
    ['United States', '892'],
    ['United Kingdom', '431'],
    ['Germany', '308'],
    ['Singapore', '187'],
    ['Canada', '142'],
    ['Australia', '96'],
    ['Netherlands', '74'],
  ]
  return (
    <Panel>
      {rows.map(([label, value, accent]) => (
        <Row
          key={label}
          label={label}
          value={value}
          accent={accent}
          icon={<CountryFlag country={label} size={15} />}
        />
      ))}
    </Panel>
  )
}

// ─── A QR code with every link ───
// An object, not data: the code itself with the palette that made it.
export function QrIllustration() {
  const SWATCHES = ['#171717', '#fa7319', '#2563eb', '#16a34a', '#7c3aed']
  return (
    <Panel pad={14} bleed={false}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <QrCode
          value='https://luot.link/k3mq7t'
          card={116}
          margin={9}
          color='#171717'
          markerColor='#fa7319'
          pattern='rounded'
          branding={false}
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          {SWATCHES.map((hex, i) => (
            <span
              key={hex}
              style={{
                width: '18px',
                height: '18px',
                borderRadius: 'var(--radius-full)',
                background: hex,
                boxShadow:
                  i === 1
                    ? '0 0 0 2px var(--bg-default), 0 0 0 3.5px var(--primary-base)'
                    : 'none',
              }}
            />
          ))}
        </div>
      </div>
    </Panel>
  )
}

// ─── Control where it goes ───
// A before and after. One link, its destination replaced — the code above it
// unchanged, which is the whole claim.
export function DestinationIllustration() {
  return (
    <Panel pad={14} bleed={false}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        {/* The code sits above, unchanged, while the destination beneath it
            is replaced — which is precisely the claim. Without it this is just
            two URLs. */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <QrCode
            value='https://luot.link/spring-menu'
            card={52}
            margin={4}
            color='#171717'
            markerColor='#171717'
            pattern='square'
            branding={false}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              minWidth: 0,
            }}
          >
            <Mono size={12} tone='strong'>
              luot.link/spring-menu
            </Mono>
            <Mono size={9}>unchanged</Mono>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '7px',
            paddingTop: '2px',
          }}
        >
          <div
            style={{
              padding: '9px 11px',
              borderRadius: '8px',
              background: 'var(--bg-surface)',
              opacity: 0.6,
            }}
          >
            {/* Struck through: this is what it USED to point at. */}
            <Mono size={10} strike>
              acme.co/menu/winter-2025
            </Mono>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 11px',
              borderRadius: '8px',
              background: 'rgba(250, 115, 25, 0.08)',
              boxShadow: 'inset 0 0 0 1px rgba(250, 115, 25, 0.35)',
            }}
          >
            <Mono size={10} tone='strong'>
              acme.co/menu/spring
            </Mono>
            <span style={{ flex: '1 0 0' }} />
            <Tag>Live</Tag>
          </div>
        </div>
      </div>
    </Panel>
  )
}

// ─── Your own domain ───
// A workspace with several domains, scrolling forever. The feature isn't one
// domain — it's that you can bring as many as you like — and a list that never
// runs out says that better than a single example does.
export function DomainIllustration() {
  const domains = [
    ['go.yourbrand.com', 'Verified', true],
    ['links.acme.co', 'Verified'],
    ['s.northwind.io', 'Verified'],
    ['on.parcel.dev', 'Pending'],
    ['go.meridian.studio', 'Verified'],
    ['l.fieldnotes.co', 'Verified'],
    ['short.atlas.app', 'Pending'],
    ['go.harbour.design', 'Verified'],
  ]

  return (
    <Panel pad={12} bleed={false}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          // Fades at both ends, so rows arrive and leave rather than appearing
          // and vanishing at a hard edge.
          maskImage:
            'linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)',
        }}
      >
        <Marquee>
          {domains.map(([host, state, accent]) => (
            <div
              key={host}
              className='illo-row'
              data-accent={accent ? 'true' : 'false'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                borderRadius: '8px',
                background: accent
                  ? 'rgba(250, 115, 25, 0.08)'
                  : 'var(--bg-surface)',
                boxShadow: accent
                  ? 'inset 0 0 0 1px rgba(250, 115, 25, 0.35)'
                  : 'none',
                flexShrink: 0,
              }}
            >
              <Mono size={11} tone={accent ? 'strong' : 'sub'}>
                {host}
              </Mono>
              <span style={{ flex: '1 0 0' }} />
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: 'var(--radius-full)',
                  background:
                    state === 'Verified'
                      ? 'var(--success-base)'
                      : 'var(--primary-base)',
                  flexShrink: 0,
                }}
              />
              <Mono size={9}>{state}</Mono>
            </div>
          ))}
        </Marquee>
      </div>
    </Panel>
  )
}

// ─── Nothing to install ───
// A comparison, captioned. The contrast between the blocks IS the point, so
// neither carries an accent — pointing at one half would weaken it.
//
// It sits centred with air around it rather than filling the frame: two small
// blocks with space between them read as a comparison, where two large ones
// read as a wall of code.
export function NoScriptIllustration() {
  return (
    <Panel pad={14} bleed={false}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Mono size={9}>Everywhere else</Mono>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              padding: '10px',
              borderRadius: '9px',
              background: 'var(--bg-surface)',
              opacity: 0.45,
            }}
          >
            <Mono size={9} strike>
              &lt;script src=&quot;analytics.js&quot;&gt;
            </Mono>
            <Mono size={9} strike>
              &nbsp;&nbsp;window.dataLayer = []
            </Mono>
            <Mono size={9} strike>
              &lt;/script&gt;
            </Mono>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Mono size={9}>Here</Mono>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 10px',
              borderRadius: '9px',
              background: 'var(--bg-default)',
              boxShadow: 'inset 0 0 0 1px var(--stroke-soft)',
            }}
          >
            <Mono size={11} tone='strong'>
              luot.link/k3mq7t
            </Mono>
          </div>
        </div>
      </div>
    </Panel>
  )
}

// ─── Print and packaging ───
// Codes on things. Tiles rather than rows, because the point is placement.
export function PrintIllustration() {
  const tiles = [
    ['Table card', '612', true],
    ['Window decal', '341'],
    ['Flyer, A5', '187'],
    ['Packaging', '142'],
  ]
  return (
    <Panel pad={12} bleed={false}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          alignContent: 'center',
          height: '100%',
        }}
      >
        {tiles.map(([label, value, accent]) => (
          <div
            key={label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '7px',
              padding: '10px',
              borderRadius: '9px',
              background: accent
                ? 'rgba(250, 115, 25, 0.07)'
                : 'var(--bg-surface)',
              boxShadow: accent
                ? 'inset 0 0 0 1px rgba(250, 115, 25, 0.35)'
                : 'none',
            }}
          >
            <QrCode
              value={`https://luot.link/${label.replace(/\W+/g, '')}`}
              card={40}
              margin={3}
              color='#171717'
              markerColor={accent ? '#fa7319' : '#171717'}
              pattern='square'
              branding={false}
            />
            <div
              style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}
            >
              <Mono size={9}>{label}</Mono>
              <span style={{ flex: '1 0 0' }} />
              <Mono size={10} tone={accent ? 'accent' : 'strong'}>
                {value}
              </Mono>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

// ─── Campaigns and social ───
// One link fanning out to its placements — a spread, not a table.
export function SourcesIllustration() {
  const chips = [
    ['t.co', '2,341'],
    ['i.instagram.com', '1,892'],
    ['linkedin.com', '743'],
    ['newsletter', '521'],
    ['reddit.com', '412'],
    ['direct', '187'],
  ]
  return (
    <Panel pad={14} bleed={false}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 11px',
            borderRadius: '9px',
            background: 'rgba(250, 115, 25, 0.08)',
            boxShadow: 'inset 0 0 0 1px rgba(250, 115, 25, 0.35)',
            alignSelf: 'flex-start',
          }}
        >
          <Mono size={11} tone='strong'>
            luot.link/k3mq7t
          </Mono>
        </div>

        {/* The fan. Six placements, indented progressively so they read as
            branching from the link above rather than listed under it. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {chips.map(([c, count], i) => (
            <div
              key={c}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                marginLeft: `${8 + i * 5}px`,
                padding: '6px 9px',
                borderRadius: '7px',
                background: 'var(--bg-surface)',
                alignSelf: 'flex-start',
                // Fades as it goes, so the fan recedes rather than ending.
                opacity: 1 - i * 0.11,
              }}
            >
              <SourceIcon domain={c} />
              <Mono size={9}>{c}</Mono>
              {/* The count is the point — the copy claims the referrer tells
                  you which placement earned the traffic, so the fan has to
                  measure rather than merely list. */}
              <Mono size={9} tone='strong'>
                {count}
              </Mono>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  )
}

// ─── Client work ───
// A summary: one figure large, the rest small beneath it.
export function StatsIllustration() {
  return (
    <Panel pad={14} bleed={false}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <Mono size={9}>Total clicks, March</Mono>
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
              fontSize: '30px',
              lineHeight: '34px',
              letterSpacing: '0.6px',
              fontVariantNumeric: 'tabular-nums',
              color: 'var(--text-strong)',
            }}
          >
            4,182
          </span>
        </div>

        {/* A bar sparkline rather than a line — it echoes the ranked bars
            elsewhere in the app without repeating the list shape. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '3px',
            height: '38px',
          }}
        >
          {[38, 52, 44, 61, 49, 72, 58, 81, 66, 94, 77, 100].map((h, i) => (
            <span
              key={i}
              style={{
                flex: '1 0 0',
                height: `${h}%`,
                borderRadius: '2px',
                background:
                  i === 11 ? 'var(--primary-base)' : 'rgba(23, 23, 23, 0.10)',
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: '14px' }}>
          {[
            ['Visitors', '2,904'],
            ['Links', '38'],
            ['Scans', '1,204'],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}
            >
              <Mono size={9}>{label}</Mono>
              <Mono size={12} tone='strong'>
                {value}
              </Mono>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  )
}

export default function Illustration({ children }) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}
