import { Resend } from 'resend'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

export async function POST(request) {
  const resend = new Resend(process.env.RESEND_API_KEY)

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
      template: {
        id: 'a6cf23e8-73bb-4f9d-ac9e-3520f1db44c8',
        variables: {
          CODE: code,
        },
      },
    })
  } catch (err) {
    return Response.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
