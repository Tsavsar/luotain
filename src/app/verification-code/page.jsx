'use client'

import { Suspense, useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Map from '@/components/Map'
import BackButton from '@/components/backbutton'
import CodeInput from '@/components/codeinput'
import Alert from '@/components/alert'

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyContent />
    </Suspense>
  )
}

function formatCooldown(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function CheckIcon() {
  return (
    <svg
      width='20'
      height='20'
      viewBox='0 0 20 20'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M16.6667 5L7.5 14.1667L3.33334 10'
        stroke='var(--success-base)'
        strokeWidth='1.67'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
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

  const [resendCooldown, setResendCooldown] = useState(300)
  const [resendToastState, setResendToastState] = useState('hidden')
  const [checkKey, setCheckKey] = useState(0) // bumped on each real "show" — forces Alert to remount so .check-reveal replays instead of only running once on initial page load
  const resendToastTimer = useRef(null)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  function showResendToast() {
    setCheckKey((k) => k + 1)
    clearTimeout(resendToastTimer.current)
    setResendToastState('visible')
    resendToastTimer.current = setTimeout(() => {
      setResendToastState('hiding')
      setTimeout(() => setResendToastState('hidden'), 200)
    }, 2500)
  }

  async function handleCodeComplete(fullCode) {
    try {
      const res = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: fullCode }),
      })

      if (!res.ok) throw new Error('Invalid code')

      const data = await res.json()
      router.push(data.hasOrg ? '/dashboard' : '/onboarding')
    } catch (err) {
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
  }

  async function handleResend() {
    if (resendCooldown > 0) return

    try {
      const res = await fetch('/api/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data.retryAfter) setResendCooldown(data.retryAfter)
        return
      }

      setResendCooldown(300)
      showResendToast()
    } catch (err) {
      // silent
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
          <BackButton />
          <div
            className='header'
            style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
          >
            <p className='label-md' style={{ color: 'var(--text-strong)' }}>
              Check your inbox
            </p>
            <p className='para-sm' style={{ color: 'var(--text-sub)' }}>
              We sent a verification code to {email || 'your email'}. Enter the
              code to continue
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

          {/* Error toast — unchanged */}
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

          {/* Resend confirmation — now the real Figma-spec Alert
              component (node 308:851). Outer div still owns the
              height-collapse animation, recalibrated to 36px to match
              Alert's tighter 8px padding (vs the error toast's 52px
              at 16px padding). Alert itself owns all visual styling. */}
          <div
            className={
              resendToastState === 'visible'
                ? 'slide-up'
                : resendToastState === 'hiding'
                  ? 'slide-down'
                  : ''
            }
            style={{
              maxHeight: resendToastState !== 'hidden' ? '100px' : '0',
              overflow: 'hidden',
              opacity: resendToastState !== 'hidden' ? 1 : 0,
              transition: 'max-height 0.35s ease, opacity 0.35s ease',
            }}
          >
            <Alert
              key={checkKey}
              icon={<CheckIcon />}
              message='New code has been sent'
            />
          </div>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <p className='para-sm' style={{ color: 'var(--text-sub)' }}>
              The code expires in 24 hours.
            </p>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '4px' }}>
              <p className='para-sm' style={{ color: 'var(--text-sub)' }}>
                Didn't get it?
              </p>
              {resendCooldown > 0 ? (
                <p className='para-sm' style={{ color: 'var(--text-soft)' }}>
                  Resend available in {formatCooldown(resendCooldown)}
                </p>
              ) : (
                <a
                  onClick={handleResend}
                  className='label-sm text-touch-area'
                  style={{ color: 'var(--primary-base)', cursor: 'pointer' }}
                >
                  Resend code
                </a>
              )}
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

      {/* TEMPORARY — testing controls for the Alert preview. Remove
          once you've confirmed the design, same as ThemeToggle
          earlier tonight. Reuses the real resendToastState/
          resendToastTimer so it goes through the exact same
          slide-up/slide-down animation as the real resend flow —
          just without the automatic 2.5s auto-hide, so it stays
          visible until you dismiss it yourself. */}
      {/* <div
        style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 999,
          display: 'flex',
          gap: '8px',
        }}
      >
        <button
          onClick={() => {
            setCheckKey((k) => k + 1)
            clearTimeout(resendToastTimer.current)
            setResendToastState('visible')
          }}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--stroke-medium)',
            background: 'var(--bg-default)',
            boxShadow: 'var(--shadow-md)',
            cursor: 'pointer',
            fontSize: '13px',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Show Alert
        </button>
        <button
          onClick={() => {
            clearTimeout(resendToastTimer.current)
            setResendToastState('hiding')
            setTimeout(() => setResendToastState('hidden'), 200)
          }}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--stroke-medium)',
            background: 'var(--bg-default)',
            boxShadow: 'var(--shadow-md)',
            cursor: 'pointer',
            fontSize: '13px',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Hide Alert
        </button>
      </div> */}
    </main>
  )
}
