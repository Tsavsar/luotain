// ─── GeneratedAvatar ───
// Deterministic, not truly random — the same name always produces
// the same color, picked from our existing semantic token palette
// rather than inventing new colors. A real "random on every render"
// avatar would flicker distractingly on re-render, which is worse
// than just being deterministic per name.
const PALETTE = [
  'var(--primary-base)',
  'var(--info-base)',
  'var(--success-base)',
  'var(--feature-base)',
  'var(--verified-base)',
  'var(--highlight-base)',
]

function colorForName(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

export default function GeneratedAvatar({ name, size = 24 }) {
  const letter = name?.trim()?.[0]?.toUpperCase() || '?'
  const background = colorForName(name || '')

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: 'var(--radius-full)',
        background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: '#fff',
        fontFamily: 'var(--font-sans)',
        fontWeight: 500,
        fontSize: `${Math.round(size * 0.5)}px`,
        userSelect: 'none',
      }}
    >
      {letter}
    </div>
  )
}
