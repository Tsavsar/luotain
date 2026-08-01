import { prisma } from '@/lib/prisma'
import { getCurrentUserEmail } from '@/lib/session'

// GET /api/me — the signed-in user's own profile.
//
// Separate from /api/dashboard-info, which answers "which org am I in and
// what can I switch to". This answers "who am I", and the settings page is
// the only thing that needs it. Overloading the other route would mean
// every dashboard page paying for fields only one page reads.
export async function GET() {
  const email = await getCurrentUserEmail()
  if (!email) {
    return Response.json({ error: 'Not signed in' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      profileUpdatedAt: true,
    },
  })
  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  return Response.json({
    user: {
      name: user.name || '',
      email: user.email || '',
      image: user.image || null,
      // Null until the profile has actually been saved once, which is what
      // renders as "Never".
      profileUpdatedAt: user.profileUpdatedAt,
    },
  })
}

// PATCH /api/me — updates the profile.
//
// Name only. Email is deliberately not editable here: it's the account's
// login identity, so changing it means re-verifying the new address and
// handling the window where neither is confirmed. A field that silently
// accepts a new email and locks someone out is worse than one that
// explains why it's read-only.
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

  const name = String(body?.name ?? '').trim()
  if (!name) {
    return Response.json(
      { error: 'Enter your name', field: 'name' },
      { status: 400 }
    )
  }
  if (name.length > 80) {
    return Response.json(
      { error: 'That name is too long', field: 'name' },
      { status: 400 }
    )
  }

  const user = await prisma.user.update({
    where: { email },
    // Stamped here rather than by @updatedAt, so it tracks changes to the
    // fields this page owns instead of any write to the row.
    data: { name, profileUpdatedAt: new Date() },
    select: {
      name: true,
      email: true,
      image: true,
      profileUpdatedAt: true,
    },
  })

  return Response.json({
    user: {
      name: user.name || '',
      email: user.email || '',
      image: user.image || null,
      profileUpdatedAt: user.profileUpdatedAt,
    },
  })
}
