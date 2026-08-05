import { prisma } from '@/lib/prisma'
import { getCurrentUserEmail, getCurrentSessionJti } from '@/lib/session'

// GET /api/me/sessions
export async function GET() {
  const email = await getCurrentUserEmail()
  if (!email) {
    return Response.json({ error: 'Not signed in' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })
  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  const currentJti = await getCurrentSessionJti()

  const sessions = await prisma.appSession.findMany({
    where: {
      userId: user.id,
      // Expired sessions aren't active, and listing them would imply someone
      // still has access when they don't.
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastActiveAt: 'desc' },
    select: {
      id: true,
      jti: true,
      userAgent: true,
      city: true,
      country: true,
      lastActiveAt: true,
      createdAt: true,
    },
  })

  return Response.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      userAgent: s.userAgent,
      city: s.city,
      country: s.country,
      lastActiveAt: s.lastActiveAt,
      createdAt: s.createdAt,
      // Compared server-side; the jti never leaves. It's not as sensitive as
      // the token itself, but there's no reason for the browser to have it.
      isCurrent: Boolean(currentJti) && s.jti === currentJti,
    })),
  })
}

// DELETE /api/me/sessions  { id }
export async function DELETE(request) {
  const email = await getCurrentUserEmail()
  if (!email) {
    return Response.json({ error: 'Not signed in' }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const id = String(body?.id || '')
  if (!id) {
    return Response.json({ error: 'Missing session id' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })
  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  const session = await prisma.appSession.findUnique({
    where: { id },
    select: { id: true, userId: true, jti: true },
  })

  // Scoped to the caller's own sessions. Without this check anyone could
  // sign out any user on the service by guessing an id.
  if (!session || session.userId !== user.id) {
    return Response.json({ error: 'Session not found' }, { status: 404 })
  }

  const currentJti = await getCurrentSessionJti()
  if (currentJti && session.jti === currentJti) {
    // Signing yourself out from a list of devices is almost always a
    // mis-tap. The proper sign-out is in the profile menu, and refusing here
    // is friendlier than logging someone out mid-task.
    return Response.json(
      { error: "That's this device — use Log out instead" },
      { status: 400 }
    )
  }

  // Deleting the row is what actually ends that session: the next request
  // carrying its token finds no row and is treated as signed out.
  await prisma.appSession.delete({ where: { id } })

  return Response.json({ success: true })
}
