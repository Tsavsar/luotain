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

// ─── Families ───
// Weighted rather than uniform. Pastels stay the majority so a list of
// avatars reads as one palette; the rest exist so it isn't monotonous.
//
// Weights are cumulative out of 100, checked in order.
const FAMILIES = [
  { id: 'pastel', upTo: 52 },
  { id: 'silver', upTo: 64 },
  { id: 'gold', upTo: 76 },
  { id: 'graphite', upTo: 86 },
  { id: 'ink', upTo: 93 },
  { id: 'jewel', upTo: 100 },
]

function familyFor(h) {
  const roll = slice(h, 3, 100)
  return FAMILIES.find((f) => roll < f.upTo)?.id || 'pastel'
}

// Metallics get a third stop. Two flat greys read as concrete; what makes
// silver look like silver is a bright band running through it, and gold is
// the same trick warmer. The middle stop is that sheen.
function build(family, h) {
  const hue = slice(h, 0, 360)
  const angle = slice(h, 17, 360)

  if (family === 'silver') {
    // Barely-there hue, cool. Fully desaturated greys look dead, so a
    // couple of percent of blue keeps it metallic rather than flat.
    const base = 205 + slice(h, 5, 30) // 205–235, cool
    const sat = 6 + slice(h, 9, 7) // 6–12%
    return {
      stops: [
        `hsl(${base} ${sat}% ${62 + slice(h, 21, 6)}%)`,
        `hsl(${base} ${sat + 4}% ${88 + slice(h, 25, 5)}%)`,
        `hsl(${base} ${sat}% ${68 + slice(h, 13, 7)}%)`,
      ],
      angle,
      lightness: 74,
    }
  }

  if (family === 'gold') {
    const base = 38 + slice(h, 5, 14) // 38–52, warm
    return {
      stops: [
        `hsl(${base} ${52 + slice(h, 9, 12)}% ${56 + slice(h, 21, 6)}%)`,
        `hsl(${base + 6} ${64 + slice(h, 13, 10)}% ${80 + slice(h, 25, 6)}%)`,
        `hsl(${base - 4} ${48 + slice(h, 11, 12)}% ${58 + slice(h, 19, 7)}%)`,
      ],
      angle,
      lightness: 66,
    }
  }

  if (family === 'graphite') {
    const base = 210 + slice(h, 5, 40)
    const sat = 4 + slice(h, 9, 8)
    return {
      // Top stop capped at 34%. Measured rather than guessed: at 58% the
      // light initial only reached 2.92:1, and 34% is the highest
      // lightness at which white still clears 3:1 across every hue.
      stops: [
        `hsl(${base} ${sat}% ${20 + slice(h, 21, 8)}%)`,
        `hsl(${base} ${sat + 3}% ${28 + slice(h, 25, 7)}%)`,
      ],
      angle,
      lightness: 26,
    }
  }

  if (family === 'ink') {
    // Near-black, but never pure. A true #000 avatar reads as a rendering
    // failure rather than a choice, and it kills the gradient entirely.
    const base = 220 + slice(h, 5, 40)
    return {
      stops: [
        `hsl(${base} ${8 + slice(h, 9, 8)}% ${10 + slice(h, 21, 6)}%)`,
        `hsl(${base} ${6 + slice(h, 13, 8)}% ${24 + slice(h, 25, 8)}%)`,
      ],
      angle,
      lightness: 18,
    }
  }

  if (family === 'jewel') {
    // Saturated mid-darks. The counterweight to the pastels — without
    // something with real colour in it, the whole set reads washed out.
    const spread = 24 + slice(h, 9, 40)
    const hue2 = (hue + (h & 1 ? spread : -spread) + 360) % 360
    return {
      // Same 34% ceiling as graphite, for the same measured reason. Jewel
      // keeps its saturation, which is what stops it reading as another
      // grey — it's darker than it is dull.
      stops: [
        `hsl(${hue} ${58 + slice(h, 5, 16)}% ${22 + slice(h, 21, 8)}%)`,
        `hsl(${hue2} ${54 + slice(h, 13, 16)}% ${28 + slice(h, 25, 7)}%)`,
      ],
      angle,
      lightness: 26,
    }
  }

  // Pastel. High lightness, restrained saturation.
  //
  // The hue offset stays between 30 and 85 degrees deliberately: wider
  // (complementary) pairings read as garish at this lightness, and
  // narrower than 30 barely reads as a gradient at all.
  const spread = 30 + slice(h, 9, 56)
  // Alternating direction so the palette doesn't drift one way around the
  // wheel and cluster.
  const hue2 = (hue + (h & 1 ? spread : -spread) + 360) % 360
  const light1 = 78 + slice(h, 21, 7)
  const light2 = 70 + slice(h, 25, 7)
  return {
    stops: [
      `hsl(${hue} ${62 + slice(h, 5, 14)}% ${light1}%)`,
      `hsl(${hue2} ${58 + slice(h, 13, 14)}% ${light2}%)`,
    ],
    angle,
    lightness: (light1 + light2) / 2,
  }
}

export function gradientFor(seed) {
  const h = hash(String(seed || 'luotain'))
  const family = familyFor(h)
  const { stops, angle, lightness } = build(family, h)
  const hue = slice(h, 0, 360)

  return {
    family,
    stops,
    angle,
    css: `linear-gradient(${angle}deg, ${stops.join(', ')})`,
    // Ink flips with the background rather than being fixed — a dark
    // family would otherwise render an unreadable dark initial on a dark
    // circle. Threshold at 55 rather than 50 because a mid-grey takes dark
    // text better than light.
    //
    // The target is 3:1, not 4.5:1: an initial at 40% of the avatar's size
    // is large-scale text, which is the threshold that actually applies.
    // Every family's stop ranges above were set from that measurement.
    ink: lightness > 55 ? `hsl(${hue} 42% 22%)` : '#ffffff',
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
  const { css, ink } = gradientFor(resolved)
  const initial = (name || '').trim().charAt(0).toUpperCase()

  return (
    <div
      aria-hidden='true'
      style={{
        width: `${size}px`,
        height: `${size}px`,
        flexShrink: 0,
        borderRadius: 'var(--radius-full)',
        background: css,
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
