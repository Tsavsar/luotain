'use client'

import GradientAvatar from '@/components/gradientavatar'
import Tooltip from '@/components/tooltip'

// ─── Avatar row ───
// The picture-plus-actions row used by both Account → General and
// Organisation → General.
//
// Extracted rather than copied. The two designs (nodes 87:3216 and 87:3266) are
// identical here, and a second copy is a second place for the upload rules, the
// dice animation and the remove-only-when-there's-something-to-remove logic to
// drift apart.
//
// It owns no state and does no fetching — every action is a callback — so a page
// can stage changes or save immediately without this needing to know which.

function DiceIcon() {
  return (
    <svg
      width='20'
      height='20'
      viewBox='0 0 20 20'
      fill='none'
      aria-hidden='true'
    >
      <rect
        x='3.2'
        y='3.2'
        width='13.6'
        height='13.6'
        rx='3.4'
        stroke='currentColor'
        strokeWidth='1.5'
      />
      <circle cx='7.2' cy='7.2' r='1.15' fill='currentColor' />
      <circle cx='12.8' cy='12.8' r='1.15' fill='currentColor' />
      <circle cx='12.8' cy='7.2' r='1.15' fill='currentColor' />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg
      width='20'
      height='20'
      viewBox='0 0 20 20'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M6 7 10 3l4 4M10 12V3M3.9 15h12.2'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      width='20'
      height='20'
      viewBox='0 0 20 20'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M3.6 6h12.8'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
      <path
        d='M8 6V4.8A1.3 1.3 0 0 1 9.3 3.5h1.4A1.3 1.3 0 0 1 12 4.8V6'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M5.2 6l.7 9.4A1.5 1.5 0 0 0 7.4 16.8h5.2a1.5 1.5 0 0 0 1.5-1.4L14.8 6'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export function Spinner({ size = 14 }) {
  return (
    <svg
      className='btn-spinner'
      width={size}
      height={size}
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden='true'
    >
      <circle
        cx='8'
        cy='8'
        r='6'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeDasharray='28'
        strokeDashoffset='9'
        opacity='0.9'
      />
    </svg>
  )
}

function AvatarRow({
  image,
  name,
  seed,
  busy,
  swapping,
  rolling,
  onUpload,
  onRemove,
  onReroll,
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        background: 'var(--bg-surface)',
        borderRadius: '24px',
        // 20px on the right against the fields' 8px, kept from the design:
        // this is a 62px pill with a 24px radius, so its corner curve is far
        // deeper than an input's and icons at 8px would sit inside it.
        padding: '10px 20px 10px 10px',
        boxSizing: 'border-box',
      }}
    >
      {/* Blur swap, same treatment as the slug regenerate: the old avatar
          blurs out, the new one lands while it's unreadable, then it blurs
          back. A hard cut between two gradients reads as a glitch. */}
      <div
        className={`avatar-swap${swapping ? ' is-swapping' : ''}`}
        style={{ display: 'flex', flexShrink: 0 }}
      >
        {image ? (
          <img
            src={image}
            alt=''
            width={42}
            height={42}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-full)',
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
        ) : (
          // No photo means a generated gradient rather than a grey circle.
          // Derived from the seed, so it's stable across sessions and
          // devices without anything being uploaded.
          <GradientAvatar seed={seed} name={name} size={42} />
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Only offered when there's no photo — re-rolling a gradient
            nobody can see would do nothing visible. */}
        {!image ? (
          <Tooltip label='New gradient'>
            <button
              type='button'
              onClick={onReroll}
              disabled={busy}
              aria-label='Generate a new gradient'
              className='settings-icon-btn'
              style={{
                display: 'flex',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: busy ? 'default' : 'pointer',
                color: 'var(--text-sub)',
              }}
            >
              <span
                className={rolling ? 'dice-roll' : undefined}
                style={{ display: 'flex' }}
              >
                <DiceIcon />
              </span>
            </button>
          </Tooltip>
        ) : null}

        <Tooltip label='Upload a photo'>
          <button
            type='button'
            onClick={onUpload}
            disabled={busy}
            aria-label='Upload a photo'
            className='settings-icon-btn'
            style={{
              display: 'flex',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: busy ? 'default' : 'pointer',
              color: 'var(--text-sub)',
            }}
          >
            {busy ? <Spinner size={18} /> : <UploadIcon />}
          </button>
        </Tooltip>

        {/* Only when there's actually a photo to remove — the design shows
            both icons unconditionally, but "remove" with nothing to remove
            is a button that can only disappoint. */}
        {image ? (
          <Tooltip label='Remove photo'>
            <button
              type='button'
              onClick={onRemove}
              disabled={busy}
              aria-label='Remove photo'
              className='settings-icon-btn'
              style={{
                display: 'flex',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: busy ? 'default' : 'pointer',
                color: 'var(--text-sub)',
              }}
            >
              <TrashIcon />
            </button>
          </Tooltip>
        ) : null}
      </div>
    </div>
  )
}

// Resized before upload rather than sent raw. A phone photo is several
// megabytes; an avatar is displayed at 42px. Resizing client-side means the
// request is tens of kilobytes instead of megabytes, and it's the reason
// storing the image inline in the database is viable at all.
const AVATAR_PX = 256

// Exported too: the Save buttons on both settings pages use the same spinner,
// and a second copy would be one more thing to keep in step.
export default AvatarRow
