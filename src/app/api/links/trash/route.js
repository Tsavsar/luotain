import { prisma } from '@/lib/prisma'
import { resolveActiveOrg } from '@/lib/resolveActiveOrg'
import { recoveryCutoff } from '@/lib/linkrecovery'
import { shortUrlFor } from '@/lib/shortlink'

// GET /api/links/trash
//
// The list to go with the count that already existed. Without this
// there was no way to read real trashed links at all, which is why the
// trash page was reading mock data while its Recover button called the
// real API — every recovery failed with a 404 because the ids it sent
// ("trash-swift-otter") don't exist in the database.
export async function GET() {
  const { error, organizationId } = await resolveActiveOrg()
  if (error) return error

  const links = await prisma.link.findMany({
    where: {
      organizationId,
      deletedAt: { not: null, gte: recoveryCutoff() },
    },
    // Most recently deleted first — that's the one someone is most
    // likely to be here to undo.
    orderBy: { deletedAt: 'desc' },
    include: { _count: { select: { clicks: true } } },
  })

  return Response.json({
    items: links.map((l) => ({
      id: l.id,
      shortCode: l.shortCode,
      shortUrl: shortUrlFor(l.shortCode),
      destination: l.destinationUrl,
      clicks: l._count.clicks,
      deletedAt: l.deletedAt,
    })),
  })
}
