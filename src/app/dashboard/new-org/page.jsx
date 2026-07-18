'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Continuebutton from '@/components/continuebutton'
import Inputfield from '@/components/input'
import Map from '@/components/Map'

// Same visual pattern as onboarding — org-name only this time, since
// the person's own name is already set from their first time through.
export default function NewOrgPage() {
  const router = useRouter()
  const [orgName, setOrgName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isValid = orgName.trim().length > 0

  async function handleContinue() {
    if (!isValid || submitting) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/create-additional-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgName }),
      })

      if (!res.ok) throw new Error('Failed to create organization')

      router.push('/dashboard/analytics')
    } catch (err) {
      setSubmitting(false)
    }
  }

  return (
    <main
      style={{
        position: 'relative',
        zIndex: 1,
        height: 'calc(100vh - var(--map-height))',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: '120px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '360px',
          gap: '18px',
        }}
      >
        <div
          className='topspace'
          style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
        >
          <div className='luotain-logo'>
            <svg
              width='39'
              height='42'
              viewBox='0 0 30 32'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                d='M3.59116 5.45659L11.2741 0.988578C13.5125 -0.313166 16.2804 -0.330419 18.5351 0.943317L26.274 5.31519C28.5287 6.58893 29.9277 8.96015 29.944 11.5356L29.9999 20.3755C30.0161 22.951 28.6473 25.3395 26.4088 26.6412L18.7259 31.1092C18.0545 31.4997 17.3354 31.7746 16.5969 31.9337C15.8429 32.0962 15.2017 31.4694 15.1968 30.7033L15.1787 27.833C15.174 27.0907 15.7874 26.504 16.4687 26.1982C16.5786 26.1488 16.6865 26.0934 16.792 26.0321L22.8942 22.4834C23.9601 21.8635 24.612 20.7261 24.6042 19.4997L24.5598 12.4786C24.5521 11.2522 23.8859 10.1231 22.8122 9.51651L16.6656 6.04414C15.5919 5.4376 14.2739 5.44582 13.208 6.0657L7.10579 9.61442C6.03988 10.2343 5.38802 11.3717 5.39578 12.5981L5.40876 14.6501C5.41355 15.4085 4.79823 16.0271 4.0344 16.0319L1.4106 16.0482C0.646764 16.053 0.0236675 15.4421 0.0188717 14.6837L0.000143737 11.7223C-0.0161435 9.14681 1.35274 6.75833 3.59116 5.45659Z'
                fill='#EBEBEB'
              />
              <path
                d='M14.5066 30.7544C14.5113 31.5015 13.8996 32.1576 13.1722 31.9665C12.5964 31.8152 12.0868 31.5372 11.3826 31.1343L3.668 26.7204C1.42036 25.4345 0.0344782 23.0557 0.0324018 20.4801L0.0328995 18.1078C0.0330574 17.3541 0.656887 16.7413 1.41595 16.7348L4.03974 16.7185C4.80426 16.7133 5.42636 17.328 5.42476 18.0871L5.42166 19.5664C5.42265 20.7929 6.08259 21.9256 7.1529 22.538L13.2803 26.0438C13.9056 26.4016 14.4835 27.0998 14.488 27.8164L14.5066 30.7544Z'
                fill='#FA7319'
              />
            </svg>
          </div>
          <div
            className='header'
            style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
          >
            <p className='label-md' style={{ color: 'var(--text-strong)' }}>
              Create a new organization
            </p>
            <p className='para-sm' style={{ color: 'var(--text-sub)' }}>
              Give your new workspace a name.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Inputfield
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder='Organization name'
          />

          <Continuebutton
            active={isValid && !submitting}
            label={submitting ? 'Creating...' : 'Continue'}
            onClick={handleContinue}
          />
        </div>
      </div>

      <Map />
    </main>
  )
}
