import BackButton from '@/components/backbutton'

export const metadata = {
  title: 'Terms of Service — Luotain',
}

const SECTIONS = [
  { id: 'acceptance', title: 'Acceptance of Terms' },
  { id: 'description', title: 'Description of Service' },
  { id: 'account', title: 'Account Registration' },
  { id: 'acceptable-use', title: 'Acceptable Use' },
  { id: 'subscriptions', title: 'Subscriptions and Payments' },
  { id: 'ownership', title: 'Content and Link Ownership' },
  { id: 'availability', title: 'Service Availability' },
  { id: 'termination', title: 'Termination' },
  { id: 'liability', title: 'Disclaimer and Limitation of Liability' },
  { id: 'changes', title: 'Changes to These Terms' },
  { id: 'contact', title: 'Contact' },
]

export default function TermsPage() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '80px 24px 120px',
      }}
    >
      {/* Full-width header block */}
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
        <BackButton />

        {/* Legal nav tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <a
            href='/terms'
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
          <a
            href='/privacy'
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

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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

            <div
              style={{
                width: '1px',
                height: '20px',
                background: 'var(--stroke-medium)',
              }}
            />

            <h1 className='title-h5' style={{ color: 'var(--text-strong)' }}>
              Terms of Service
            </h1>
          </div>

          <p className='para-sm' style={{ color: 'var(--text-soft)' }}>
            Last updated: July 12, 2026
          </p>
        </div>
      </div>

      {/* Two-column split — sidebar aligns with first section */}
      <div
        style={{
          width: '100%',
          maxWidth: '920px',
          display: 'flex',
          gap: '80px',
        }}
      >
        <nav
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

        <div
          style={{
            flex: 1,
            maxWidth: '720px',
            display: 'flex',
            flexDirection: 'column',
            gap: '44px',
          }}
        >
          <Section id='acceptance' title='Acceptance of Terms'>
            By creating an account or using Luotain, you agree to be bound by
            these Terms of Service. If you do not agree, do not use the service.
          </Section>

          <Section id='description' title='Description of Service'>
            Luotain provides link shortening and QR code generation, along with
            click and scan analytics. We may add, modify, or discontinue
            features at any time without prior notice.
          </Section>

          <Section id='account' title='Account Registration'>
            You must provide accurate information when creating an account. You
            are responsible for maintaining the security of your account
            credentials and for all activity that occurs under your account.
          </Section>

          <Section id='acceptable-use' title='Acceptable Use'>
            You agree not to use Luotain to create or distribute links that:
            <List
              items={[
                'Lead to phishing, malware, or fraudulent content',
                'Violate any applicable law or regulation',
                'Infringe on intellectual property rights',
                'Contain spam or unsolicited bulk messaging',
                'Impersonate any person or entity',
              ]}
            />
            We reserve the right to disable any link or account found in
            violation of this policy, without notice.
          </Section>

          <Section id='subscriptions' title='Subscriptions and Payments'>
            Luotain offers Free, Starter, and Pro plans. Paid subscriptions are
            billed through our payment processor, Lemon Squeezy, and are subject
            to their terms in addition to ours. Subscriptions renew
            automatically unless cancelled prior to the renewal date. Fees are
            non-refundable except where required by law.
          </Section>

          <Section id='ownership' title='Content and Link Ownership'>
            You retain ownership of the destination URLs and content you link to
            through Luotain. We claim no ownership over your links, but you
            grant us a limited license to store and process them in order to
            provide the service.
          </Section>

          <Section id='availability' title='Service Availability'>
            We aim to keep Luotain available at all times but do not guarantee
            uninterrupted access. We are not liable for any downtime, data loss,
            or service interruption.
          </Section>

          <Section id='termination' title='Termination'>
            We may suspend or terminate your account at any time for violation
            of these terms. You may cancel your account at any time from your
            account settings.
          </Section>

          <Section
            id='liability'
            title='Disclaimer and Limitation of Liability'
          >
            Luotain is provided "as is" without warranties of any kind. To the
            maximum extent permitted by law, we are not liable for any indirect,
            incidental, or consequential damages arising from your use of the
            service.
          </Section>

          <Section id='changes' title='Changes to These Terms'>
            We may update these Terms from time to time. Continued use of
            Luotain after changes take effect constitutes acceptance of the
            revised terms.
          </Section>

          <Section id='contact' title='Contact'>
            Questions about these Terms can be directed to{' '}
            <a
              href='mailto:legal@luotain.io'
              style={{ color: 'var(--primary-base)' }}
            >
              legal@luotain.io
            </a>
            .
          </Section>
        </div>
      </div>
    </main>
  )
}

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

function List({ items }) {
  return (
    <ul
      style={{
        margin: '10px 0 0',
        padding: 0,
        listStyle: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {items.map((item, i) => (
        <li
          key={i}
          className='para-sm'
          style={{
            color: 'var(--text-sub)',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
          }}
        >
          <span style={{ color: 'var(--text-soft)', lineHeight: '20px' }}>
            •
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

/* ─── Add to globals.css, inside the html { } rule ───
html {
  scroll-behavior: smooth;
}
*/
