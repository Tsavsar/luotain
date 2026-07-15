'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import AuthButton from '@/components/secondarybutton'
import Continuebutton from '@/components/continuebutton'
import Inputfield from '@/components/input'
import Map from '@/components/Map'

// NOTE: renamed from Getstarted() — this is the login page (copy-pasted
// from get-started as a starting point). Function name didn't affect
// routing, just made the file confusing to navigate later.
export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState(false)
  const [shaking, setShaking] = useState(false)
  const [toastState, setToastState] = useState('hidden')
  const toastTimer = useRef(null)
  const errorTimer = useRef(null)
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  function validateEmail() {
    setEmailError(!isEmailValid)
  }

  function handleContinue() {
    if (!isEmailValid) {
      clearTimeout(errorTimer.current)
      setEmailError(true)
      errorTimer.current = setTimeout(() => setEmailError(false), 2000)

      setShaking(false)
      setTimeout(() => setShaking(true), 10)
      setTimeout(() => setShaking(false), 310)

      clearTimeout(toastTimer.current)
      setToastState('visible')
      toastTimer.current = setTimeout(() => {
        setToastState('hiding')
        setTimeout(() => setToastState('hidden'), 200)
      }, 2000)

      return
    }

    router.push(`/verification-code?email=${encodeURIComponent(email)}`)
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
        {/* Logo and header text */}
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
              Welcome back!
            </p>
            <p className='para-sm' style={{ color: 'var(--text-sub)' }}>
              Choose how you'd like to continue.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '8px',
            width: '100%',
          }}
        >
          <AuthButton
            style={{ width: '100%' }}
            icon={
              <img
                src='/assets/googlelogo.svg'
                width={20}
                height={20}
                alt='Google'
              />
            }
            label='Google'
            onClick={() => signIn('google', { callbackUrl: '/' })}
          />
          <AuthButton
            style={{ width: '100%' }}
            icon={
              <svg
                width='20'
                height='20'
                viewBox='0 0 20 20'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  fillRule='evenodd'
                  clipRule='evenodd'
                  d='M10 1.67A8.33 8.33 0 0 0 1.67 10c0 3.68 2.39 6.8 5.7 7.9.42.08.57-.18.57-.4v-1.4c-2.33.51-2.82-1.12-2.82-1.12-.38-.97-.93-1.22-.93-1.22-.76-.52.06-.51.06-.51.84.06 1.28.86 1.28.86.75 1.28 1.96.91 2.44.7.08-.54.29-.91.53-1.12-1.86-.21-3.82-.93-3.82-4.15 0-.92.33-1.67.86-2.26-.09-.21-.37-1.07.08-2.22 0 0 .7-.22 2.3.86a7.97 7.97 0 0 1 4.2 0c1.59-1.08 2.29-.86 2.29-.86.45 1.15.17 2 .08 2.22.54.59.86 1.34.86 2.26 0 3.23-1.97 3.94-3.84 4.15.3.26.57.77.57 1.55v2.3c0 .22.15.49.58.4A8.33 8.33 0 0 0 10 1.67z'
                  fill='currentColor'
                />
              </svg>
            }
            label='Github'
            onClick={() => signIn('github', { callbackUrl: '/' })}
          />
        </div>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              height: '1px',
              width: '80px',
              backgroundColor: 'var(--bg-surface)',
            }}
          />
          <p className='para-sm' style={{ color: 'var(--text-sub)' }}>
            or
          </p>
          <div
            style={{
              height: '1px',
              width: '80px',
              backgroundColor: 'var(--bg-surface)',
            }}
          />
        </div>

        {/* Input field & button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Inputfield
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') validateEmail()
            }}
            error={emailError}
            placeholder='Email address'
            lefticon={
              <svg
                width='20'
                height='20'
                viewBox='0 0 20 20'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M9 17V15'
                  stroke='currentColor'
                  strokeWidth='1.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <path
                  d='M15 6C15 7.654 13.654 9 12 9C11.448 9 11 8.552 11 8C11 7.448 11.448 7 12 7C12.552 7 13 6.551 13 6V5.816C12.153 5.514 11.481 4.845 11.178 4H6C3.794 4 2 5.794 2 8V13.5C2 14.878 3.122 16 4.5 16H15.5C16.878 16 18 14.878 18 13.5V8C18 6.95 17.585 6 16.92 5.286C16.398 5.725 15.734 6 15 6ZM8 14H4.5C4.224 14 4 13.776 4 13.5V8C4 6.897 4.897 6 6 6C7.103 6 8 6.897 8 8V14Z'
                  fill='currentColor'
                />
                <path
                  d='M15 1H12C11.4477 1 11 1.44772 11 2V3C11 3.55228 11.4477 4 12 4H15C15.5523 4 16 3.55228 16 3V2C16 1.44772 15.5523 1 15 1Z'
                  fill='currentColor'
                />
                <path
                  d='M12 3V6'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            }
          />

          <Continuebutton
            active={isEmailValid}
            label='Continue with email'
            shaking={shaking}
            onClick={handleContinue}
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
              Invalid email, please enter a valid email to continue
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', gap: '4px' }}>
            <p className='para-sm' style={{ color: 'var(--text-sub)' }}>
              Don't have an account?
            </p>
            {/* fixed: className had a comma ('label-sm, text-touch-area'),
                which tried to apply a class literally named "label-sm," */}
            <a
              href='/get-started'
              className='label-sm text-touch-area'
              style={{ color: 'var(--primary-base)' }}
            >
              Create a free account!
            </a>
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
        <a href='/terms?from=login' style={{ color: 'var(--text-sub)' }}>
          Terms
        </a>{' '}
        and{' '}
        <a href='/privacy?from=login' style={{ color: 'var(--text-sub)' }}>
          Privacy Policy
        </a>
        .
      </div>

      <Map />
    </main>
  )
}
