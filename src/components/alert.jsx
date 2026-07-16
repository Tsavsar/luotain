// ─── Alert ───
// Small confirmation popup, matches Figma node 308:851. Icon + message
// in a neutral white card — the color signal lives in the icon alone,
// not the whole card (one spot of color, not a tinted background).
// icon and message are both props so this is reusable for other
// confirmations beyond just "new code sent".
export default function Alert({ icon, message }) {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%', // 400px in the Figma frame, but that was just the
        // isolated artboard width — every other element on
        // this page fills its 360px container at 100%
        padding: '8px 10px',
        alignItems: 'center',
        gap: '6px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--stroke-soft)',
        background: 'var(--bg-default)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flex: '1 0 0',
          alignItems: 'center',
          gap: '6px',
          minWidth: 0,
        }}
      >
        <div style={{ flexShrink: 0, width: '20px', height: '20px' }}>
          {icon}
        </div>
        <p
          className='para-sm'
          style={{ flex: '1 0 0', color: 'var(--text-strong)', margin: 0 }}
        >
          {message}
        </p>
      </div>
    </div>
  )
}
