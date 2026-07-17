import { prisma } from '@/lib/prisma'
import { getCurrentUserEmail } from '@/lib/session'

export async function GET() {
  const email = await getCurrentUserEmail()

  if (!email) {
    return Response.json({ error: 'Not signed in' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    include: { organization: true },
  })

  return Response.json({
    orgName: membership?.organization?.name || 'Your Organization',
    userImage: user.image || null,
  })
}
