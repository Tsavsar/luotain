'use client'

import { Suspense, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Map from '@/components/Map'
import BackButton from '@/components/backbutton'
import CodeInput from '@/components/codeinput'

// ─── Wrapper handles the Suspense boundary required for useSearchParams()
//     to work during static prerendering at build time. Actual page
//     content lives in VerifyContent below.
export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyContent />
    </Suspense>
  )
}

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState(false)
  const [toastState, setToastState] = useState('hidden')
  const toastTimer = useRef(null)
  const errorTimer = useRef(null)

  const CORRECT_CODE = '99999'

  function handleCodeComplete(fullCode) {
    if (fullCode === CORRECT_CODE) {
      router.push('/')
      return
    }

    clearTimeout(errorTimer.current)
    clearTimeout(toastTimer.current)

    setCodeError(true)
    setToastState('visible')

    toastTimer.current = setTimeout(() => {
      setToastState('hiding')
      setTimeout(() => setToastState('hidden'), 200)
    }, 2000)

    errorTimer.current = setTimeout(() => {
      setCodeError(false)
      setCode('')
    }, 2000)
  }

  function handleResend() {
    // stub — wire this to your actual resend endpoint later
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
          <BackButton />
          <div
            className='header'
            style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
          >
            <p className='label-md' style={{ color: 'var(--text-strong)' }}>
              Check your inbox
            </p>
            <p className='para-sm' style={{ color: 'var(--text-sub)' }}>
              We sent a verification code to{' '}
              <a style={{ color: 'var(--primary-base)' }}>
                {' '}
                {email || 'your email'}
              </a>
              . Enter the code to continue
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <CodeInput
            length={5}
            value={code}
            onChange={setCode}
            error={codeError}
            onComplete={handleCodeComplete}
          />

          <div
            className={
              toastState === 'visible'
                ? 'slide-up'
                : toastState === 'hiding'
                  ? 'slide-down'
                  : ''
            }
            style={{
              width: '100%',
              borderRadius: '16px',
              backgroundColor: 'var(--error-mute)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              height: toastState !== 'hidden' ? '52px' : '0',
              padding: toastState !== 'hidden' ? '16px' : '0 16px',
              transition:
                'height 0.35s ease, padding 0.35s ease, opacity 0.35s ease',
              overflow: 'hidden',
              opacity: toastState !== 'hidden' ? 1 : 0,
              fontSize: '12px',
              color: 'var(--error-base)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <p
              style={{
                width: '100%',
                color: 'var(--error-base)',
                fontFamily: 'var(--font-sans)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              Wrong code entered, please check and try again
            </p>
          </div>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <p className='para-sm' style={{ color: 'var(--text-sub)' }}>
              The link expires in 24 hours.
            </p>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '4px' }}>
              <p className='para-sm' style={{ color: 'var(--text-sub)' }}>
                Didn't get it?
              </p>
              <a
                onClick={handleResend}
                className='label-sm text-touch-area'
                style={{ color: 'var(--primary-base)', cursor: 'pointer' }}
              >
                Resend code
              </a>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
          fontSize: '12px',
          color: 'var(--text-soft)',
          fontFamily: 'var(--font-sans)',
          zIndex: 1,
          background: 'var(--bg-default)',
          padding: '6px 12px',
          borderRadius: 'var(--radius-full)',
        }}
      >
        By continuing, you agree to our{' '}
        <a href='/terms?from=get-started' style={{ color: 'var(--text-sub)' }}>
          Terms
        </a>{' '}
        and{' '}
        <a
          href='/privacy?from=get-started'
          style={{ color: 'var(--text-sub)' }}
        >
          Privacy Policy
        </a>
        .
      </div>

      <Map />
    </main>
  )
}
