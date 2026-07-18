import { prisma } from '@/lib/prisma'
import { getCurrentUserEmail } from '@/lib/session'
import { cookies } from 'next/headers'

export async function POST(request) {
  const email = await getCurrentUserEmail()

  if (!email) {
    return Response.json({ error: 'Not signed in' }, { status: 401 })
  }

  const { orgId } = await request.json()
  if (!orgId) {
    return Response.json({ error: 'orgId is required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  // SECURITY: verify actual membership before switching — never trust
  // an orgId from the client without checking it against the real
  // relationship in the database first.
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, organizationId: orgId },
  })

  if (!membership) {
    return Response.json(
      { error: 'Not a member of this organization' },
      { status: 403 }
    )
  }

  const cookieStore = await cookies()
  cookieStore.set('active-org-id', orgId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })

  return Response.json({ success: true })
}
