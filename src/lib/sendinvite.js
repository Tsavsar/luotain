import { Resend } from 'resend'

// ─── Invite email ───
//
// A hosted Resend template, matching how the verification code is sent — the
// design lives in the Resend dashboard rather than in this repo.
//
// Set RESEND_INVITE_TEMPLATE_ID once the template exists. Until then this
// returns a clear "not configured" rather than throwing, because an invite row
// that was created successfully shouldn't report failure just because the mail
// couldn't go out.
const TEMPLATE_ID = process.env.RESEND_INVITE_TEMPLATE_ID
const FROM = process.env.RESEND_FROM || 'noreply@luotain.app'

function inviteUrl(token) {
  // Falls back to NEXTAUTH_URL, which is already set for auth to work — better
  // than requiring a second variable that says the same thing and can drift.
  // A relative link is useless in an email; there's no page to be relative to.
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    'https://luotain.app'
  ).replace(/\/$/, '')
  return `${base}/invite/${token}`
}

// Sends one invite. Returns { sent, error } rather than throwing: the caller
// creates several at once and one bad address shouldn't take down the batch.
export async function sendInviteEmail({
  to,
  token,
  orgName,
  inviterName,
  role,
  expiresAt,
}) {
  if (!process.env.RESEND_API_KEY) {
    return { sent: false, error: 'RESEND_API_KEY is not set' }
  }
  if (!TEMPLATE_ID) {
    return { sent: false, error: 'RESEND_INVITE_TEMPLATE_ID is not set' }
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      // The workspace name in the subject, because that's what someone needs to
      // recognise before opening — "You've been invited to Luotain" tells them
      // nothing about which team or by whom.
      subject: `${inviterName || 'Someone'} invited you to ${orgName} on Luotain`,
      template: {
        id: TEMPLATE_ID,
        // These are the variable names to use in the Resend template. All
        // strings — the verification template failed because a number was
        // passed where it declared a string, so everything here is coerced.
        variables: {
          orgName: String(orgName || 'a workspace'),
          inviterName: String(inviterName || 'A teammate'),
          inviteUrl: inviteUrl(token),
          role: role === 'ADMIN' ? 'Admin' : 'Member',
          expiresAt: new Date(expiresAt).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
        },
      },
    })

    if (error) {
      console.error('[sendInviteEmail]', to, error)
      return { sent: false, error: error.message || 'Send failed' }
    }
    return { sent: true, id: data?.id || null }
  } catch (err) {
    console.error('[sendInviteEmail]', to, err)
    return { sent: false, error: err?.message || 'Send failed' }
  }
}
