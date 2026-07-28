import { prisma } from '@/lib/prisma'
import { resolveActiveOrg } from '@/lib/resolveActiveOrg'
import { shortUrlFor } from '@/lib/shortlink'
import { isRecoverable } from '@/lib/linkrecovery'

// GET /api/links/by-slug/[slug]
//
// Why "by-slug" and not /api/links/[slug]: the existing action routes
// live under /api/links/[id]/... . Next.js does not allow two
// differently-named dynamic segments at the same level ([id] and
// [slug] side by side is a build error), so this uses a static
// segment instead — the same shape /api/links/trash/count already
// uses to sit alongside [id].
//
// Looked up by shortCode rather than id because that's what the
// detail page's URL carries, and shortCode is already @unique. Still
// scoped to the caller's active org: unique globally does NOT mean
// safe to hand to anyone who guesses it.
export async function GET(request, { params }) {
  const { slug } = await params

  const { error, organizationId } = await resolveActiveOrg()
  if (error) return error

  // Deleted links ARE served here, deliberately. This previously
  // filtered on deletedAt: null, which meant the trash page's "View
  // details" had nowhere to go — it could only ever 404. The page
  // renders its own archived state off the deletedAt below, which is
  // also why a link deleted in another tab doesn't 404 on refresh: it
  // changes appearance instead of vanishing.
  const link = await prisma.link.findFirst({
    where: { shortCode: slug, organizationId },
    include: {
      domain: { select: { hostname: true } },
      qrCodes: { select: { id: true }, take: 1 },
      _count: { select: { clicks: true } },
    },
  })

  if (!link) {
    return Response.json({ error: 'Link not found' }, { status: 404 })
  }

  // Past the recovery window it's genuinely gone, whether or not a
  // cleanup job has physically removed the row yet. Serving it would
  // offer a Recover action that the recover route itself now refuses
  // with a 410.
  if (link.deletedAt && !isRecoverable(link.deletedAt)) {
    return Response.json({ error: 'Link not found' }, { status: 404 })
  }

  // Mapped to the shape the page already renders (which was built
  // against the mock data), so the component doesn't need two
  // different field vocabularies. destinationUrl -> destination,
  // shortCode -> a display shortUrl.
  return Response.json({
    link: {
      id: link.id,
      shortCode: link.shortCode,
      shortUrl: shortUrlFor(link.shortCode, link.domain.hostname),
      destination: link.destinationUrl,
      title: link.title,
      clicks: link._count.clicks,
      createdAt: link.createdAt,
      // null for a live link. Drives the archived state on the page.
      deletedAt: link.deletedAt,
      hasQrCode: link.qrCodes.length > 0,
    },
  })
}
