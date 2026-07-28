import { prisma } from '@/lib/prisma'
import { resolveActiveOrg } from '@/lib/resolveActiveOrg'
import { shortUrlFor } from '@/lib/shortlink'
import { isRecoverable } from '@/lib/linkrecovery'

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
      // A count, not the rows. Loading every click just to show a
      // total would be the single most expensive thing on the page —
      // Click is the highest-volume table in the schema.
      _count: { select: { clicks: true } },
    },
  })

  return Response.json({
    links: links.map((l) => ({
      id: l.id,
      shortCode: l.shortCode,
      shortUrl: shortUrlFor(l.shortCode),
      destination: l.destinationUrl,
      title: l.title,
      clicks: l._count.clicks,
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

  const requestedSlug = String(body?.slug || '').trim()

  if (requestedSlug) {
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
    const existing = await prisma.link.findUnique({
      where: { shortCode: requestedSlug },
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
      const taken = await prisma.link.findUnique({
        where: { shortCode: candidate },
        select: { id: true },
      })
      if (!taken) {
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
    },
  })

  return Response.json({
    link: {
      id: link.id,
      shortCode: link.shortCode,
      shortUrl: shortUrlFor(link.shortCode),
      destination: link.destinationUrl,
      title: link.title,
      clicks: 0,
      createdAt: link.createdAt,
      deletedAt: null,
    },
  })
}
