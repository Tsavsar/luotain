import TermsSidebar from '@/components/termssidebar'
import LegalBottomSpacer from '@/components/legalbottomspacer'
import { Section, List } from '@/components/legalsection'

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

export const metadata = { title: 'Terms of Service — Luotain' }

export default function TermsPage() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '0 var(--legal-side-padding)',
      }}
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
    </div>
  )
}
