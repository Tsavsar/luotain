'use client'

// ─── Profile cache ───
// /api/me is read by the dashboard layout (for the header avatar) and by
// the settings panels. Without this they each fired their own request on
// every settings visit — two round trips for identical data, one of them
// blocking what the person is actually looking at.
//
// A module-level cache rather than a context: it has to be shared across a
// layout and a page that don't have a common provider between them, and it
// survives navigation, so returning to settings is instant rather than
// re-fetching.

let cached = null
let inflight = null

// Resolves immediately when the profile is already known. `force` re-reads
// after a save.
export function getProfile({ force = false } = {}) {
  if (!force && cached) return Promise.resolve(cached)
  // Deduped: two components mounting in the same frame share one request
  // rather than racing.
  if (!force && inflight) return inflight

  inflight = fetch('/api/me')
    .then((res) => {
      if (!res.ok) throw new Error(`profile fetch failed: ${res.status}`)
      return res.json()
    })
    .then((data) => {
      cached = data.user
      inflight = null
      return cached
    })
    .catch((err) => {
      inflight = null
      throw err
    })

  return inflight
}

// Called after a save, so the next read doesn't serve a stale profile.
export function primeProfile(user) {
  cached = user
}

export function clearProfile() {
  cached = null
  inflight = null
}
