'use client'

import { Spinner } from '@/components/avatarrow'

// ─── Save bar ───
// Save changes on the left, Discard changes pushed to the far end.
//
// One component rather than the same markup on three settings pages. They were
// already identical apart from the discard, which only preferences had — and
// three copies is three places for the disabled colours, the spinner and the
// dirty logic to drift.
//
// The gap between the two is deliberate: they're opposite outcomes, and sitting
// them side by side is how someone discards a change they meant to keep.
export default function SaveBar({ dirty, saving, onSave, onDiscard }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        gap: '16px',
      }}
    >
      <button
        type='button'
        onClick={onSave}
        disabled={!dirty || saving}
        className='settings-save'
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '8px 18px',
          borderRadius: 'var(--radius-lg)',
          border: 'none',
          cursor: !dirty || saving ? 'default' : 'pointer',
          fontFamily: 'var(--font-sans)',
          fontSize: '12px',
          lineHeight: '16px',
          letterSpacing: '0.24px',
          background: dirty ? 'var(--text-strong)' : 'var(--bg-surface)',
          color: dirty ? 'var(--bg-default)' : 'var(--text-sub)',
          transition: 'background 0.2s ease, color 0.2s ease',
        }}
      >
        {saving ? (
          <>
            <Spinner size={13} />
            Saving
          </>
        ) : (
          'Save changes'
        )}
      </button>

      {/* Only while there's something to discard. A permanently visible one
          implies there's always something staged, and it would be the only
          control on the page that does nothing most of the time.

          Text rather than a button: it's the lesser of the two actions, and
          giving it Save's weight would make the pair read as a choice rather
          than an action with an escape hatch. */}
      {dirty ? (
        <button
          type='button'
          onClick={onDiscard}
          disabled={saving}
          className='discard-changes'
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            margin: 0,
            cursor: saving ? 'default' : 'pointer',
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            lineHeight: '16px',
            letterSpacing: '0.24px',
            color: 'var(--text-soft)',
          }}
        >
          Discard changes
        </button>
      ) : null}
    </div>
  )
}
