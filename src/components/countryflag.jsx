'use client'

// ─── CountryFlag ───
// Shared flag renderer — maps a country display name to a file in
// /public/assets/flags/. Most names auto-convert (lowercase, spaces
// -> hyphens); the override map handles files whose names don't
// cleanly derive, including one genuine typo in the actual asset
// filename that must be matched as-is, not "corrected".
const FLAG_SLUG_OVERRIDES = {
  'northern ireland': 'northen-ireland', // typo in the actual filename
  'democratic republic of the congo': 'democratic-republic-of-congo',
  'united states virgin islands': 'united-states-virgin-islands',
  'åland islands': 'aaland-islands',
}

export function slugifyCountry(name) {
  const key = name.toLowerCase().trim()
  if (FLAG_SLUG_OVERRIDES[key]) return FLAG_SLUG_OVERRIDES[key]
  return key.replace(/\s+/g, '-')
}

export default function CountryFlag({ country, size = 20 }) {
  if (!country) return null
  const slug = slugifyCountry(country)

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <img
        src={`/assets/flags/${slug}.svg`}
        alt=''
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
      />
    </div>
  )
}
