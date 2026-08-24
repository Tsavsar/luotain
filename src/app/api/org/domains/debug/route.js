import dns from 'dns/promises'
import { prisma } from '@/lib/prisma'
import { resolveActiveOrg } from '@/lib/resolveActiveOrg'
import { isConfigured, getDomainConfig, CNAME_TARGET } from '@/lib/vercel'

// GET /api/org/domains/debug?hostname=go.acme.com
//
// Reports every link in the chain at once, because "doesn't work" has six
// possible causes here and testing them one at a time by deploying is slow.
// Signed-in only — it reveals configuration state.
export const runtime = 'nodejs'

export async function GET(request) {
  const { error } = await resolveActiveOrg()
  if (error) return error

  const hostname = new URL(request.url).searchParams.get('hostname')
  if (!hostname) {
    return Response.json({ error: 'Pass ?hostname=' }, { status: 400 })
  }

  const out = { hostname, checks: {} }

  // 1. Is the Vercel integration even switched on?
  out.checks.vercelConfigured = {
    ok: isConfigured(),
    hasToken: Boolean(process.env.VERCEL_TOKEN),
    hasProjectId: Boolean(process.env.VERCEL_PROJECT_ID),
    hasTeamId: Boolean(process.env.VERCEL_TEAM_ID),
    note: isConfigured()
      ? 'Vercel calls will run'
      : 'MISSING — domains are never registered with the host, so they get no certificate and never serve',
  }

  // 2. What target are people being told to use, and does it resolve?
  out.checks.cnameTarget = { value: CNAME_TARGET }
  try {
    await dns.resolve(CNAME_TARGET)
    out.checks.cnameTarget.resolves = true
  } catch (err) {
    out.checks.cnameTarget.resolves = false
    out.checks.cnameTarget.note =
      'The target itself does not resolve — nobody pointing at it can ever verify'
  }

  // 3. Where does the customer's hostname actually point?
  try {
    out.checks.dns = { cname: await dns.resolveCname(hostname) }
    out.checks.dns.matchesTarget = out.checks.dns.cname.some(
      (r) => r.toLowerCase().replace(/\.$/, '') === CNAME_TARGET.toLowerCase()
    )
  } catch (err) {
    out.checks.dns = { error: err?.code || String(err) }
  }

  // 4. Is there a row for it? Without one the redirect 404s regardless of DNS.
  const row = await prisma.domain.findUnique({
    where: { hostname },
    select: { id: true, verified: true, organizationId: true, lastError: true },
  })
  out.checks.databaseRow = row
    ? { exists: true, ...row }
    : {
        exists: false,
        note: 'No Domain row — the redirect 404s before it looks at the slug',
      }

  // 5. Does Vercel know about it, and is it configured correctly?
  if (isConfigured()) {
    const conf = await getDomainConfig(hostname)
    out.checks.vercel = conf?.data
      ? {
          misconfigured: conf.data.misconfigured,
          note:
            conf.data.misconfigured === false
              ? 'Vercel is serving this hostname'
              : 'Vercel has the domain but DNS is not reaching it yet',
        }
      : { error: conf?.error || 'no response' }
  }

  // 6. Are there links on it to serve?
  if (row) {
    out.checks.links = await prisma.link.count({ where: { domainId: row.id } })
  }

  return Response.json(out)
}
