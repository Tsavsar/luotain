import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const SESSION_COOKIE = 'app-session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

// ─── Set the shared app session ───
// Called from BOTH auth paths — verify-code directly, and NextAuth's
// signIn event for OAuth — so "who's logged in" means the same thing
// regardless of which method someone used.
export async function setAppSession(email) {
  const token = jwt.sign({ email }, process.env.NEXTAUTH_SECRET, {
    expiresIn: '30d',
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
}

// ─── Read the current user's email from the shared session ───
// Returns null if there's no session or it's invalid/expired —
// callers should treat that as "not logged in".
export async function getCurrentUserEmail() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (!token) return null

  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET)
    return decoded.email
  } catch (err) {
    return null
  }
}
