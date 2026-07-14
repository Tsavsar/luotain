import TermsSidebar from '@/components/termssidebar'
import LegalBottomSpacer from '@/components/legalbottomspacer'

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

export const metadata = {
  title: 'Privacy Policy — Luotain',
}

export default function PrivacyPage() {
  return (
    <div
      style={{ display: 'flex', justifyContent: 'center', padding: '0 24px' }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '920px',
          display: 'flex',
          gap: '80px',
        }}
      >
        <TermsSidebar sections={SECTIONS} />
        <LegalBottomSpacer lastSectionId={SECTIONS[SECTIONS.length - 1].id} />

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
    </div>
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
        scrollMarginTop: 'calc(var(--legal-header-height, 280px) + 20px)',
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
