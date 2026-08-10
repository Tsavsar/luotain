// ─── Preferences ───
// Defaults and shape in one place, read by both the endpoint and the page — the
// same reasoning as src/lib/plans.js. Two copies of "what the default is" means
// the UI eventually shows one thing and the server stores another.
//
// Stored as a single JSON column rather than a column per toggle. Preferences
// get added often and are only ever read as a whole for one user, so a column
// each would mean a migration per checkbox for no query benefit.
//
// Theme is deliberately NOT in here. It has to apply before first paint or the
// page flashes the wrong colours, and a database round trip can't happen that
// early — so it stays in localStorage, where it already works. The settings
// page surfaces the same local control rather than a second source of truth.

export const DEFAULT_PREFERENCES = {
  // Analytics groups clicks by day, and without a timezone that boundary is the
  // server's. So "today" is wrong for anyone not on UTC — this is a correctness
  // setting, not a nicety.
  timezone: 'UTC',

  // Email. Split by what each one actually is, because "notifications" as a
  // single switch forces a choice between useful mail and marketing.
  emailProductUpdates: false, // opt-IN, deliberately
  emailWeeklyDigest: true,
  emailTrafficAlerts: true,

  // Defaults applied when creating something, so a preference set once saves
  // work every time after.
  defaultQrColor: '#000000',
  defaultQrMarkerColor: '#000000',
  defaultQrPattern: 'square',
  defaultQrBranding: true,

  // Some places need the scheme to linkify a pasted URL; others show it as
  // noise. No right answer, hence a setting.
  copyWithScheme: true,
}

// Merged over the defaults rather than returned raw, so a row written before a
// preference existed still comes back complete — and an unknown key from an old
// client can't leak through.
export function withDefaults(stored) {
  const out = { ...DEFAULT_PREFERENCES }
  if (!stored || typeof stored !== 'object') return out
  for (const key of Object.keys(DEFAULT_PREFERENCES)) {
    if (stored[key] !== undefined) out[key] = stored[key]
  }
  return out
}

// Validated per key on the way in. An endpoint that accepts whatever it's sent
// would let a bad timezone or an unknown pattern reach the renderer, where it
// fails silently instead of at the boundary.
const HEX = /^#[0-9a-fA-F]{6}$/
const PATTERNS = ['square', 'rounded', 'dots', 'classy', 'diamond', 'cross']

export function sanitize(input) {
  const out = {}
  if (!input || typeof input !== 'object') return out

  if (typeof input.timezone === 'string' && isValidTimezone(input.timezone)) {
    out.timezone = input.timezone
  }
  for (const key of [
    'emailProductUpdates',
    'emailWeeklyDigest',
    'emailTrafficAlerts',
    'defaultQrBranding',
    'copyWithScheme',
  ]) {
    if (typeof input[key] === 'boolean') out[key] = input[key]
  }
  for (const key of ['defaultQrColor', 'defaultQrMarkerColor']) {
    if (HEX.test(input[key] || '')) out[key] = input[key].toLowerCase()
  }
  if (PATTERNS.includes(input.defaultQrPattern)) {
    out.defaultQrPattern = input.defaultQrPattern
  }
  return out
}

// Checked against the platform's own database rather than a hardcoded list,
// which would go stale — zones get added and renamed.
export function isValidTimezone(tz) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

// The zones offered in the picker. Not every IANA zone — there are hundreds and
// a list that long is worse than useless. These cover the common cases, and the
// browser's own guess is added at the top so most people never open it.
export const COMMON_TIMEZONES = [
  'UTC',
  'Europe/London',
  'Europe/Dublin',
  'Europe/Lisbon',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Amsterdam',
  'Europe/Stockholm',
  'Europe/Warsaw',
  'Europe/Athens',
  'Europe/Istanbul',
  'Europe/Moscow',
  'Africa/Lagos',
  'Africa/Accra',
  'Africa/Nairobi',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Perth',
  'Australia/Sydney',
  'Pacific/Auckland',
  'America/Sao_Paulo',
  'America/New_York',
  'America/Toronto',
  'America/Chicago',
  'America/Mexico_City',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
]

// "Europe/London" reads better as "London" with its current offset beside it —
// the offset is what people actually recognise.
export function formatTimezone(tz) {
  const city = tz.split('/').pop().replace(/_/g, ' ')
  try {
    const offset = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    })
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName')?.value
    return offset ? `${city} · ${offset}` : city
  } catch {
    return city
  }
}
