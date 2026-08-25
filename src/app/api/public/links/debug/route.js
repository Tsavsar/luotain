import { prisma } from '@/lib/prisma'
import { SHORT_DOMAIN } from '@/lib/shortlink'

// GET /api/public/links/debug
//
// Reports whether anonymous link creation can work, and which piece is missing
// if it can't. Three things have to be true and the form can only say "could
// not create the link" — this says which one.
//
// No session required: it reveals configuration state, not data.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const out = { checks: {} }

  // 1. The env var naming the workspace anonymous links belong to.
  const orgId = process.env.PUBLIC_ORG_ID
  out.checks.publicOrgIdSet = {
    ok: Boolean(orgId),
    value: orgId || null,
    note: orgId
      ? 'set'
      : 'MISSING — every request returns 503. Run migration_public_org.sql and set PUBLIC_ORG_ID, then redeploy.',
  }

  // 2. That workspace has to exist. A set-but-wrong id fails identically to an
  //    unset one from the outside.
  if (orgId) {
    const org = await prisma.organization
      .findUnique({ where: { id: orgId }, select: { id: true, name: true } })
      .catch(() => null)
    out.checks.orgExists = org
      ? { ok: true, name: org.name }
      : {
          ok: false,
          note: `No Organization with id "${orgId}". The SQL did not run, or the id differs.`,
        }
  }

  // 3. A Domain row for whatever SHORT_DOMAIN resolves to — the create route
  //    looks it up by hostname and gives up without it.
  const domain = await prisma.domain
    .findFirst({
      where: { hostname: SHORT_DOMAIN },
      select: { id: true, verified: true },
    })
    .catch(() => null)
  out.checks.shortDomain = {
    hostname: SHORT_DOMAIN,
    rowExists: Boolean(domain),
    verified: domain?.verified ?? null,
    note: domain
      ? 'ok'
      : `No Domain row for ${SHORT_DOMAIN}. Links cannot be created or resolved on it.`,
  }

  out.ready =
    Boolean(orgId) && out.checks.orgExists?.ok !== false && Boolean(domain)

  return Response.json(out)
}
