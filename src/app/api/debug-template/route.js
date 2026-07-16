import { Resend } from 'resend'

export async function GET() {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const template = await resend.templates.get(
    'a6cf23e8-73bb-4f9d-ac9e-3520f1db44c8'
  )
  return Response.json(template)
}
