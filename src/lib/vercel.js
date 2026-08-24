// ─── Vercel domains ───
// Registering a custom domain with the HOST, which is the part that was
// missing. Verification only ever checked that DNS pointed at us; Vercel still
// wouldn't answer for a hostname that isn't on the project, so there was no
// certificate and the browser refused before any of this code ran.
//
// Everything here is best-effort. A domain row is still created and still
// verifiable if these calls fail — losing the ability to add a domain because
// an API call timed out would be worse than a domain that needs a retry.

const API = 'https://api.vercel.com'

function config() {
  const token = process.env.VERCEL_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID
  if (!token || !projectId) return null
  // Personal accounts have no team. Appending an empty teamId is a 400, so
  // it's only added when there's one to add.
  const team = process.env.VERCEL_TEAM_ID
    ? `?teamId=${process.env.VERCEL_TEAM_ID}`
    : ''
  return { token, projectId, team }
}

export function isConfigured() {
  return config() !== null
}

// What a customer points their DNS at. cname.vercel-dns.com is Vercel's own
// target — the previous value, cname.luotain.app, was a placeholder that never
// existed, so every customer following those instructions created a CNAME to
// nothing and could never verify.
export const CNAME_TARGET =
  process.env.DOMAIN_CNAME_TARGET || 'cname.vercel-dns.com'

async function call(path, options = {}) {
  const c = config()
  if (!c) return { error: 'Vercel is not configured' }
  try {
    const res = await fetch(`${API}${path}${c.team}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${c.token}`,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      return {
        error: data?.error?.message || `Vercel returned ${res.status}`,
        status: res.status,
      }
    }
    return { data }
  } catch (err) {
    console.error('[vercel]', path, err)
    return { error: err?.message || 'Request failed' }
  }
}

// Adds the domain to the project. Vercel issues the certificate once DNS
// resolves, which is why this has to happen BEFORE someone's DNS is checked
// rather than after.
export async function addDomain(hostname) {
  const c = config()
  if (!c) return { skipped: true }
  const r = await call(`/v10/projects/${c.projectId}/domains`, {
    method: 'POST',
    body: JSON.stringify({ name: hostname }),
  })
  // Already on the project is a success, not a failure — re-adding a domain
  // someone removed and re-added shouldn't error.
  if (r.error && /already/i.test(r.error)) return { data: { existing: true } }
  return r
}

// The real state. NOT the `verified` field from the add call — that comes back
// true even when DNS isn't configured, which would report success to someone
// who hasn't set anything up yet.
export async function getDomainConfig(hostname) {
  const c = config()
  if (!c) return { skipped: true }
  return call(`/v9/projects/${c.projectId}/domains/${hostname}/config`)
}

export async function removeDomain(hostname) {
  const c = config()
  if (!c) return { skipped: true }
  return call(`/v9/projects/${c.projectId}/domains/${hostname}`, {
    method: 'DELETE',
  })
}
