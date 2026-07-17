import { prisma } from '@/lib/prisma'
import { getCurrentUserEmail } from '@/lib/session'

export async function POST(request) {
  const email = await getCurrentUserEmail()

  if (!email) {
    return Response.json({ error: 'Not signed in' }, { status: 401 })
  }

  const { fullName, orgName } = await request.json()

  if (!fullName || !orgName) {
    return Response.json({ error: 'Both fields are required' }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { email },
    data: { name: fullName },
  })

  const org = await prisma.organization.create({
    data: { name: orgName },
  })

  await prisma.membership.create({
    data: {
      userId: user.id,
      organizationId: org.id,
      role: 'OWNER',
    },
  })

  return Response.json({ success: true })
}
