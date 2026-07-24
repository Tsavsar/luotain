import { prisma } from '@/lib/prisma'
import { authorizeLinkAccess } from '@/lib/authorizeLinkAccess'

// POST /api/links/[id]/delete
// Soft delete only — sets deletedAt, doesn't call prisma.link.delete.
// Permanent removal after the 30-day window is a separate concern
// (a scheduled job), not triggered by this route.
export async function POST(request, { params }) {
  const { id } = await params

  const { error, link } = await authorizeLinkAccess(id)
  if (error) return error

  if (link.deletedAt) {
    return Response.json({ error: 'Link is already deleted' }, { status: 400 })
  }

  const deleted = await prisma.link.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  return Response.json({ success: true, link: deleted })
}
