import { Resend } from 'resend'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const COOLDOWN_SECONDS = 300 // 5 minutes

export async function POST(request) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { email } = await request.json()

  if (!email) {
    return Response.json({ error: 'Email is required' }, { status: 400 })
  }

  const cookieStore = await cookies()

  // Server-side rate limit — this is the part that actually matters,
  // since a client-side-only countdown can be bypassed by just
  // calling the endpoint directly. Reuses the existing
  // verification-token cookie's own `iat` (issued-at) claim, which
  // jsonwebtoken adds automatically — no separate cooldown-tracking
  // storage needed.
  const existingToken = cookieStore.get('verification-token')?.value
  if (existingToken) {
    try {
      const decoded = jwt.verify(existingToken, process.env.NEXTAUTH_SECRET)
      const secondsSinceIssued = Math.floor(Date.now() / 1000) - decoded.iat
      if (secondsSinceIssued < COOLDOWN_SECONDS) {
        return Response.json(
          {
            error: 'Please wait before requesting another code',
            retryAfter: COOLDOWN_SECONDS - secondsSinceIssued,
          },
          { status: 429 }
        )
      }
    } catch (err) {
      // expired or invalid — fine, just proceed to issue a fresh one
    }
  }

  const code = Math.floor(10000 + Math.random() * 90000).toString()

  const token = jwt.sign({ email, code }, process.env.NEXTAUTH_SECRET, {
    expiresIn: '10m',
  })

  cookieStore.set('verification-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10,
    path: '/',
  })

  try {
    const { data, error } = await resend.emails.send({
      from: 'noreply@luotain.app',
      to: email,
      subject: 'Your Luotain verification code',
      template: {
        id: 'a6cf23e8-73bb-4f9d-ac9e-3520f1db44c8',
        variables: { code: Number(code) },
      },
    })

    if (error) {
      console.error('Resend returned an error:', error)
      return Response.json(
        { error: error.message || 'Failed to send email' },
        { status: 500 }
      )
    }

    return Response.json({ success: true })
  } catch (err) {
    console.error('send-code route crashed:', err)
    return Response.json(
      { error: 'Something went wrong sending the code' },
      { status: 500 }
    )
  }
}
