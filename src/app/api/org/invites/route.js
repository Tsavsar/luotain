import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { resolveActiveOrg } from '@/lib/resolveActiveOrg'
import { sendInviteEmail } from '@/lib/sendinvite'

const INVITE_DAYS = 7
const MAX_PER_REQUEST = 20

// Deliberately loose. A strict RFC-compliant pattern rejects addresses that are
// perfectly valid, and the real test is whether the mail arrives — this only
// catches obvious typos before they become a pending invite nobody can accept.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// POST /api/org/invites  { invites: [{ email, role }] }
//
// Takes a batch, because the design's plus button adds rows and sending them
// one request at a time would half-succeed in a way nothing could report.
export async function POST(request) {
  const { error, organizationId, userId } = await resolveActiveOrg()
  if (error) return error

  // The org name and sender come along for the email — "invited you to Acme by
  // Shater" is what makes an invite recognisable, and neither was being loaded.
  const membership = await prisma.membership.findFirst({
    where: { organizationId, userId },
    select: {
      role: true,
      organization: { select: { name: true } },
      user: { select: { name: true, email: true } },
    },
  })
  if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
    return Response.json(
      { error: 'Only an owner or admin can invite people' },
      { status: 403 }
    )
  }

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const rows = Array.isArray(body?.invites) ? body.invites : []
  if (rows.length === 0) {
    return Response.json({ error: 'Add at least one email' }, { status: 400 })
  }
  if (rows.length > MAX_PER_REQUEST) {
    return Response.json(
      { error: `That's more than ${MAX_PER_REQUEST} at once` },
      { status: 400 }
    )
  }

  // Normalised and validated before anything is written. A batch that's half
  // valid should fail as a whole rather than sending some and reporting an
  // error — otherwise pressing Send again re-sends the ones that worked.
  const cleaned = []
  const seen = new Set()
  for (let i = 0; i < rows.length; i++) {
    const email = String(rows[i]?.email || '')
      .trim()
      .toLowerCase()
    if (!email) {
      return Response.json(
        { error: 'One of the rows has no email', index: i },
        { status: 400 }
      )
    }
    if (!EMAIL.test(email)) {
      return Response.json(
        { error: `${email} doesn't look like an email address`, index: i },
        { status: 400 }
      )
    }
    if (seen.has(email)) {
      return Response.json(
        { error: `${email} is listed twice`, index: i },
        { status: 400 }
      )
    }
    seen.add(email)

    const role = ['ADMIN', 'MEMBER'].includes(rows[i]?.role)
      ? rows[i].role
      : 'MEMBER'
    // Only an owner can create another owner, and the UI doesn't offer it —
    // this is the check that makes that true rather than merely apparent.
    cleaned.push({ email, role })
  }

  // Already a member? That's not an error worth failing the batch over, but it
  // shouldn't silently create an invite that can never be accepted either.
  const existing = await prisma.membership.findMany({
    where: { organizationId, user: { email: { in: [...seen] } } },
    select: { user: { select: { email: true } } },
  })
  const alreadyMembers = new Set(
    existing.map((m) => m.user.email.toLowerCase())
  )
  const toInvite = cleaned.filter((c) => !alreadyMembers.has(c.email))

  if (toInvite.length === 0) {
    return Response.json(
      {
        error:
          cleaned.length === 1
            ? 'They\u2019re already in this workspace'
            : 'Everyone on that list is already a member',
      },
      { status: 400 }
    )
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + INVITE_DAYS)

  try {
    // upsert, not create: re-inviting someone who already has a pending invite
    // should refresh it rather than fail on the unique constraint. That's what
    // pressing Send twice means in practice.
    const created = await Promise.all(
      toInvite.map((c) =>
        prisma.invite.upsert({
          where: {
            organizationId_email: { organizationId, email: c.email },
          },
          create: {
            email: c.email,
            role: c.role,
            organizationId,
            invitedById: userId,
            // randomBytes, not cuid. A cuid embeds a timestamp and a counter,
            // so one invite token makes the next one guessable — and this token
            // is the only thing standing between a stranger and the workspace.
            token: crypto.randomBytes(32).toString('hex'),
            expiresAt,
          },
          update: {
            role: c.role,
            invitedById: userId,
            token: crypto.randomBytes(32).toString('hex'),
            expiresAt,
          },
          // token included so it can be mailed — stripped from the response
          // below before anything leaves the server.
          select: {
            id: true,
            email: true,
            role: true,
            token: true,
            expiresAt: true,
            createdAt: true,
          },
        })
      )
    )

    // Sent AFTER the rows exist, and in parallel. Sending first would risk
    // mailing a link to a token that was never stored.
    //
    // A failed send does NOT fail the request: the invite is real and
    // cancellable either way, and rolling it back would leave the sender with
    // nothing to retry from. The count comes back so the UI can say so.
    const results = await Promise.all(
      created.map((inv) =>
        sendInviteEmail({
          to: inv.email,
          token: inv.token,
          orgName: membership.organization?.name,
          inviterName: membership.user?.name || membership.user?.email,
          role: inv.role,
          expiresAt: inv.expiresAt,
        })
      )
    )
    const failed = results.filter((r) => !r.sent)
    if (failed.length) {
      console.error(
        '[POST /api/org/invites] some emails did not send',
        failed.map((f) => f.error)
      )
    }

    return Response.json({
      // The token is stripped before this leaves the server. It's the only
      // thing standing between a stranger and the workspace, and the page that
      // called this has no use for it.
      invites: created.map(({ token, ...rest }) => rest),
      // Reported so the client can say "2 sent, 1 already a member" rather than
      // silently dropping people from the list.
      skipped: cleaned.length - toInvite.length,
      emailsFailed: failed.length,
    })
  } catch (err) {
    console.error('[POST /api/org/invites]', err)
    const first = String(err?.message || 'Unknown error')
      .split('\n')[0]
      .trim()
    return Response.json(
      { error: `Couldn't send the invites: ${first}`, code: err?.code || null },
      { status: 500 }
    )
  }
}
