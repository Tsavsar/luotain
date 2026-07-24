import { prisma } from '@/lib/prisma'
import { resolveActiveOrg } from '@/lib/resolveActiveOrg'

// GET /api/links/trash/count
// Just a count, not the full trash list — this exists purely so the
// "Recently deleted" link on the links page knows whether to render
// itself at all, without pulling every deleted link's full data just
// to check if the list is empty.
export async function GET() {
  const { error, organizationId } = await resolveActiveOrg()
  if (error) return error

  const count = await prisma.link.count({
    where: { organizationId, deletedAt: { not: null } },
  })

  return Response.json({ count })
}
