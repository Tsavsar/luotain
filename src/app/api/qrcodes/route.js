import { prisma } from '@/lib/prisma'
import { resolveActiveOrg } from '@/lib/resolveActiveOrg'
import { shortUrlFor } from '@/lib/shortlink'
import { QR_COLORS, QR_PATTERNS } from '@/lib/qrdesign'

// Reused from the link create path. A QR's slug resolves at the same domain as
// a link's, so it can't be a reserved route either.
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

// GET /api/qrcodes
// Every QR in the org, with its link. Scans are counted separately from clicks
// via Click.qrCodeId, which is what lets a QR have its own analytics.
export async function GET() {
  const { error, organizationId } = await resolveActiveOrg()
  if (error) return error

  const codes = await prisma.qrCode.findMany({
    where: {
      // Scoped through the link, since QrCode has no organizationId of its
      // own — it belongs to a link, and the link belongs to an org.
      link: { organizationId, deletedAt: null },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      domain: { select: { hostname: true } },
      link: {
        select: {
          id: true,
          shortCode: true,
          destinationUrl: true,
          deletedAt: true,
          domain: { select: { hostname: true } },
        },
      },
      _count: { select: { clicks: true } },
    },
  })

  return Response.json({
    qrCodes: codes.map((q) => ({
      id: q.id,
      label: q.label,
      shortCode: q.shortCode,
      // The QR's OWN url, not the link's. This is the whole point of a QR
      // having its own slug: a scan hits this, so it can be attributed to
      // this placement rather than to the link generally.
      scanUrl: shortUrlFor(q.shortCode, q.domain.hostname),
      color: q.color,
      markerColor: q.markerColor,
      pattern: q.pattern,
      branding: q.branding,
      scans: q._count.clicks,
      createdAt: q.createdAt,
      link: {
        id: q.link.id,
        shortCode: q.link.shortCode,
        shortUrl: shortUrlFor(q.link.shortCode, q.link.domain.hostname),
        destination: q.link.destinationUrl,
      },
    })),
  })
}

// POST /api/qrcodes  { linkId, label?, color?, markerColor?, pattern?, branding? }
export async function POST(request) {
  const { error, organizationId } = await resolveActiveOrg()
  if (error) return error

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const linkId = String(body?.linkId || '')
  if (!linkId) {
    return Response.json({ error: 'Missing linkId' }, { status: 400 })
  }

  // Scoped to the caller's org, so a guessed id can't attach a QR to someone
  // else's link.
  const link = await prisma.link.findFirst({
    where: { id: linkId, organizationId },
    select: { id: true, domainId: true, deletedAt: true },
  })
  if (!link) {
    return Response.json({ error: 'Link not found' }, { status: 404 })
  }
  if (link.deletedAt) {
    return Response.json(
      { error: 'That link is in the trash. Recover it first.' },
      { status: 400 }
    )
  }

  // Validated against the design's own options rather than accepting any
  // string. A pattern the renderer doesn't know would fall through to squares,
  // and an arbitrary colour string could be anything at all.
  const allowedPatterns = new Set(QR_PATTERNS.map((p) => p.id))
  const pattern = allowedPatterns.has(body?.pattern) ? body.pattern : 'square'

  const HEX = /^#[0-9a-fA-F]{6}$/
  const color = HEX.test(body?.color || '')
    ? body.color.toLowerCase()
    : '#000000'
  const markerColor = HEX.test(body?.markerColor || '')
    ? body.markerColor.toLowerCase()
    : '#000000'
  const branding = body?.branding !== false

  const label =
    String(body?.label || '')
      .trim()
      .slice(0, 60) || 'QR code'

  // A QR's slug and a link's slug resolve at the same domain, so they share one
  // namespace — luot.link/abc can't be both. Two separate unique constraints
  // can't see each other, which is why both tables are checked here rather than
  // leaving it to the database.
  let shortCode = null
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate =
      attempt < 4
        ? randomSlug()
        : `${randomSlug()}-${Math.floor(Math.random() * 900 + 100)}`
    if (RESERVED.has(candidate)) continue

    const [linkTaken, qrTaken] = await Promise.all([
      prisma.link.findUnique({
        where: {
          domainId_shortCode: { domainId: link.domainId, shortCode: candidate },
        },
        select: { id: true },
      }),
      prisma.qrCode.findUnique({
        where: {
          domainId_shortCode: { domainId: link.domainId, shortCode: candidate },
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
      { error: "Couldn't generate a unique code. Try again." },
      { status: 500 }
    )
  }

  const created = await prisma.qrCode.create({
    data: {
      shortCode,
      label,
      linkId: link.id,
      domainId: link.domainId,
      color,
      markerColor,
      pattern,
      branding,
    },
    include: { domain: { select: { hostname: true } } },
  })

  return Response.json({
    qrCode: {
      id: created.id,
      label: created.label,
      shortCode: created.shortCode,
      scanUrl: shortUrlFor(created.shortCode, created.domain.hostname),
      color: created.color,
      markerColor: created.markerColor,
      pattern: created.pattern,
      branding: created.branding,
      scans: 0,
      createdAt: created.createdAt,
    },
  })
}
