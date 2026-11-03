// The 30-day recovery window, in one place.
//
// This number was being written independently into the trash table's
// warning colour, the trash count route, the trash page's own "deleted
// after 30 days" copy, and now the list and recover routes. Five
// copies that all have to agree: if any one drifts, the UI starts
// making a promise the API doesn't keep (or refuses a recovery the
// page said was still available).
//
// Plain .js with no 'use client' so both server routes and client
// components can import it.
export const RECOVERY_WINDOW_DAYS = 30

// How many days must be left before the trash row turns red. Anchored
// to Figma's own example, which showed exactly one row warning at 28
// days deleted (2 days left) against others at 21 and 12 days.
export const WARNING_DAYS_REMAINING = 3

// The oldest deletedAt still inside the recovery window. Anything
// deleted before this is expired and should be treated as gone, even
// though no scheduled job has physically removed it yet.
export function recoveryCutoff(now = new Date()) {
  return new Date(now.getTime() - RECOVERY_WINDOW_DAYS * 24 * 3600 * 1000)
}

// The links a plan's link limit counts: live ones, and trashed ones still in
// the trash. Trashed links count so nobody can sit above their limit by
// cycling links through the trash. Expired ones don't: nothing physically
// removes them yet, so counting every row kept a workspace at its limit for
// good — five links trashed on Free and it could never make another, long
// after the trash had emptied. The number shown and the number enforced both
// come from here, so they can't drift apart.
export function countedLinksWhere(organizationId, now = new Date()) {
  return {
    organizationId,
    OR: [{ deletedAt: null }, { deletedAt: { gte: recoveryCutoff(now) } }],
  }
}

export function daysSinceDeleted(deletedAt, now = new Date()) {
  const ms = now.getTime() - new Date(deletedAt).getTime()
  return Math.max(0, Math.floor(ms / (24 * 3600 * 1000)))
}

export function isRecoverable(deletedAt, now = new Date()) {
  if (!deletedAt) return false
  return daysSinceDeleted(deletedAt, now) <= RECOVERY_WINDOW_DAYS
}
