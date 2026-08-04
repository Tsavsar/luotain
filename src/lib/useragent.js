// ─── User agent parsing ───
// Turns a raw user-agent string into "Chrome on macOS".
//
// Deliberately small and ordered. Every one of these checks exists because
// of a string that would otherwise be misread:
//
//   Edge identifies as Chrome AND Safari, so it has to be tested first.
//   Chrome identifies as Safari, so Safari is tested last.
//   iPadOS reports itself as Macintosh, so touch support disambiguates it —
//     except that isn't in the UA string, which is why iPad is checked
//     before Mac via its own token where present.
//
// Nothing here is exhaustive, and it doesn't try to be: the raw string is
// stored, so a session recorded today can be re-parsed by better rules
// later. This only has to name the common cases well.

export function parseUserAgent(ua) {
  if (!ua) return { browser: null, os: null, label: 'Unknown device' }

  const browser = /\bEdg(e|A|iOS)?\//i.test(ua)
    ? 'Edge'
    : /\bOPR\/|\bOpera/i.test(ua)
      ? 'Opera'
      : /\bFirefox\/|\bFxiOS\//i.test(ua)
        ? 'Firefox'
        : /\bChrome\/|\bCriOS\//i.test(ua)
          ? 'Chrome'
          : /\bSafari\//i.test(ua)
            ? 'Safari'
            : null

  const os = /\biPhone\b/i.test(ua)
    ? 'iPhone'
    : /\biPad\b/i.test(ua)
      ? 'iPad'
      : /\bAndroid\b/i.test(ua)
        ? 'Android'
        : /\bWindows\b/i.test(ua)
          ? 'Windows'
          : // "Mac OS X" is the token; macOS is what people call it.
            /\bMac OS X\b|\bMacintosh\b/i.test(ua)
            ? 'macOS'
            : /\bLinux\b/i.test(ua)
              ? 'Linux'
              : null

  const label =
    browser && os ? `${browser} on ${os}` : browser || os || 'Unknown device'

  return { browser, os, label }
}

// "Active now" for anything within the last few minutes — a session being
// used right now won't have updated its timestamp on this exact request, so
// requiring an exact match would mean it never says "Active now".
const ACTIVE_WINDOW_MS = 5 * 60 * 1000

export function formatLastActive(iso, { isCurrent = false } = {}) {
  if (isCurrent) return 'Active now'
  if (!iso) return null

  const ms = Date.now() - new Date(iso).getTime()
  if (ms < ACTIVE_WINDOW_MS) return 'Active now'

  const mins = Math.floor(ms / 60000)
  if (mins < 60) return `Last active ${mins} minute${mins === 1 ? '' : 's'} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24)
    return `Last active ${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Last active ${days} day${days === 1 ? '' : 's'} ago`
  return `Last active ${new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`
}

// "Lagos, Nigeria", or whichever half is known. Returns null when neither
// is — the UI omits the segment entirely rather than printing "Unknown".
export function formatLocation({ city, country }) {
  if (city && country) return `${city}, ${country}`
  return city || country || null
}
