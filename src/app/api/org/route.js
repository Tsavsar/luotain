import { prisma } from '@/lib/prisma'
import { resolveActiveOrg } from '@/lib/resolveActiveOrg'

// GET /api/org
export async function GET() {
  const { error, organizationId } = await resolveActiveOrg()
  if (error) return error

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      image: true,
      avatarSeed: true,
      plan: true,
      createdAt: true,
      updatedAt: true,
    },
  })
  if (!org) {
    return Response.json({ error: 'Workspace not found' }, { status: 404 })
  }

  return Response.json({ organization: org })
}

// PATCH /api/org  { name?, image?, avatarSeed?, removeImage?, rerollAvatar? }
export async function PATCH(request) {
  const { error, organizationId, userId } = await resolveActiveOrg()
  if (error) return error

  // Only an owner or admin can rename the workspace. Without this any member
  // could rename it for everyone — the account settings page next door is
  // editing your OWN record, so it needs no equivalent check, which is exactly
  // why it's easy to forget here.
  const membership = await prisma.membership.findFirst({
    where: { organizationId, userId },
    select: { role: true },
  })
  if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
    return Response.json(
      { error: 'Only an owner or admin can change workspace settings' },
      { status: 403 }
    )
  }

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const data = {}

  if (typeof body?.name === 'string') {
    const name = body.name.trim()
    if (!name) {
      return Response.json(
        { error: 'Give the workspace a name', field: 'name' },
        { status: 400 }
      )
    }
    if (name.length > 60) {
      return Response.json(
        { error: 'That name is too long', field: 'name' },
        { status: 400 }
      )
    }
    data.name = name
  }

  // Same rules as the account avatar: data URLs only, and a size cap. An
  // arbitrary http URL would let this become a tracking pixel pointed at every
  // member of the workspace.
  if (body?.removeImage) {
    data.image = null
  } else if (typeof body?.image === 'string') {
    if (!/^data:image\/(png|jpeg|webp);base64,/.test(body.image)) {
      return Response.json(
        { error: 'That file type is not supported', field: 'image' },
        { status: 400 }
      )
    }
    if (body.image.length > 1_400_000) {
      return Response.json(
        { error: 'That image is too large', field: 'image' },
        { status: 400 }
      )
    }
    data.image = body.image
  }

  if (typeof body?.avatarSeed === 'string' && body.avatarSeed) {
    data.avatarSeed = body.avatarSeed.slice(0, 40)
  } else if (body?.rerollAvatar) {
    data.avatarSeed = Math.random().toString(36).slice(2, 12)
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ error: 'Nothing to update' }, { status: 400 })
  }

  try {
    const org = await prisma.organization.update({
      where: { id: organizationId },
      data,
      select: {
        id: true,
        name: true,
        image: true,
        avatarSeed: true,
        plan: true,
        updatedAt: true,
      },
    })
    return Response.json({ organization: org })
  } catch (err) {
    console.error('[PATCH /api/org]', err)
    const first = String(err?.message || 'Unknown error')
      .split('\n')[0]
      .trim()
    return Response.json(
      {
        error: `Couldn't save the workspace: ${first}`,
        code: err?.code || null,
      },
      { status: 500 }
    )
  }
}
