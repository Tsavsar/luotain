import { prisma } from '@/lib/prisma'
import { getCurrentUserEmail } from '@/lib/session'

export async function POST(request) {
  const email = await getCurrentUserEmail()

  if (!email) {
    return Response.json({ error: 'Not signed in' }, { status: 401 })
  }

  const { orgName } = await request.json()

  if (!orgName) {
    return Response.json(
      { error: 'Organization name is required' },
      { status: 400 }
    )
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  const org = await prisma.organization.create({ data: { name: orgName } })

  await prisma.membership.create({
    data: {
      userId: user.id,
      organizationId: org.id,
      role: 'OWNER',
    },
  })

  return Response.json({ success: true })
}
