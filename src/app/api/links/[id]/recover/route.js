import { prisma } from '@/lib/prisma'
import { authorizeLinkAccess } from '@/lib/authorizeLinkAccess'
import { isRecoverable, RECOVERY_WINDOW_DAYS } from '@/lib/linkrecovery'

// POST /api/links/[id]/recover
export async function POST(request, { params }) {
  const { id } = await params

  const { error, link } = await authorizeLinkAccess(id)
  if (error) return error

  if (!link.deletedAt) {
    return Response.json({ error: 'Link is not deleted' }, { status: 400 })
  }

  // The 30-day window was cosmetic before this: the trash page said
  // links are "permanently deleted after 30 days", but nothing
  // enforced it, so a link deleted a year ago was still recoverable.
  // 410 rather than 400 — the resource genuinely was here and is now
  // gone, which is exactly what 410 means.
  if (!isRecoverable(link.deletedAt)) {
    return Response.json(
      {
        error: `Recovery window of ${RECOVERY_WINDOW_DAYS} days has expired`,
      },
      { status: 410 }
    )
  }

  const recovered = await prisma.link.update({
    where: { id },
    data: { deletedAt: null },
  })

  return Response.json({ success: true, link: recovered })
}
