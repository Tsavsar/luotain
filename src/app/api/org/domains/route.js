import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { resolveActiveOrg } from '@/lib/resolveActiveOrg'
import { PLANS } from '@/lib/plans'

import { addDomain, CNAME_TARGET, dnsRecordFor } from '@/lib/vercel'

// Loose on purpose. A strict RFC pattern rejects valid hostnames, and the real
// test is whether DNS resolves — this only catches obvious mistakes before they
// become a row nobody can verify.
const HOSTNAME =
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/

// GET /api/org/domains
export async function GET() {
  const { error, organizationId, userId } = await resolveActiveOrg()
  if (error) return error

  const [org, membership, domains] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { plan: true },
    }),
    prisma.membership.findFirst({
      where: { organizationId, userId },
      select: { role: true },
    }),
    prisma.domain.findMany({
      // The workspace's own domains, PLUS any platform domain (organizationId
      // null) — that's luot.link, which every workspace creates links on. It
      // was filtered out by an org-only where, so the picker on the create page
      // couldn't offer the one domain everybody uses.
      where: { OR: [{ organizationId }, { organizationId: null }] },
      orderBy: [{ verified: 'desc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        hostname: true,
        verified: true,
        verifyToken: true,
        lastCheckedAt: true,
        lastError: true,
        createdAt: true,
        organizationId: true,
        _count: { select: { links: true } },
      },
    }),
  ])

  const plan = PLANS[org?.plan] || PLANS.FREE

  // Clicks per domain, counted through its links. Grouped in SQL rather than
  // pulled and counted here — a busy workspace has far more clicks than rows
  // worth shipping to produce one number each.
  const clickRows = domains.length
    ? await prisma.click.groupBy({
        by: ['linkId'],
        where: { organizationId },
        _count: { _all: true },
      })
    : []
  const linkOwners = domains.length
    ? await prisma.link.findMany({
        where: { organizationId },
        select: { id: true, domainId: true },
      })
    : []
  const ownerOf = Object.fromEntries(linkOwners.map((l) => [l.id, l.domainId]))
  const clicksByDomain = {}
  for (const row of clickRows) {
    const d = ownerOf[row.linkId]
    if (d) clicksByDomain[d] = (clicksByDomain[d] || 0) + row._count._all
  }

  return Response.json({
    // Whether custom domains are available at all. The page shows the paywall
    // rather than the form when this is false.
    allowed: Boolean(plan.customDomain),
    planName: plan.name,
    // Only an owner or admin can add or remove one.
    role: membership?.role || null,
    cnameTarget: CNAME_TARGET,
    domains: domains.map((d) => ({
      id: d.id,
      hostname: d.hostname,
      verified: d.verified,
      // The platform's own domain, not this workspace's. Flagged so the
      // settings page can leave it out of "your domains" while the create
      // page still offers it — it's usable by everyone, owned by nobody.
      shared: d.organizationId === null,
      // Derived HERE rather than in the page, because it depends on how the
      // verify route recorded things and the two should stay in one place.
      //
      //   draft    added, never checked — still editable, still correctable
      //   pending  checked, no CNAME there yet, which is normal while DNS
      //            propagates and is NOT a failure
      //   failed   checked, and a CNAME exists pointing somewhere else — the
      //            only one of the three someone can act on right now
      //   verified done
      status: d.verified
        ? 'verified'
        : !d.lastCheckedAt
          ? 'draft'
          : d.lastError && d.lastError.startsWith('Found a CNAME')
            ? 'failed'
            : 'pending',
      // The WHOLE record, not just a host label. split('.')[0] gave
      // "shatermt" for shatermt.com — a subdomain that doesn't exist — and
      // told people to CNAME an apex, which DNS doesn't allow at all.
      dns: dnsRecordFor(d.hostname),
      links: d._count.links,
      clicks: clicksByDomain[d.id] || 0,
      lastCheckedAt: d.lastCheckedAt,
      lastError: d.lastError,
      createdAt: d.createdAt,
    })),
  })
}

// POST /api/org/domains  { hostname }
export async function POST(request) {
  const { error, organizationId, userId } = await resolveActiveOrg()
  if (error) return error

  const [org, membership] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { plan: true },
    }),
    prisma.membership.findFirst({
      where: { organizationId, userId },
      select: { role: true },
    }),
  ])

  if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
    return Response.json(
      { error: 'Only an owner or admin can add a domain' },
      { status: 403 }
    )
  }

  // Checked here, not just hidden in the UI. A paywall that only exists in the
  // client is a paywall anyone can walk through with a fetch call.
  const plan = PLANS[org?.plan] || PLANS.FREE
  if (!plan.customDomain) {
    return Response.json(
      { error: 'Custom domains are a Pro feature', upgrade: true },
      { status: 402 }
    )
  }

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Lowercased and stripped of a scheme or path, because people paste
  // "https://go.acme.com/" and mean "go.acme.com".
  const hostname = String(body?.hostname || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/\.$/, '')

  if (!hostname) {
    return Response.json(
      { error: 'Enter a domain', field: 'hostname' },
      { status: 400 }
    )
  }
  if (!HOSTNAME.test(hostname)) {
    return Response.json(
      { error: "That doesn't look like a domain", field: 'hostname' },
      { status: 400 }
    )
  }

  try {
    // hostname is globally unique, so this catches a domain claimed by ANOTHER
    // workspace as well as a duplicate here.
    const existing = await prisma.domain.findUnique({
      where: { hostname },
      select: { organizationId: true },
    })
    if (existing) {
      return Response.json(
        {
          error:
            existing.organizationId === organizationId
              ? "You've already added that domain"
              : 'That domain is already in use',
          field: 'hostname',
        },
        { status: 409 }
      )
    }

    // Registered with the HOST before the row exists. Without this the domain
    // gets a row, passes DNS verification, and still serves nothing — Vercel
    // won't answer for a hostname that isn't on the project, so there's no
    // certificate and the browser refuses before any of our code runs.
    //
    // Not awaited into failure: if Vercel is unreachable the row is still
    // created and the domain can be re-checked later. Losing the ability to add
    // a domain because an API call timed out is the worse outcome.
    const registered = await addDomain(hostname)
    if (registered?.error) {
      console.error(
        '[POST /api/org/domains] vercel add failed',
        registered.error
      )
    }

    const domain = await prisma.domain.create({
      data: {
        hostname,
        organizationId,
        verified: false,
        // randomBytes, not cuid: a cuid embeds a timestamp and counter, so one
        // token makes the next guessable.
        verifyToken: crypto.randomBytes(16).toString('hex'),
      },
      select: { id: true, hostname: true, verified: true, createdAt: true },
    })

    return Response.json({
      domain: {
        ...domain,
        dns: dnsRecordFor(domain.hostname),
        links: 0,
        clicks: 0,
      },
      cnameTarget: CNAME_TARGET,
    })
  } catch (err) {
    console.error('[POST /api/org/domains]', err)
    const first = String(err?.message || 'Unknown error')
      .split('\n')[0]
      .trim()
    return Response.json(
      { error: `Couldn't add the domain: ${first}`, code: err?.code || null },
      { status: 500 }
    )
  }
}
