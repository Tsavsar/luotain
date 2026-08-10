import { prisma } from '@/lib/prisma'
import { getCurrentUserEmail } from '@/lib/session'
import { withDefaults, sanitize } from '@/lib/preferences'

// GET /api/me/preferences
export async function GET() {
  const email = await getCurrentUserEmail()
  if (!email) {
    return Response.json({ error: 'Not signed in' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { preferences: true },
  })
  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  // Merged over the defaults, so a row written before a preference existed still
  // comes back complete and the client never has to know which keys are missing.
  return Response.json({ preferences: withDefaults(user.preferences) })
}

// PATCH /api/me/preferences
//
// Partial by design: the page sends only what changed, so two tabs open at once
// can't have one silently revert the other's unrelated setting.
export async function PATCH(request) {
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

  // Validated per key rather than stored as sent. An unknown pattern or a bad
  // timezone would otherwise reach the renderer and fail silently there instead
  // of at the boundary.
  const patch = sanitize(body)
  if (Object.keys(patch).length === 0) {
    return Response.json({ error: 'Nothing to update' }, { status: 400 })
  }

  try {
    const current = await prisma.user.findUnique({
      where: { email },
      select: { preferences: true },
    })
    if (!current) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // Merged, not replaced. Writing the patch alone would wipe every preference
    // the request didn't happen to mention.
    const next = { ...withDefaults(current.preferences), ...patch }

    const user = await prisma.user.update({
      where: { email },
      data: { preferences: next },
      select: { preferences: true },
    })

    return Response.json({ preferences: withDefaults(user.preferences) })
  } catch (err) {
    // Same reasoning as the other routes: an unhandled Prisma error becomes an
    // HTML 500 the client can't parse, so the message that explains it never
    // arrives.
    console.error('[PATCH /api/me/preferences]', err)
    const first = String(err?.message || 'Unknown error')
      .split('\n')[0]
      .trim()
    return Response.json(
      { error: `Couldn't save preferences: ${first}`, code: err?.code || null },
      { status: 500 }
    )
  }
}
