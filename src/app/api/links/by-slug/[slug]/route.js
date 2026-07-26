import { prisma } from '@/lib/prisma'
import { resolveActiveOrg } from '@/lib/resolveActiveOrg'
import { shortUrlFor } from '@/lib/shortlink'

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

  const link = await prisma.link.findFirst({
    where: {
      shortCode: slug,
      organizationId,
      // A trashed link shouldn't resolve here — it belongs to the
      // trash page, not its own live detail page.
      deletedAt: null,
    },
    include: {
      // Enough to know whether a QR already exists, without pulling
      // the image payload itself.
      qrCodes: { select: { id: true }, take: 1 },
      // Cheap count instead of loading every click row just to
      // display a total.
      _count: { select: { clicks: true } },
    },
  })

  if (!link) {
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
      shortUrl: shortUrlFor(link.shortCode),
      destination: link.destinationUrl,
      title: link.title,
      clicks: link._count.clicks,
      createdAt: link.createdAt,
      hasQrCode: link.qrCodes.length > 0,
    },
  })
}
