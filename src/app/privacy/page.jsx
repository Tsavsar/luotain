import BackButton from '@/components/backbutton'

export const metadata = {
  title: 'Privacy Policy — Luotain',
}

// ─── Sidebar index items — id must match each Section's id below ───
const SECTIONS = [
  { id: 'information-we-collect', title: 'Information We Collect' },
  { id: 'how-we-use', title: 'How We Use Information' },
  { id: 'third-party', title: 'Third-Party Services' },
  { id: 'cookies', title: 'Cookies' },
  { id: 'retention', title: 'Data Retention' },
  { id: 'your-rights', title: 'Your Rights' },
  { id: 'security', title: 'Data Security' },
  { id: 'children', title: "Children's Privacy" },
  { id: 'changes', title: 'Changes to This Policy' },
  { id: 'contact', title: 'Contact' },
]

export default function PrivacyPage() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '80px 24px 120px',
      }}
    >
      {/* ═══════════════════════════════════════════════
          HEADER BLOCK
          Back button → Terms/Privacy tabs → logo + title + date
          Full-width, sits above the two-column split
      ═══════════════════════════════════════════════ */}
      <div
        style={{
          width: '100%',
          maxWidth: '920px',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
          marginBottom: '64px',
        }}
      >
        {/* --- Back button --- */}
        <BackButton />

        {/* --- Terms / Privacy tab switcher ---
             Privacy is the active tab here — bg-surface swapped to this tab */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Terms tab (inactive state — no background) */}
          <a
            href='/terms'
            className='label-sm'
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-sub)',
              textDecoration: 'none',
            }}
          >
            {/* law-shield icon */}
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='16'
              height='16'
              viewBox='0 0 18 18'
            >
              <g fill='currentColor'>
                <path d='m11.5625,15.8057c-.8008,0-1.5547-.312-2.1211-.8789l-1.4443-1.4448c-.5664-.5664-.8789-1.3198-.8789-2.1211s.3125-1.5547.8789-2.1211l2.7432-2.7427c.5615-.5649,1.3145-.8779,2.1172-.8789.8057,0,1.5596.3125,2.126.8799l1.0166,1.0171v-3.0352c0-.7646-.4893-1.4346-1.2168-1.666l-5.249-1.6797c-.3438-.1113-.7256-.1108-1.0674-.0005l-5.249,1.6797c-.7285.2319-1.2178.9019-1.2178,1.6665v6.52c0,3.5059,4.9453,5.3784,6.4629,5.8691.1758.0566.3564.0854.5371.0854s.3613-.0288.5381-.0859c.5701-.1843,1.6248-.5642,2.7191-1.1523-.2258.0535-.4568.0894-.6946.0894Z' />
                <path d='m16.7803,14.2197l-2.255-2.2554.8409-.8408c.2832-.2832.4395-.6602.4395-1.0605,0-.4014-.1562-.7778-.4395-1.0605l-1.4443-1.4448c-.2832-.2837-.6602-.4395-1.0605-.4395h-.002c-.4004.0005-.7773.1567-1.0586.4395l-2.7432,2.7427c-.2832.2832-.4395.6602-.4395,1.0605s.1562.7773.4395,1.0605l1.4443,1.4448c.2832.2832.6602.4395,1.0605.4395s.7773-.1562,1.0605-.4395l.8416-.8413,2.2551,2.2554c.1465.1465.3379.2197.5303.2197s.3838-.0732.5303-.2197c.293-.293.293-.7676,0-1.0605Z' />
              </g>
            </svg>
            Terms
          </a>

          {/* Privacy tab (active state — has bg-surface background) */}
          <a
            href='/privacy'
            className='label-sm'
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-surface)',
              color: 'var(--text-strong)',
              textDecoration: 'none',
            }}
          >
            {/* lock-circle icon */}
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='16'
              height='16'
              viewBox='0 0 48 48'
            >
              <g fill='currentColor'>
                <path
                  fillRule='evenodd'
                  clipRule='evenodd'
                  d='M24 4C20.6863 4 18 6.68629 18 10V18.5H15V10C15 5.02944 19.0294 1 24 1C28.9706 1 33 5.02944 33 10V18.5H30V10C30 6.68629 27.3137 4 24 4Z'
                />
                <path
                  fillRule='evenodd'
                  clipRule='evenodd'
                  d='M24 15C15.1634 15 8 22.1634 8 31C8 39.8366 15.1634 47 24 47C32.8366 47 40 39.8366 40 31C40 22.1634 32.8366 15 24 15ZM19 30C19 27.2386 21.2386 25 24 25C26.7614 25 29 27.2386 29 30C29 32.2388 27.5286 34.134 25.5 34.7711V39H22.5V34.7711C20.4714 34.134 19 32.2388 19 30Z'
                />
              </g>
            </svg>
            Privacy
          </a>
        </div>

        {/* --- Logo + divider + title, with date pushed to the right ---
             className='legal-title-row' lets this stack into a column on mobile
             (see globals.css @media max-width: 768px) */}
        <div
          className='legal-title-row'
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* left side: logo, divider line, page title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Luotain logo mark */}
            <svg
              width='24'
              height='26'
              viewBox='0 0 30 32'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                d='M3.59116 5.45659L11.2741 0.988578C13.5125 -0.313166 16.2804 -0.330419 18.5351 0.943317L26.274 5.31519C28.5287 6.58893 29.9277 8.96015 29.944 11.5356L29.9999 20.3755C30.0161 22.951 28.6473 25.3395 26.4088 26.6412L18.7259 31.1092C18.0545 31.4997 17.3354 31.7746 16.5969 31.9337C15.8429 32.0962 15.2017 31.4694 15.1968 30.7033L15.1787 27.833C15.174 27.0907 15.7874 26.504 16.4687 26.1982C16.5786 26.1488 16.6865 26.0934 16.792 26.0321L22.8942 22.4834C23.9601 21.8635 24.612 20.7261 24.6042 19.4997L24.5598 12.4786C24.5521 11.2522 23.8859 10.1231 22.8122 9.51651L16.6656 6.04414C15.5919 5.4376 14.2739 5.44582 13.208 6.0657L7.10579 9.61442C6.03988 10.2343 5.38802 11.3717 5.39578 12.5981L5.40876 14.6501C5.41355 15.4085 4.79823 16.0271 4.0344 16.0319L1.4106 16.0482C0.646764 16.053 0.0236675 15.4421 0.0188717 14.6837L0.000143737 11.7223C-0.0161435 9.14681 1.35274 6.75833 3.59116 5.45659Z'
                fill='var(--bg-subtle)'
              />
              <path
                d='M14.5066 30.7544C14.5113 31.5015 13.8996 32.1576 13.1722 31.9665C12.5964 31.8152 12.0868 31.5372 11.3826 31.1343L3.668 26.7204C1.42036 25.4345 0.0344782 23.0557 0.0324018 20.4801L0.0328995 18.1078C0.0330574 17.3541 0.656887 16.7413 1.41595 16.7348L4.03974 16.7185C4.80426 16.7133 5.42636 17.328 5.42476 18.0871L5.42166 19.5664C5.42265 20.7929 6.08259 21.9256 7.1529 22.538L13.2803 26.0438C13.9056 26.4016 14.4835 27.0998 14.488 27.8164L14.5066 30.7544Z'
                fill='var(--primary-base)'
              />
            </svg>

            {/* vertical divider */}
            <div
              style={{
                width: '1px',
                height: '20px',
                background: 'var(--stroke-medium)',
              }}
            />

            <h1 className='title-h5' style={{ color: 'var(--text-strong)' }}>
              Privacy Policy
            </h1>
          </div>

          {/* right side: last updated date */}
          <p className='para-sm' style={{ color: 'var(--text-soft)' }}>
            Last updated: July 12, 2026
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          TWO-COLUMN SPLIT
          Sidebar index (left) + content sections (right)
          Sidebar hides on mobile via .terms-sidebar class
      ═══════════════════════════════════════════════ */}
      <div
        style={{
          width: '100%',
          maxWidth: '920px',
          display: 'flex',
          gap: '80px',
        }}
      >
        {/* --- Sidebar index nav --- */}
        <nav
          className='terms-sidebar'
          style={{
            width: '180px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            position: 'sticky',
            top: '80px',
            height: 'fit-content',
          }}
        >
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className='para-xs'
              style={{ color: 'var(--text-soft)', textDecoration: 'none' }}
            >
              {s.title}
            </a>
          ))}
        </nav>

        {/* --- Content column: all Section blocks --- */}
        <div
          style={{
            flex: 1,
            maxWidth: '720px',
            display: 'flex',
            flexDirection: 'column',
            gap: '44px',
          }}
        >
          <Section id='information-we-collect' title='Information We Collect'>
            We collect information you provide directly, such as your email
            address and account details, and information generated through your
            use of the service, including link destinations, QR code data, click
            and scan timestamps, approximate location, and referring source.
          </Section>

          <Section id='how-we-use' title='How We Use Information'>
            We use collected information to provide and improve the service,
            generate analytics for your links and QR codes, communicate with you
            about your account, and process payments.
          </Section>

          <Section id='third-party' title='Third-Party Services'>
            We use third-party providers to operate Luotain, including Lemon
            Squeezy for payment processing and cloud infrastructure providers
            for hosting. These providers process data on our behalf under their
            own privacy policies.
          </Section>

          <Section id='cookies' title='Cookies'>
            We use cookies and similar technologies to keep you signed in and to
            understand how the service is used. You can control cookies through
            your browser settings.
          </Section>

          <Section id='retention' title='Data Retention'>
            We retain account and link data for as long as your account remains
            active. If you delete your account, associated data is removed
            within 30 days, except where retention is required by law.
          </Section>

          <Section id='your-rights' title='Your Rights'>
            Depending on your location, you may have the right to access,
            correct, export, or delete your personal data. You can exercise
            these rights from your account settings or by contacting us
            directly.
          </Section>

          <Section id='security' title='Data Security'>
            We take reasonable technical and organizational measures to protect
            your data, but no method of transmission or storage is completely
            secure.
          </Section>

          <Section id='children' title="Children's Privacy">
            Luotain is not directed at individuals under 16. We do not knowingly
            collect data from children.
          </Section>

          <Section id='changes' title='Changes to This Policy'>
            We may update this Privacy Policy periodically. Material changes
            will be communicated via email or in-app notice.
          </Section>

          {/* --- section with a mailto link inside --- */}
          <Section id='contact' title='Contact'>
            For privacy-related questions or requests, contact{' '}
            <a
              href='mailto:privacy@luotain.io'
              style={{ color: 'var(--primary-base)' }}
            >
              privacy@luotain.io
            </a>
            .
          </Section>
        </div>
      </div>
    </main>
  )
}

// ─── Reusable section wrapper: heading + body ───
// Uses <div> not <p> for the body since children can include a <ul> (List),
// and <ul> is invalid inside <p> (causes hydration errors).
function Section({ id, title, children }) {
  return (
    <div
      id={id}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        scrollMarginTop: '80px',
      }}
    >
      <h2 className='label-lg' style={{ color: 'var(--text-strong)' }}>
        {title}
      </h2>
      <div
        className='para-sm'
        style={{ color: 'var(--text-sub)', lineHeight: '22px' }}
      >
        {children}
      </div>
    </div>
  )
}
