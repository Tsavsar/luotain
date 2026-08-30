import { prisma } from '@/lib/prisma'
import { resolveActiveOrg } from '@/lib/resolveActiveOrg'
import { SHORT_DOMAIN, shortUrlFor } from '@/lib/shortlink'
import { isRecoverable } from '@/lib/linkrecovery'
import { linkLimitReason, customSlugReason } from '@/lib/plans'

// Both methods for /api/links live here — Next.js resolves every verb
// for a path from one route.js, so the list and the create can't be
// separate files.

// ─── GET /api/links ───
// The active links for the caller's org. This was the piece blocking
// everything else: with mock data off the table had no rows at all, so
// the real delete path, the undo toast, the trash list and recovery
// were all unreachable in practice even once their endpoints existed.
//
// Returns the same field names the table already renders against
// (which were shaped by the mock data), so nothing downstream needs a
// second vocabulary: destinationUrl -> destination, shortCode -> a
// composed shortUrl.
export async function GET() {
  const { error, organizationId } = await resolveActiveOrg()
  if (error) return error

  const links = await prisma.link.findMany({
    where: {
      organizationId,
      // Trashed links belong to the trash page, not this list. This is
      // the "is null" half of the pair the compound index
      // [organizationId, deletedAt] was added for.
      deletedAt: null,
    },
    orderBy: { createdAt: 'desc' },
    include: {
      // The hostname is needed to compose a usable short URL — a link on
      // a custom domain composed from the default constant would print a
      // URL that doesn't resolve.
      domain: { select: { hostname: true } },
      // A count, not the rows. Loading every click just to show a
      // total would be the single most expensive thing on the page —
      // Click is the highest-volume table in the schema.
      _count: { select: { clicks: true } },
      // Just the id of the code, if there is one. The create page needs to
      // know whether designing means CREATING a code or EDITING the existing
      // one — without this it always said "Create code", and re-designing an
      // existing code offered to make a second.
      //
      // take: 1 rather than the full relation: the answer is "is there one",
      // and loading every code for every link to answer a boolean would be
      // wasteful on a page that lists them all.
      qrCodes: { select: { id: true }, take: 1 },
    },
  })

  return Response.json({
    links: links.map((l) => ({
      id: l.id,
      shortCode: l.shortCode,
      shortUrl: shortUrlFor(l.shortCode, l.domain.hostname),
      destination: l.destinationUrl,
      title: l.title,
      clicks: l._count.clicks,
      qrCodeId: l.qrCodes?.[0]?.id ?? null,
      createdAt: l.createdAt,
    })),
  })
}

// Word lists for generated slugs. Adjective + animal reads as
// deliberate rather than random, which matters because this is the
// thing people will read aloud and type by hand.
const ADJECTIVES = [
  'swift',
  'quick',
  'clever',
  'bright',
  'calm',
  'bold',
  'keen',
  'brave',
  'quiet',
  'warm',
  'sharp',
  'gentle',
  'lucky',
  'noble',
  'plain',
  'proud',
]
const ANIMALS = [
  'otter',
  'fox',
  'crow',
  'heron',
  'lynx',
  'moth',
  'wren',
  'hare',
  'seal',
  'ibis',
  'stag',
  'mole',
  'newt',
  'owl',
  'pike',
  'toad',
]

function randomSlug() {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const n = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
  return `${a}-${n}`
}

// Same shape the client validates against, kept here because client
// validation is a convenience and this is the one that actually counts.
const SLUG_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,48}[a-zA-Z0-9])?$/

// Reserved so a link can never shadow a real route. /dashboard/links
// and friends live under the app, but a short link resolves at the
// domain root, so anything here would be ambiguous at best.
const RESERVED = new Set([
  'api',
  'dashboard',
  'login',
  'logout',
  'signup',
  'onboarding',
  'settings',
  'billing',
  'terms',
  'privacy',
  'new-org',
  'admin',
  'static',
  '_next',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
])

