import dns from 'dns/promises'
import { prisma } from '@/lib/prisma'
import { resolveActiveOrg } from '@/lib/resolveActiveOrg'

import {
  addDomain,
  getDomainConfig,
  removeDomain,
  dnsRecordFor,
  isConfigured,
} from '@/lib/vercel'

// Same loose pattern as the create route — a strict RFC one rejects valid
// hostnames, and DNS is the real test.
const HOSTNAME =
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/

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

// POST /api/org/domains/[id]  { hostname? }  — save and check
//
// Optionally renames first. The pending domain is an editable field in the
// design, so Save has to handle a corrected typo as well as a re-check —
// without that, the only way to fix "acme.con" is to remove it and start again.
export async function POST(request, { params }) {
  const { id } = await params
  const { error, domain, organizationId } = await authorize(id)
  if (error) return error

  let body
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  let hostname = domain.hostname
  const requested = String(body?.hostname || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/\.$/, '')

  if (requested && requested !== domain.hostname) {
    if (!HOSTNAME.test(requested)) {
      return Response.json(
        { error: "That doesn't look like a domain", field: 'hostname' },
        { status: 400 }
      )
    }
    // hostname is globally unique, so this catches another workspace's domain
    // as well as a duplicate here.
    const clash = await prisma.domain.findUnique({
      where: { hostname: requested },
      select: { id: true, organizationId: true },
    })
    if (clash && clash.id !== domain.id) {
      return Response.json(
        {
          error:
            clash.organizationId === organizationId
              ? "You've already added that domain"
              : 'That domain is already in use',
          field: 'hostname',
        },
        { status: 409 }
      )
    }
    hostname = requested
  }

  let verified = false
  let lastError = null

  // Vercel first, when it's configured. Its answer is the one that matters:
  // our own DNS lookup can say the CNAME is perfect while Vercel still has no
  // certificate for the name, and then a "verified" domain serves an SSL error.
  if (isConfigured()) {
    // Re-added in case it was never registered, or was removed. Adding a
    // domain that's already there is a no-op.
    await addDomain(hostname)

    const conf = await getDomainConfig(hostname)
    if (conf?.data) {
      // misconfigured is Vercel's own verdict on whether DNS reaches it.
      // The `verified` field on the ADD response is useless here — it comes
      // back true even when nothing has been set up.
      verified = conf.data.misconfigured === false
      if (!verified) {
        lastError = 'DNS not reaching us yet — check the CNAME record'
      }
      return await save(domain.id, hostname, verified, lastError)
    }
    // Falls through to a raw lookup if Vercel couldn't answer. A failed API
    // call shouldn't make verification impossible.
    console.error('[verify] vercel config unavailable', conf?.error)
  }

  // The lookup MUST match the record we ask for. It always did resolveCname, so
  // an apex — which is told to add an A record, because DNS forbids a CNAME at
  // the root — could never verify. It reported "No CNAME record found yet"
  // forever while the correct record sat there working.
  const record = dnsRecordFor(hostname)

  if (record.type === 'A') {
    try {
      const ips = await dns.resolve4(hostname)
      verified = ips.includes(record.value)
      if (!verified) {
        lastError = ips.length
          ? `Found an A record pointing at ${ips[0]} instead of ${record.value}`
          : 'No A record found yet'
      }
    } catch (err) {
      if (err?.code === 'ENODATA') {
        lastError = 'No A record found yet'
      } else if (err?.code === 'ENOTFOUND') {
        lastError = "That domain doesn't resolve — check it's spelt right"
      } else {
        lastError = `Lookup failed: ${err?.code || 'unknown'}`
      }
    }
  } else {
    try {
      const records = await dns.resolveCname(hostname)
      const target = record.value.toLowerCase().replace(/\.$/, '')
      verified = records.some(
        (r) => r.toLowerCase().replace(/\.$/, '') === target
      )
      if (!verified) {
        lastError = records.length
          ? `Found a CNAME pointing at ${records[0]} instead`
          : 'No CNAME record found'
      }
    } catch (err) {
      //   ENODATA   resolves, just no CNAME on it yet
      //   ENOTFOUND nothing resolves at that name — usually a typo
      if (err?.code === 'ENODATA') {
        lastError = 'No CNAME record found yet'
      } else if (err?.code === 'ENOTFOUND') {
        lastError = "That hostname doesn't resolve — check it's spelt right"
      } else {
        lastError = `Lookup failed: ${err?.code || 'unknown'}`
      }
    }
  }
  return await save(domain.id, hostname, verified, lastError)
}

// One place that writes the result, because there are two paths to it now —
// Vercel's verdict and a raw DNS lookup — and they must record it identically.
async function save(id, hostname, verified, lastError) {
  const updated = await prisma.domain.update({
    where: { id },
    // hostname included, so a rename and its check land together — saving the
    // new name but verifying the old one would report a result for a domain
    // that's no longer there.
    data: { hostname, verified, lastCheckedAt: new Date(), lastError },
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
    // Removed from the host too, or the project accumulates domains nobody
    // owns — and a hostname left attached can't be added by anyone else,
    // including the person who re-adds their own.
    await removeDomain(domain.hostname)
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
