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
      avatarSeed: true,
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
      // Falls back to the id so there's always a stable seed, even for
      // accounts that predate the column.
      avatarSeed: user.avatarSeed || user.id,
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

  // Two optional actions alongside the name. Both are explicit flags
  // rather than inferred from a null value, so an accidental omission
  // can't silently wipe someone's photo.
  const removeImage = body?.removeImage === true
  const rerollAvatar = body?.rerollAvatar === true
  // A data URL, produced by the client after resizing. Stored inline
  // rather than in object storage: an avatar resized to 256px is tens of
  // kilobytes, which a TEXT column handles fine, and it means no bucket,
  // no signed URLs and no second service to keep alive. Worth revisiting
  // if avatars ever get larger than this.
  const image = typeof body?.image === 'string' ? body.image : null
  const avatarSeed =
    typeof body?.avatarSeed === 'string' ? body.avatarSeed : null

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

  if (image !== null) {
    // Only images, and only data URLs. Accepting an arbitrary http URL here
    // would let someone point the avatar at a tracking pixel or a host they
    // control, which then loads for every viewer of that profile.
    if (!/^data:image\/(png|jpeg|webp);base64,/.test(image)) {
      return Response.json(
        { error: 'That file type is not supported', field: 'image' },
        { status: 400 }
      )
    }
    // ~1.4MB of base64, which is roughly 1MB of image. The client resizes
    // well below this; the cap is here for anything that bypasses it.
    if (image.length > 1_400_000) {
      return Response.json(
        { error: 'That image is too large', field: 'image' },
        { status: 400 }
      )
    }
  }

  const user = await prisma.user.update({
    where: { email },
    data: {
      name,
      // Stamped here rather than by @updatedAt, so it tracks changes to
      // the fields this page owns instead of any write to the row.
      profileUpdatedAt: new Date(),
      ...(removeImage ? { image: null } : {}),
      ...(image !== null ? { image } : {}),
      // The seed is generated client-side so the preview and the saved
      // value are the same gradient — generating it here would mean the
      // person sees one gradient before saving and a different one after.
      ...(avatarSeed ? { avatarSeed } : {}),
      ...(rerollAvatar && !avatarSeed
        ? { avatarSeed: Math.random().toString(36).slice(2, 12) }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      avatarSeed: true,
      profileUpdatedAt: true,
    },
  })

  return Response.json({
    user: {
      name: user.name || '',
      email: user.email || '',
      image: user.image || null,
      avatarSeed: user.avatarSeed || user.id,
      profileUpdatedAt: user.profileUpdatedAt,
    },
  })
}
