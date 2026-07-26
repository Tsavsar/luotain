import { prisma } from '@/lib/prisma'
import { resolveActiveOrg } from '@/lib/resolveActiveOrg'
import { shortUrlFor } from '@/lib/shortlink'

// GET /api/links
//
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
