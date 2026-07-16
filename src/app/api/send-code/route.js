import { Resend } from 'resend'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
  const { email } = await request.json()

  if (!email) {
    return Response.json({ error: 'Email is required' }, { status: 400 })
  }

  // generate a random 5-digit code
  const code = Math.floor(10000 + Math.random() * 90000).toString()

  // sign the code + email together, expiring in 10 minutes —
  // this token IS the "memory" of the code, no database needed
  const token = jwt.sign({ email, code }, process.env.NEXTAUTH_SECRET, {
    expiresIn: '10m',
  })

  const cookieStore = await cookies()
  cookieStore.set('verification-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10, // 10 minutes, matches the token expiry above
    path: '/',
  })

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Your Luotain verification code',
      html: `<p>Your verification code is <strong>${code}</strong>. It expires in 10 minutes.</p>`,
    })
  } catch (err) {
    return Response.json({ error: 'Failed to send email' }, { status: 500 })
  }

  return Response.json({ success: true })
}
