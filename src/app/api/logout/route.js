import { clearAppSession } from '@/lib/session'

// Clears the app-session cookie AND deletes its row — this is what
// email-code logins actually rely on. OAuth logins are handled separately by
// NextAuth's own signOut(), called alongside this on the client.
//
// The row delete is the new part and it matters: without it, signing out
// would leave this device still listed as an active session on every other
// device, and its token would still be accepted.
export async function POST() {
  await clearAppSession()
  return Response.json({ success: true })
}