function normalizeDestination(raw) {
  const trimmed = String(raw || '').trim()
  if (!trimmed) return { error: 'Enter a destination URL' }

  // Accept "example.com/page" and assume https, which is what people
  // actually paste. Rejecting it would be technically correct and
  // quietly infuriating.
  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`

  let url
  try {
    url = new URL(withScheme)
  } catch {
    return { error: "That doesn't look like a valid URL" }
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { error: 'Only http and https links are supported' }
  }
  if (!url.hostname.includes('.')) {
    return { error: "That doesn't look like a valid URL" }
  }
  return { url: url.toString() }
}

// POST /api/links
export async function POST(request) {
  const { error, userId, organizationId } = await resolveActiveOrg()
  if (error) return error

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const destination = normalizeDestination(body?.destination)
  if (destination.error) {
    return Response.json(
      { error: destination.error, field: 'destination' },
      { status: 400 }
    )
  }

  // Resolve the domain first — everything below is scoped to it, since a
  // slug is only unique within one.
  const requestedHostname = String(body?.domain || '').trim()

  let domainRecord = requestedHostname
    ? await prisma.domain.findUnique({
        where: { hostname: requestedHostname },
        select: {
          id: true,
          hostname: true,
          verified: true,
          organizationId: true,
        },
      })
    : null

  // Nothing asked for: fall back to SHORT_DOMAIN, then to whatever platform
  // domain actually exists. The constant alone wasn't enough — it's read from
  // an env var at build time, so a deployment made before the domain changed
  // keeps handing out the old hostname however the database looks.
  if (!requestedHostname) {
    domainRecord =
      (await prisma.domain.findUnique({
        where: { hostname: SHORT_DOMAIN },
        select: {
          id: true,
          hostname: true,
          verified: true,
          organizationId: true,
        },
      })) ||
      (await prisma.domain.findFirst({
        where: { organizationId: null, verified: true },
        // Newest wins. If both an old and a new platform domain are present,
        // the new one is the one that was added on purpose.
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          hostname: true,
          verified: true,
          organizationId: true,
        },
      }))
  }

  if (!domainRecord) {
    return Response.json(
      { error: 'Unknown domain', field: 'domain' },
      { status: 400 }
    )
  }
  if (!domainRecord.verified) {
    return Response.json(
      { error: 'That domain is not verified yet', field: 'domain' },
      { status: 400 }
    )
  }
  // A custom domain belongs to one org. Checked server-side rather than
  // trusting the picker, since the request body is just a hostname
  // string and nothing stops it naming someone else's.
  if (
    domainRecord.organizationId &&
    domainRecord.organizationId !== organizationId
  ) {
    return Response.json(
      { error: 'That domain is not available to you', field: 'domain' },
      { status: 403 }
    )
  }

  // ─── Plan limits ───
  // Enforced here, server-side, not just in the UI. The interface hides what
  // a plan can't do, but the endpoint is what actually protects it — a
  // hand-rolled request would otherwise bypass every limit.
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { plan: true },
  })

  const linkCount = await prisma.link.count({
    // Trashed links still count. They're recoverable for 30 days, so the slug
    // and the record both still exist — not counting them would let someone
    // sit permanently above their limit by cycling links through the trash.
    where: { organizationId },
  })

  const limitReason = linkLimitReason(org?.plan, linkCount)
  if (limitReason) {
    return Response.json(
      { error: limitReason, code: 'LINK_LIMIT', plan: org?.plan },
      // 402, not 403: this isn't a permissions problem, it's a billing one,
      // and the client can tell them apart to decide whether to show the
      // upgrade card.
      { status: 402 }
    )
  }

  const requestedSlug = String(body?.slug || '').trim()

  if (requestedSlug) {
    const slugReason = customSlugReason(org?.plan)
    if (slugReason) {
      return Response.json(
        {
          error: slugReason,
          code: 'CUSTOM_SLUG',
          plan: org?.plan,
          field: 'slug',
        },
        { status: 402 }
      )
    }

    if (!SLUG_PATTERN.test(requestedSlug)) {
      return Response.json(
        {
          error: 'Use letters, numbers and hyphens only',
          field: 'slug',
        },
        { status: 400 }
      )
    }
    if (RESERVED.has(requestedSlug.toLowerCase())) {
      return Response.json(
        { error: 'That slug is reserved', field: 'slug' },
        { status: 400 }
      )
    }

    // shortCode is globally unique, and a trashed link still holds
    // its own. So a collision has two very different causes and they
    // need different messages: someone else's live link is a dead end,
    // but the caller's own trashed link is recoverable and saying so
    // is far more useful than "already taken".
    // Compound key now — shortCode alone is no longer unique.
    const existing = await prisma.link.findUnique({
      where: {
        domainId_shortCode: {
          domainId: domainRecord.id,
          shortCode: requestedSlug,
        },
      },
      select: { organizationId: true, deletedAt: true },
    })
    if (existing) {
      const ownedByCaller = existing.organizationId === organizationId
      if (
        ownedByCaller &&
        existing.deletedAt &&
        isRecoverable(existing.deletedAt)
      ) {
        return Response.json(
          {
            error: 'That slug is in your trash. Recover it or pick another',
            field: 'slug',
            recoverable: true,
          },
          { status: 409 }
        )
      }
      return Response.json(
        { error: 'That slug is already taken', field: 'slug' },
        { status: 409 }
      )
    }
  }

  // Generated slugs retry on collision rather than failing. The odds
  // are low (16 x 16 pairs plus a numeric suffix) but "create failed,
  // try again" for a slug the person never chose would be nonsense.
  let shortCode = requestedSlug
  if (!shortCode) {
    for (let attempt = 0; attempt < 8; attempt++) {
      const candidate =
        attempt < 4
          ? randomSlug()
          : `${randomSlug()}-${Math.floor(Math.random() * 900 + 100)}`
      // Checks the QrCode table too: a QR's slug resolves at the same
      // domain, so luot.link/abc can't be both. Two separate unique
      // constraints can't see each other, which is why this has to be
      // checked here rather than left to the database.
      const [linkTaken, qrTaken] = await Promise.all([
        prisma.link.findUnique({
          where: {
            domainId_shortCode: {
              domainId: domainRecord.id,
              shortCode: candidate,
            },
          },
          select: { id: true },
        }),
        prisma.qrCode.findUnique({
          where: {
            domainId_shortCode: {
              domainId: domainRecord.id,
              shortCode: candidate,
            },
          },
          select: { id: true },
        }),
      ])
      if (!linkTaken && !qrTaken) {
        shortCode = candidate
        break
      }
    }
    if (!shortCode) {
      return Response.json(
        { error: "Couldn't generate a unique slug. Try again" },
        { status: 500 }
      )
    }
  }

  const link = await prisma.link.create({
    data: {
      shortCode,
      destinationUrl: destination.url,
      title: body?.title ? String(body.title).trim() : null,
      organizationId,
      createdById: userId,
      domainId: domainRecord.id,
    },
  })

  return Response.json({
    link: {
      id: link.id,
      shortCode: link.shortCode,
      shortUrl: shortUrlFor(link.shortCode, domainRecord.hostname),
      destination: link.destinationUrl,
      title: link.title,
      clicks: 0,
      createdAt: link.createdAt,
      deletedAt: null,
    },
  })
}
