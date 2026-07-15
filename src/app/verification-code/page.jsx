'use client'

import { useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Map from '@/components/Map'
import BackButton from '@/components/backbutton'
import CodeInput from '@/components/codeinput'

// NOTE: renamed from Getstarted() — this file is copy-pasted from the
// get-started page but is actually the code-verification page. The
// function name didn't affect routing (Next.js uses the file path,
// not the function name) but it was misleading for future edits.
export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState(false)
  const [toastState, setToastState] = useState('hidden')
  const toastTimer = useRef(null)
  const errorTimer = useRef(null)

  // Test code for now — only "99999" is treated as correct.
  // Swap this for a real verification API call once that's ready.
  const CORRECT_CODE = '99999'

  function handleCodeComplete(fullCode) {
    if (fullCode === CORRECT_CODE) {
      router.push('/') // placeholder destination until a dashboard exists
      return
    }

    // wrong code — CodeInput shakes on its own the moment codeError
    // flips true (its .is-shaking class reacts to the error prop),
    // so no separate shake timing needs managing here anymore.
    clearTimeout(errorTimer.current)
    clearTimeout(toastTimer.current)

    setCodeError(true)
    setToastState('visible')

    toastTimer.current = setTimeout(() => {
      setToastState('hiding')
      setTimeout(() => setToastState('hidden'), 200)
    }, 2000)

    // clear the error AND the wrong digits after the same window,
    // so the user gets a fresh set of empty cells to retry
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
        {/* back + header text */}
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
              {/* was {Inputfield.email} — that referenced the component
                  itself, not an email value. Now reads from ?email= on
                  the URL, same as we set up when routing here. */}
              We sent a verification link to {email || 'your email'}. Click it
              to activate your account.
            </p>
          </div>
        </div>

        {/* code field */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <CodeInput
            length={5}
            value={code}
            onChange={setCode}
            error={codeError}
            onComplete={handleCodeComplete}
          />

          {/* error toast */}
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
              {/* fixed: className had a comma in it ('label-sm, text-touch-area'),
                  which tried to apply a class literally named "label-sm," —
                  space-separated is correct */}
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

      {/* Terms */}
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
