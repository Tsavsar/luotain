import { prisma } from '@/lib/prisma'
import { resolveActiveOrg } from '@/lib/resolveActiveOrg'

// GET /api/org/members
// Members and pending invites in one call — the page shows both lists and
// splitting them would mean two round trips for one screen.
export async function GET() {
  const { error, organizationId, userId } = await resolveActiveOrg()
  if (error) return error

  const [memberships, invites] = await Promise.all([
    prisma.membership.findMany({
      where: { organizationId },
      // Oldest first. NOT ordered by role here: Prisma sorts an enum
      // alphabetically, which gives ADMIN, MEMBER, OWNER — the owner would come
      // last. Ranked in JS below instead.
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            avatarSeed: true,
          },
        },
      },
    }),
    prisma.invite.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        expiresAt: true,
        createdAt: true,
        invitedBy: { select: { name: true, email: true } },
      },
    }),
  ])

  const me = memberships.find((m) => m.user.id === userId)

  // Owner, then admins, then members. An explicit rank rather than the enum's
  // own order, which is alphabetical and puts the owner at the bottom.
  const RANK = { OWNER: 0, ADMIN: 1, MEMBER: 2 }
  const ordered = [...memberships].sort(
    (a, b) => (RANK[a.role] ?? 9) - (RANK[b.role] ?? 9)
  )

  return Response.json({
    // The caller's own role, so the page knows whether to offer Invite at all
    // rather than showing a button that 403s.
    role: me?.role || null,
    members: ordered.map((m) => ({
      id: m.id,
      role: m.role,
      joinedAt: m.createdAt,
      isYou: m.user.id === userId,
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      image: m.user.image,
      avatarSeed: m.user.avatarSeed,
    })),
    invites: invites.map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      createdAt: i.createdAt,
      expiresAt: i.expiresAt,
      // Computed here rather than in the client: an invite that expired while
      // the page was open should read as expired without a refresh.
      expired: i.expiresAt < new Date(),
      invitedBy: i.invitedBy?.name || i.invitedBy?.email || null,
    })),
  })
}
