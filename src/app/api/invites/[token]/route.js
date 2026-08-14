import { prisma } from '@/lib/prisma'
import { getCurrentUserEmail, setAppSession } from '@/lib/session'

// ─── Invite lookup and accept ───
// Deliberately NOT under /api/org: those routes resolve the caller's active
// workspace, and someone opening an invite may have no workspace, no session,
// and no account at all.

// A pending invite that hasn't expired, with the bits the page needs to render.
async function load(token) {
  if (!token) return null
  return prisma.invite.findUnique({
    where: { token },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
      organizationId: true,
      organization: {
        select: { name: true, image: true, avatarSeed: true, id: true },
      },
      invitedBy: { select: { name: true, email: true } },
    },
  })
}

// GET /api/invites/[token]
export async function GET(request, { params }) {
  const { token } = await params
  const invite = await load(token)

  // The same shape for "no such token" and "expired", so a stranger can't use
  // the difference to work out which tokens exist.
  if (!invite) {
    return Response.json(
      { error: 'This invite link is not valid' },
      { status: 404 }
    )
  }
  if (invite.expiresAt < new Date()) {
    return Response.json(
      { error: 'This invite has expired', expired: true },
      { status: 410 }
    )
  }

  // Whether there's already an account for this address decides what the page
  // asks for: a name, or nothing at all.
  const existing = await prisma.user.findUnique({
    where: { email: invite.email },
    select: { id: true, name: true },
  })

  return Response.json({
    invite: {
      email: invite.email,
      role: invite.role,
      orgName: invite.organization.name,
      orgId: invite.organization.id,
      orgImage: invite.organization.image,
      orgAvatarSeed: invite.organization.avatarSeed,
      invitedBy: invite.invitedBy?.name || invite.invitedBy?.email || null,
      expiresAt: invite.expiresAt,
    },
    hasAccount: Boolean(existing),
    // Prefilled when we already know it, so an existing user isn't asked to
    // retype their own name.
    knownName: existing?.name || null,
  })
}

// POST /api/invites/[token]  { name? }
//
// Accepts. Creates the account if there isn't one, joins the workspace, signs
// them in, and deletes the invite.
export async function POST(request, { params }) {
  const { token } = await params
  const invite = await load(token)

  if (!invite) {
    return Response.json(
      { error: 'This invite link is not valid' },
      { status: 404 }
    )
  }
  if (invite.expiresAt < new Date()) {
    return Response.json({ error: 'This invite has expired' }, { status: 410 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const name = String(body?.name || '')
    .trim()
    .slice(0, 60)

  try {
    // If someone is signed in as a DIFFERENT person, the invite isn't theirs to
    // accept — joining would put the wrong account in the workspace, and the
    // person who was invited would never get in.
    const signedInAs = await getCurrentUserEmail()
    if (signedInAs && signedInAs.toLowerCase() !== invite.email.toLowerCase()) {
      return Response.json(
        {
          error: `This invite is for ${invite.email}. You're signed in as ${signedInAs}.`,
          wrongAccount: true,
        },
        { status: 409 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: invite.email },
      select: { id: true, name: true },
    })

    // A name is only required when there's no account to take it from.
    if (!user && !name) {
      return Response.json(
        { error: 'Enter your name', field: 'name' },
        { status: 400 }
      )
    }

    // One transaction. A membership without the invite deleted would leave the
    // link live; the invite deleted without a membership would lock them out
    // with no way back in.
    const result = await prisma.$transaction(async (tx) => {
      const account =
        user ||
        (await tx.user.create({
          data: { email: invite.email, name },
          select: { id: true, name: true },
        }))

      // Updated rather than created blindly: someone can be invited to a
      // workspace they're already in if the invite predates them joining.
      await tx.membership.upsert({
        where: {
          userId_organizationId: {
            userId: account.id,
            organizationId: invite.organizationId,
          },
        },
        create: {
          userId: account.id,
          organizationId: invite.organizationId,
          role: invite.role,
        },
        // Role left alone on an existing membership — an old invite shouldn't
        // be able to demote someone who's since been promoted.
        update: {},
      })

      await tx.invite.delete({ where: { id: invite.id } })

      // Only set when it was missing, so accepting can't overwrite a name the
      // person has already chosen.
      if (user && !user.name && name) {
        await tx.user.update({ where: { id: account.id }, data: { name } })
      }

      return account
    })

    // Signed in as part of accepting. Making someone accept and then log in
    // separately is two hurdles for one intention.
    await setAppSession(invite.email)

    return Response.json({
      success: true,
      orgId: invite.organizationId,
      orgName: invite.organization.name,
      userId: result.id,
    })
  } catch (err) {
    console.error('[POST /api/invites/[token]]', err)
    const first = String(err?.message || 'Unknown error')
      .split('\n')[0]
      .trim()
    return Response.json(
      {
        error: `Couldn't accept the invite: ${first}`,
        code: err?.code || null,
      },
      { status: 500 }
    )
  }
}
