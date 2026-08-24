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

// Vercel's A record for apex domains. An apex CANNOT take a CNAME — that's a
// DNS rule, not a Vercel one — so the record type differs by hostname shape and
// telling someone to CNAME their apex sends them to do something impossible.
export const A_RECORD = process.env.DOMAIN_A_RECORD || '76.76.21.21'

// Two-part TLDs, so "acme.co.uk" is recognised as an apex rather than as a
// subdomain "acme" of "co.uk". Not exhaustive — the full list is thousands
// long and lives in the public suffix list — but it covers the ones people
// actually use. A miss here shows a CNAME where an A record was needed, which
// fails visibly rather than silently.
const TWO_PART_TLDS = new Set([
  'co.uk',
  'org.uk',
  'me.uk',
  'ac.uk',
  'gov.uk',
  'com.au',
  'net.au',
  'org.au',
  'co.nz',
  'co.za',
  'com.br',
  'com.mx',
  'co.in',
  'co.jp',
  'com.ng',
  'com.sg',
])

// What record someone actually has to create.
export function dnsRecordFor(hostname) {
  const parts = String(hostname || '')
    .toLowerCase()
    .split('.')
  const lastTwo = parts.slice(-2).join('.')
  const tldLabels = TWO_PART_TLDS.has(lastTwo) ? 3 : 2
  const isApex = parts.length <= tldLabels

  if (isApex) {
    return {
      type: 'A',
      // "@" is how every DNS panel spells the apex. The bug was showing the
      // first label — "shatermt" for shatermt.com — which is a subdomain that
      // doesn't exist and would create go.shatermt.com.shatermt.com.
      host: '@',
      value: A_RECORD,
      isApex: true,
    }
  }

  return {
    type: 'CNAME',
    // Everything before the registrable domain, so a.b.example.com gives
    // "a.b" rather than just "a".
    host: parts.slice(0, parts.length - tldLabels).join('.'),
    value: CNAME_TARGET,
    isApex: false,
  }
}
