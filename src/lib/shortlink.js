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
// SHORT_DOMAIN first, then NEXT_PUBLIC_SHORT_DOMAIN.
//
// The unprefixed one is server-only, which is all that's actually needed: the
// API returns the finished shortUrl in its response, so nothing in the browser
// ever has to compute a hostname. Vercel refuses to save NEXT_PUBLIC_ values
// it considers sensitive, and this sidesteps that entirely.
//
// The prefixed one is kept as a fallback so any client-side call that already
// relies on it doesn't silently switch domains — but a server value now wins.
export const SHORT_DOMAIN =
  process.env.SHORT_DOMAIN ||
  process.env.NEXT_PUBLIC_SHORT_DOMAIN ||
  // 'luot.link', not the app URL.
  //
  // The old fallback derived the hostname from NEXT_PUBLIC_APP_URL because
  // luot.link wasn't pointed anywhere yet, so codes had to encode a domain
  // that actually resolved. It is pointed now, so that reasoning is spent.
  //
  // This matters in the BROWSER specifically: SHORT_DOMAIN above is
  // server-only and undefined on the client, so the create form's domain field
  // was falling all the way through to luotain.app while the API created links
  // on luot.link. The form disagreed with the link it made.
  'luot.link'

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
