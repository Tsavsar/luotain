'use client'

import { Suspense, useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Map from '@/components/Map'
import BackButton from '@/components/backbutton'
import CodeInput from '@/components/codeinput'

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

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState(false)
  const [toastState, setToastState] = useState('hidden')
  const toastTimer = useRef(null)
  const errorTimer = useRef(null)

  // NEW — resend cooldown, starts at 5:00 on page load too, since a
  // code was already just sent by the previous page moments ago
  const [resendCooldown, setResendCooldown] = useState(300)
  const [resendToastState, setResendToastState] = useState('hidden')
  const resendToastTimer = useRef(null)

  // countdown ticker — recursive setTimeout, stops on its own once
  // resendCooldown hits 0
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  function showResendToast() {
    clearTimeout(resendToastTimer.current)
    setResendToastState('visible')
    resendToastTimer.current = setTimeout(() => {
      setResendToastState('hiding')
      setTimeout(() => setResendToastState('hidden'), 200)
    }, 2500)
  }

  // Real verification now — replaces the old hardcoded '99999' check.
  // Calls the server, which checks the signed cookie AND creates the
  // user record on success.
  async function handleCodeComplete(fullCode) {
    try {
      const res = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: fullCode }),
      })

      if (!res.ok) throw new Error('Invalid code')

      router.push('/')
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
    if (resendCooldown > 0) return // extra guard — server is the real enforcement

    try {
      const res = await fetch('/api/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data.retryAfter) setResendCooldown(data.retryAfter) // sync with server's real value
        return
      }

      setResendCooldown(300)
      showResendToast()
    } catch (err) {
      // silent — resend failing quietly is preferable to another
      // disruptive error state on top of everything else here
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

          {/* NEW — resend confirmation toast. Same shape/animation as
              the error one, but white background + colored stroke
              instead of a filled color, using success tokens since
              this is a positive confirmation, not an error. */}
          <div
            className={
              resendToastState === 'visible'
                ? 'slide-up'
                : resendToastState === 'hiding'
                  ? 'slide-down'
                  : ''
            }
            style={{
              width: '100%',
              borderRadius: '16px',
              backgroundColor: 'var(--bg-default)',
              border: '1px solid var(--success-base)',
              boxShadow: 'var(--shadow-xs)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              height: resendToastState !== 'hidden' ? '52px' : '0',
              padding: resendToastState !== 'hidden' ? '16px' : '0 16px',
              transition:
                'height 0.35s ease, padding 0.35s ease, opacity 0.35s ease',
              overflow: 'hidden',
              opacity: resendToastState !== 'hidden' ? 1 : 0,
              fontSize: '12px',
              color: 'var(--success-base)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <p
              style={{
                width: '100%',
                color: 'var(--success-base)',
                fontFamily: 'var(--font-sans)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              New code has been sent
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
    </main>
  )
}
