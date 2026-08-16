// The short-link domain, in one place.
//
// Was previously written independently into the mock data, the by-slug
// route, the trash list route and the link detail page's fallback —
// four copies of a string that must agree, which is the same drift
// trap the 30-day recovery window had. A shortCode is meaningless
// without knowing what it hangs off, so composing that URL belongs in
// exactly one function.
//
// Plain .js with no 'use client' so both server routes and client
// components can import it.
//
// Worth promoting to an env var when there's more than one
// environment: a staging deploy handing out luot.link URLs that point
// at production is a real hazard. Left as a constant for now rather
// than adding config that isn't being varied yet.
// Configurable, and defaulting to the app's OWN host rather than a domain that
// may not be pointed anywhere. Hardcoded as luot.link, every QR code encoded
// https://luot.link/<slug> — a perfectly valid URL that resolves to nothing
// unless that domain is registered AND pointed at this deployment.
//
// Set SHORT_DOMAIN once luot.link actually serves the redirect. Until then this
// falls back to the app itself, where the [shortCode] route already lives, so
// links and codes work immediately.
export const SHORT_DOMAIN =
  process.env.NEXT_PUBLIC_SHORT_DOMAIN ||
  (process.env.NEXT_PUBLIC_APP_URL || '')
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '') ||
  'luotain.app'

// "quick-fox" -> "luot.link/quick-fox"
//
// hostname is optional and defaults to SHORT_DOMAIN, so existing calls
// keep working — but now that a link belongs to a domain, callers with a
// real one should pass it. Composing from the constant when the link
// actually lives on go.acme.com would print a URL that doesn't resolve.
export function shortUrlFor(shortCode, hostname) {
  if (!shortCode) return ''
  return `${hostname || SHORT_DOMAIN}/${shortCode}`
}
