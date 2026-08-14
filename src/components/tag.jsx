'use client'

// ─── Tag ───
// Node 108:1925. A dot and a word on a raised white plate.
//
// Extracted rather than copied a second time — it was inline on the billing
// page's invoices, and domains need the identical thing. Two copies is two
// places for the plate, the shadow and the dot size to drift apart.
//
// The TEXT is always --text-sub, whatever the tone. Only the dot carries the
// colour, which is what keeps a row of these readable: five differently
// coloured labels compete, five identical labels with different dots scan in
// one pass.
const TONES = {
  success: 'var(--success-base)',
  error: 'var(--error-base)',
  warning: 'var(--warning-base)',
  neutral: 'var(--bg-muted)',
  // Pending things get the brand orange rather than yellow — it's the colour
  // already meaning "in progress" everywhere else in the app.
  pending: 'var(--primary-base)',
}

export default function Tag({ tone = 'neutral', label, pulse = false }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        gap: '6px',
        alignItems: 'center',
        padding: '6px 9px 6px 7px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-default)',
        border: '1px solid var(--stroke-soft)',
        // drop-shadow rather than boxShadow in the design, but on an opaque
        // rounded rect the two are indistinguishable and boxShadow doesn't
        // force a new compositing layer.
        boxShadow: '0 2px 2px rgba(54, 54, 54, 0.04)',
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        aria-hidden='true'
        className={pulse ? 'tag-dot-pulse' : undefined}
        style={{
          width: '6px',
          height: '6px',
          borderRadius: 'var(--radius-full)',
          background: TONES[tone] || TONES.neutral,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '10px',
          lineHeight: 1,
          letterSpacing: '0.2px',
          color: 'var(--text-sub)',
        }}
      >
        {label}
      </span>
    </span>
  )
}
