import { prisma } from '@/lib/prisma'
import { authorizeLinkAccess } from '@/lib/authorizeLinkAccess'

// POST /api/links/[id]/recover
export async function POST(request, { params }) {
  const { id } = await params

  const { error, link } = await authorizeLinkAccess(id)
  if (error) return error

  if (!link.deletedAt) {
    return Response.json({ error: 'Link is not deleted' }, { status: 400 })
  }

  const recovered = await prisma.link.update({
    where: { id },
    data: { deletedAt: null },
  })

  return Response.json({ success: true, link: recovered })
}
