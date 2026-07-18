import { prisma } from '@/lib/prisma'
import { getCurrentUserEmail } from '@/lib/session'
import { cookies } from 'next/headers'

export async function GET() {
  const email = await getCurrentUserEmail()

  if (!email) {
    return Response.json({ error: 'Not signed in' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: { organization: true },
    orderBy: { createdAt: 'asc' },
  })

  if (memberships.length === 0) {
    return Response.json({
      orgName: 'Your Organization',
      activeOrgId: null,
      allOrgs: [],
      userImage: user.image || null,
    })
  }

  const cookieStore = await cookies()
  const requestedActiveId = cookieStore.get('active-org-id')?.value

  // Never trust the cookie value blindly — only treat it as active if
  // it actually matches a real membership. Otherwise fall back to the
  // first org and reset the cookie so things stay consistent.
  let activeMembership = memberships.find(
    (m) => m.organizationId === requestedActiveId
  )

  if (!activeMembership) {
    activeMembership = memberships[0]
    cookieStore.set('active-org-id', activeMembership.organizationId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
  }

  return Response.json({
    orgName: activeMembership.organization.name,
    activeOrgId: activeMembership.organizationId,
    allOrgs: memberships.map((m) => ({
      id: m.organizationId,
      name: m.organization.name,
    })),
    userImage: user.image || null,
  })
}
