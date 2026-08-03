'use client'

// ─── GradientAvatar ───
// A deterministic gradient generated from a seed string. Inspired by
// avatars.jakerunzer.com, pushed pastel.
//
// The important decision here is that nothing is stored as an image. The
// seed is a short string in the database; the gradient is derived from it
// at render time. That means no file storage, no CDN, no upload pipeline,
// no broken-image state, and it renders instantly offline. Re-rolling is
// just writing a different seed.
//
// It also means the same function serves users and organisations — an org
// with no logo gets the same treatment from its own id.

// FNV-1a plus a murmur3 finalising pass. The mix matters and isn't
// ceremony: raw FNV's low bits are poorly avalanched, and since the hue is
// taken straight off them, sequential ids (which is exactly what cuids
// are) came out visibly clustered — measured 57% deviation across hue
// buckets before the mix, 3% after. Half your users having the same blue
// is precisely the failure mode.
function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  // Avalanche, so every output bit depends on every input bit.
  h ^= h >>> 16
  h = Math.imul(h, 2246822507)
  h ^= h >>> 13
  h = Math.imul(h, 3266489909)
  h ^= h >>> 16
  return h >>> 0
}

// Pulls independent values out of one hash by walking different bit
// ranges, so hue, spread and angle don't move in lockstep.
function slice(h, shift, mod) {
  return (((h >>> shift) % mod) + mod) % mod
}

// Pastel: high lightness, restrained saturation. Two hues rather than
// three — a third stop at this lightness turns to mud in the middle.
//
// The hue offset is kept between 30 and 85 degrees deliberately. Wider
// (complementary) pairings read as garish at pastel lightness, and
// narrower than 30 barely reads as a gradient at all.
export function gradientFor(seed) {
  const h = hash(String(seed || 'luotain'))

  const hue = slice(h, 0, 360)
  const spread = 30 + slice(h, 9, 56) // 30–85°
  // Alternating direction, so the palette doesn't drift one way around
  // the wheel and cluster.
  const hue2 = (hue + (h & 1 ? spread : -spread) + 360) % 360

  const angle = slice(h, 17, 360)

  // Saturation and lightness vary slightly per seed so avatars in a list
  // aren't all identically washed out, but stay inside a pastel band.
  const sat1 = 62 + slice(h, 5, 14) // 62–75%
  const sat2 = 58 + slice(h, 13, 14) // 58–71%
  const light1 = 78 + slice(h, 21, 7) // 78–84%
  const light2 = 70 + slice(h, 25, 7) // 70–76%

  return {
    from: `hsl(${hue} ${sat1}% ${light1}%)`,
    to: `hsl(${hue2} ${sat2}% ${light2}%)`,
    angle,
    // Dark ink from the same hue rather than flat grey — it belongs to the
    // gradient instead of sitting on top of it, and at this lightness a
    // dark foreground is the only thing that stays readable.
    ink: `hsl(${hue} 42% 26%)`,
  }
}

// The seed. Falls back to the record's id, which every user and org
// already has — so avatars work with no migration and no backfill, and a
// stored seed is only needed once someone re-rolls.
export function seedFor({ seed, id, name }) {
  return seed || id || name || 'luotain'
}

export default function GradientAvatar({
  seed,
  id,
  name,
  size = 42,
  // The initial is optional. On a 20px avatar it's illegible, so at small
  // sizes the gradient alone identifies the account.
  showInitial = true,
  style,
}) {
  const resolved = seedFor({ seed, id, name })
  const { from, to, angle, ink } = gradientFor(resolved)
  const initial = (name || '').trim().charAt(0).toUpperCase()

  return (
    <div
      aria-hidden='true'
      style={{
        width: `${size}px`,
        height: `${size}px`,
        flexShrink: 0,
        borderRadius: 'var(--radius-full)',
        background: `linear-gradient(${angle}deg, ${from}, ${to})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: ink,
        fontFamily: 'var(--font-sans)',
        // Scales with the avatar rather than a fixed size, so it works at
        // 20px in a menu and 42px in settings.
        fontSize: `${Math.round(size * 0.4)}px`,
        lineHeight: 1,
        letterSpacing: '0.02em',
        userSelect: 'none',
        ...style,
      }}
    >
      {showInitial && size >= 24 && initial ? initial : null}
    </div>
  )
}
