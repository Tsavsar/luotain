'use client'

import { Caption } from '@/components/landingparts'

// ─── Hero card ───
// Node 612:1130. A 402px card: an image well with a miniature create form on
// it, and a note strip beneath.
//
// The form is transcribed at the design's own sizes rather than scaled from
// the real Inputfield. The ratios aren't uniform — font 0.39, label 0.33,
// radius 0.62 — so it's hand-tuned, and a transform: scale() would get the
// radius and border weights wrong even with the type right.
//
// Type here runs to 4.68px, which is decorative rather than readable. That's
// the intent: it reads as "a form", the way a wireframe does.

const IMAGE = '/websiteimage.png'

function LinkIcon() {
  return (
    <svg
      width='12.485'
      height='12.485'
      viewBox='0 0 20 20'
      fill='none'
      aria-hidden='true'
      style={{ flexShrink: 0 }}
    >
      <path
        d='M8.5 11.5a3.2 3.2 0 0 0 4.8.35l2-2a3.2 3.2 0 0 0-4.5-4.5l-1.1 1.1M11.5 8.5a3.2 3.2 0 0 0-4.8-.35l-2 2a3.2 3.2 0 0 0 4.5 4.5l1.1-1.1'
        stroke='var(--text-soft)'
        strokeWidth='1.6'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg
      width='9.988'
      height='9.988'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden='true'
      style={{ flexShrink: 0 }}
    >
      <path
        d='M8 2.2l1.1 2.9 2.9 1.1-2.9 1.1L8 10.2 6.9 7.3 4 6.2l2.9-1.1L8 2.2ZM12.4 10.4l.5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5.5-1.3Z'
        stroke='var(--text-soft)'
        strokeWidth='1.1'
        strokeLinejoin='round'
      />
    </svg>
  )
}

// The shared shell of the three mini inputs. Border 0.624, radius 9.988,
// py 6.242 — all straight from the design.
function MiniInput({ children, paddingLeft = 5.456 }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '4.994px',
        alignItems: 'center',
        paddingLeft: `${paddingLeft}px`,
        paddingRight: '4.994px',
        paddingTop: '6.242px',
        paddingBottom: '6.242px',
        borderRadius: '9.988px',
        background: 'var(--bg-default)',
        border: '0.624px solid var(--stroke-soft)',
        boxShadow: '0 1.248px 2.497px rgba(54, 54, 54, 0.04)',
        overflow: 'hidden',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  )
}

function MiniLabel({ children, size = 4.68, lineHeight = 6.235 }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: `${size}px`,
        fontWeight: 500,
        lineHeight: `${lineHeight}px`,
        letterSpacing: `${size * 0.02}px`,
        color: 'var(--text-strong)',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

function MiniValue({
  children,
  size = 5.46,
  lineHeight = 7.794,
  tone = 'soft',
}) {
  return (
    <span
      style={{
        flex: '1 0 0',
        minWidth: 0,
        fontFamily: 'var(--font-sans)',
        fontSize: `${size}px`,
        lineHeight: `${lineHeight}px`,
        letterSpacing: `${size * 0.02}px`,
        color: tone === 'soft' ? 'var(--text-soft)' : 'var(--text-strong)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

function MiniForm() {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        top: '52px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        alignItems: 'center',
        width: '240px',
      }}
      aria-hidden='true'
    >
      {/* Short link / QR Code, the same segmented shape the create page uses.
          Static: this is a picture of the product, and a working control here
          would need somewhere for the result to go. */}
      <div
        style={{
          display: 'flex',
          gap: '2px',
          padding: '2px',
          borderRadius: '21px',
          background: 'var(--bg-default)',
          border: '1px solid var(--stroke-soft)',
        }}
      >
        {['Short link', 'QR Code'].map((label, i) => (
          <span
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 16px',
              borderRadius: 'var(--radius-lg)',
              background: i === 0 ? 'var(--bg-layer)' : 'transparent',
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              lineHeight: 1,
              letterSpacing: '0.2px',
              color: 'var(--text-strong)',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12.485px',
          padding: '10px',
          borderRadius: '14px',
          background: 'var(--bg-default)',
          border: '1.248px solid var(--stroke-soft)',
          width: '100%',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '4.994px' }}
        >
          <MiniLabel>Destination</MiniLabel>
          <MiniInput>
            <LinkIcon />
            <MiniValue>https://example.com/your-page</MiniValue>
          </MiniInput>
        </div>

        <div
          style={{ display: 'flex', gap: '4.994px', alignItems: 'flex-start' }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4.994px',
              width: '60.552px',
              flexShrink: 0,
            }}
          >
            <MiniLabel>Domain</MiniLabel>
            <MiniInput>
              <MiniValue tone='strong'>luot.link</MiniValue>
            </MiniInput>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4.994px',
              flex: '1 0 0',
              minWidth: 0,
            }}
          >
            {/* The slug label carries three things at a LARGER size than the
                other two — 7.491px against 4.68 — which is how the design
                draws it. */}
            <div
              style={{
                display: 'flex',
                gap: '3.745px',
                alignItems: 'center',
                paddingRight: '2.497px',
              }}
            >
              <MiniLabel size={7.491} lineHeight={9.988}>
                Slug
              </MiniLabel>
              <span
                style={{
                  flex: '1 0 0',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '7.491px',
                  lineHeight: '9.988px',
                  letterSpacing: '0.1498px',
                  color: 'var(--bg-muted)',
                }}
              >
                (Optional)
              </span>
              <SparkleIcon />
            </div>
            <MiniInput paddingLeft={8.739}>
              <MiniValue size={8.739} lineHeight={12.485}>
                swift-otter
              </MiniValue>
            </MiniInput>
          </div>
        </div>
      </div>

      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4.994px 12.485px',
          borderRadius: '999px',
          background: 'var(--text-inverse)',
          fontFamily: 'var(--font-sans)',
          fontSize: '8.739px',
          lineHeight: '12.485px',
          letterSpacing: '0.1748px',
          color: 'var(--bg-weak)',
          whiteSpace: 'nowrap',
        }}
      >
        Create link
      </span>
    </div>
  )
}

export default function HeroCard() {
  return (
    <div
      className='landing-herocard'
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '8px',
        background: 'var(--bg-surface)',
        width: '402px',
        maxWidth: '100%',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'relative',
          height: '343px',
          borderRadius: '8px',
          border: '2px solid var(--stroke-soft)',
          overflow: 'hidden',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Inset by the 2px border on three sides, as the design has it — the
            image sits UNDER the stroke rather than inside it, so the border
            reads as a frame on top. */}
        <img
          src={IMAGE}
          alt=''
          style={{
            position: 'absolute',
            top: '-2px',
            left: '-2px',
            right: '-2px',
            height: '343px',
            width: 'calc(100% + 4px)',
            objectFit: 'cover',
            pointerEvents: 'none',
          }}
        />
        <MiniForm />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px',
          borderRadius: '16px',
          background: 'var(--bg-surface)',
          width: '100%',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        <span style={{ flex: '1 0 0', minWidth: 0, textAlign: 'center' }}>
          <Caption>
            You get more control over your link creation when you create an
            account
          </Caption>
        </span>
      </div>
    </div>
  )
}
