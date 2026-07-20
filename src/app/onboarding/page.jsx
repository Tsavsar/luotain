'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Continuebutton from '@/components/continuebutton'
import Inputfield from '@/components/input'
import Map from '@/components/Map'

export default function OnboardingPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [fullName, setFullName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [shakingFullName, setShakingFullName] = useState(false)
  const [shakingOrgName, setShakingOrgName] = useState(false)

  const isValid = fullName.trim().length > 0 && orgName.trim().length > 0

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/api/check-membership')
        const data = await res.json()

        if (!data.loggedIn) {
          router.replace('/login')
          return
        }

        if (data.hasOrg) {
          router.replace('/dashboard/analytics')
          return
        }

        if (data.name) setFullName(data.name)

        setChecking(false)
      } catch (err) {
        setChecking(false)
      }
    }
    check()
  }, [router])

  function triggerShake(setShaking) {
    setShaking(false)
    setTimeout(() => setShaking(true), 10)
    setTimeout(() => setShaking(false), 310)
  }

  async function handleContinue() {
    if (submitting) return

    const fullNameEmpty = fullName.trim().length === 0
    const orgNameEmpty = orgName.trim().length === 0

    // Bounces back per-field — only the empty one(s) shake, not the
    // whole form. Same idea as the email field's error state.
    if (fullNameEmpty || orgNameEmpty) {
      if (fullNameEmpty) triggerShake(setShakingFullName)
      if (orgNameEmpty) triggerShake(setShakingOrgName)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/create-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, orgName }),
      })

      if (!res.ok) throw new Error('Failed to create organization')

      router.push('/dashboard/analytics')
    } catch (err) {
      setSubmitting(false)
    }
  }

  if (checking) return null

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
              Set up your workspace
            </p>
            <p className='para-sm' style={{ color: 'var(--text-sub)' }}>
              Tell us a bit about yourself and your organization.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Inputfield
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder='Full name'
            shaking={shakingFullName}
            lefticon={
              <svg
                width='20'
                height='20'
                viewBox='0 0 20 20'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M10 8C11.3807 8 12.5 6.88071 12.5 5.5C12.5 4.11929 11.3807 3 10 3C8.61929 3 7.5 4.11929 7.5 5.5C7.5 6.88071 8.61929 8 10 8Z'
                  fill='currentColor'
                  stroke='currentColor'
                  strokeWidth='1.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <path
                  d='M14.6642 16.455C15.6112 16.234 16.1332 15.152 15.6552 14.305C14.5412 12.332 12.4282 11 10.0002 11C7.57219 11 5.45919 12.332 4.34519 14.305C3.86719 15.152 4.38919 16.234 5.33619 16.455C8.44619 17.182 11.5552 17.182 14.6652 16.455H14.6642Z'
                  fill='currentColor'
                  stroke='currentColor'
                  strokeWidth='1.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            }
          />

          <Inputfield
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder='Organization name'
            shaking={shakingOrgName}
            lefticon={
              <svg
                width='20'
                height='20'
                viewBox='0 0 20 20'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M9 7.75H15C15.6888 7.75 16.25 8.31121 16.25 9V16.25H7.75V9C7.75 8.31121 8.31121 7.75 9 7.75ZM10 8.25C9.0323 8.25 8.25 9.03427 8.25 10V10.5C8.25 11.137 8.59112 11.6939 9.10059 12C8.59112 12.3061 8.25 12.863 8.25 13.5V14C8.25 14.9657 9.0323 15.75 10 15.75C10.9677 15.75 11.75 14.9657 11.75 14V13.5C11.75 12.8627 11.4083 12.306 10.8984 12C11.4083 11.694 11.75 11.1373 11.75 10.5V10C11.75 9.03427 10.9677 8.25 10 8.25ZM14 8.25C13.0323 8.25 12.25 9.03427 12.25 10V10.5C12.25 11.137 12.5911 11.6939 13.1006 12C12.5911 12.3061 12.25 12.863 12.25 13.5V14C12.25 14.9657 13.0323 15.75 14 15.75C14.9677 15.75 15.75 14.9657 15.75 14V13.5C15.75 12.8627 15.4083 12.306 14.8984 12C15.4083 11.694 15.75 11.1373 15.75 10.5V10C15.75 9.03427 14.9677 8.25 14 8.25Z'
                  fill='currentColor'
                  stroke='currentColor'
                  strokeWidth='1.5'
                />
                <path
                  d='M4 17V4.75397C4 4.30797 4.296 3.91497 4.725 3.79197L9.725 2.36297C10.364 2.17997 11 2.65997 11 3.32497V4.99897'
                  stroke='currentColor'
                  strokeWidth='1.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <path
                  d='M3 17H17'
                  stroke='currentColor'
                  strokeWidth='1.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            }
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
