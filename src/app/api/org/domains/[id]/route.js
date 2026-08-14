import dns from 'dns/promises'
import { prisma } from '@/lib/prisma'
import { resolveActiveOrg } from '@/lib/resolveActiveOrg'

const CNAME_TARGET = process.env.DOMAIN_CNAME_TARGET || 'cname.luotain.app'

// Scoped to the caller's org, so a guessed id can't verify or delete someone
// else's domain.
async function authorize(id) {
  const { error, organizationId, userId } = await resolveActiveOrg()
  if (error) return { error }

  const membership = await prisma.membership.findFirst({
    where: { organizationId, userId },
    select: { role: true },
  })
  if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
    return {
      error: Response.json(
        { error: 'Only an owner or admin can manage domains' },
        { status: 403 }
      ),
    }
  }

  const domain = await prisma.domain.findFirst({
    where: { id, organizationId },
    select: { id: true, hostname: true, verified: true },
  })
  if (!domain) {
    return {
      error: Response.json({ error: 'Domain not found' }, { status: 404 }),
    }
  }
  return { domain, organizationId }
}

// POST /api/org/domains/[id]  — check the DNS record
export async function POST(request, { params }) {
  const { id } = await params
  const { error, domain } = await authorize(id)
  if (error) return error

  let verified = false
  let lastError = null

  try {
    // resolveCname, not a plain lookup: an A record pointing at the right IP
    // isn't the same as a CNAME, and only the CNAME survives us changing
    // infrastructure.
    const records = await dns.resolveCname(domain.hostname)
    const target = CNAME_TARGET.toLowerCase().replace(/\.$/, '')
    verified = records.some(
      (r) => r.toLowerCase().replace(/\.$/, '') === target
    )
    if (!verified) {
      lastError = records.length
        ? `Found a CNAME pointing at ${records[0]} instead`
        : 'No CNAME record found'
    }
  } catch (err) {
    // ENODATA and ENOTFOUND are the normal "not set up yet" cases, not faults —
    // reported as guidance rather than as an error someone should worry about.
    lastError =
      err?.code === 'ENODATA' || err?.code === 'ENOTFOUND'
        ? 'No CNAME record found yet'
        : `Lookup failed: ${err?.code || 'unknown'}`
  }

  const updated = await prisma.domain.update({
    where: { id: domain.id },
    data: { verified, lastCheckedAt: new Date(), lastError },
    select: {
      id: true,
      hostname: true,
      verified: true,
      lastCheckedAt: true,
      lastError: true,
    },
  })

  return Response.json({ domain: updated })
}

// DELETE /api/org/domains/[id]
export async function DELETE(request, { params }) {
  const { id } = await params
  const { error, domain } = await authorize(id)
  if (error) return error

  // Links on this domain would stop resolving, and their short URLs are printed
  // on things. Refused rather than cascaded — losing a domain shouldn't
  // silently break every link that used it.
  const linkCount = await prisma.link.count({ where: { domainId: domain.id } })
  if (linkCount > 0) {
    return Response.json(
      {
        error: `${linkCount} ${linkCount === 1 ? 'link uses' : 'links use'} this domain. Move or delete them first.`,
        linkCount,
      },
      { status: 409 }
    )
  }

  try {
    await prisma.domain.delete({ where: { id: domain.id } })
    return Response.json({ success: true, hostname: domain.hostname })
  } catch (err) {
    console.error('[DELETE /api/org/domains/[id]]', err)
    const first = String(err?.message || 'Unknown error')
      .split('\n')[0]
      .trim()
    return Response.json(
      {
        error: `Couldn't remove the domain: ${first}`,
        code: err?.code || null,
      },
      { status: 500 }
    )
  }
}
