import { Resend } from 'resend'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

export async function POST(request) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { email } = await request.json()

  if (!email) {
    return Response.json({ error: 'Email is required' }, { status: 400 })
  }

  const code = Math.floor(10000 + Math.random() * 90000).toString()

  const token = jwt.sign({ email, code }, process.env.NEXTAUTH_SECRET, {
    expiresIn: '10m',
  })

  const cookieStore = await cookies()
  cookieStore.set('verification-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10,
    path: '/',
  })

  // try/catch handles genuine THROWN exceptions (network failures,
  // Resend's API being unreachable, etc.) — the { error } check
  // separately handles Resend returning a normal, non-thrown error
  // response (bad template ID, etc). Need BOTH — that was the gap.
  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
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
