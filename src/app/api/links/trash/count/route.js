import { prisma } from '@/lib/prisma'
import { resolveActiveOrg } from '@/lib/resolveActiveOrg'
import { recoveryCutoff } from '@/lib/linkrecovery'

// GET /api/links/trash/count
// Just a count, not the full trash list — this exists so the
// "Recently deleted" link on the links page knows whether to render
// itself at all, without pulling every deleted link's full data just
// to check whether the list is empty.
export async function GET() {
  const { error, organizationId } = await resolveActiveOrg()
  if (error) return error

  const count = await prisma.link.count({
    // MUST match the list route's predicate exactly, including the
    // recovery-window cutoff. Previously this counted every row with
    // a deletedAt while the list showed only unexpired ones, so an
    // org with nothing but expired deletions would see the "Recently
    // deleted" link appear and then lead to an empty page.
    where: {
      organizationId,
      deletedAt: { not: null, gte: recoveryCutoff() },
    },
  })

  return Response.json({ count })
}
