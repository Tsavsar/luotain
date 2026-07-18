import { cookies } from 'next/headers'

// Clears the custom app-session cookie — this is what email-code
// logins actually rely on. OAuth logins are handled separately by
// NextAuth's own signOut(), called alongside this on the client.
export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete('app-session')
  return Response.json({ success: true })
}
