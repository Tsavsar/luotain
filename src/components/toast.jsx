'use client'

// Real Sonner (npm install sonner) instead of the hand-rolled
// version from before — same visual direction, but Sonner's own
// stacking/expand/swipe-to-dismiss animations are the actual point
// of switching, so this file doesn't touch that at all. It only
// retheme's Sonner's own CSS variables and icons to match KernUI;
// everything interactive is stock Sonner.
//
// `toast`/`toast.success`/`toast.error` are re-exported as-is, so
// every existing `toast('message')` call (cardcontainer.jsx's copy
// button, etc.) keeps working without changes.
import { Toaster as SonnerToaster, toast } from 'sonner'

export { toast }

// Exact SVGs as provided, same ones used before.
function SuccessIcon() {
  return (
    <svg width='20' height='20' viewBox='0 0 30 30' fill='none'>
      <g filter='url(#toastCheckShadow)'>
        <path
          fillRule='evenodd'
          clipRule='evenodd'
          d='M14.75 2C8.813 2 4 6.813 4 12.75C4 18.687 8.813 23.5 14.75 23.5C20.687 23.5 25.5 18.687 25.5 12.75C25.5 6.813 20.687 2 14.75 2ZM10.28 12.72C10.1378 12.5875 9.94978 12.5154 9.75548 12.5188C9.56118 12.5223 9.37579 12.601 9.23838 12.7384C9.10097 12.8758 9.02225 13.0612 9.01883 13.2555C9.0154 13.4498 9.08752 13.6378 9.22 13.78L12.22 16.78C12.3606 16.9205 12.5512 16.9993 12.75 16.9993C12.9488 16.9993 13.1394 16.9205 13.28 16.78L20.28 9.78C20.4125 9.63783 20.4846 9.44978 20.4812 9.25548C20.4777 9.06118 20.399 8.87579 20.2616 8.73838C20.1242 8.60097 19.9388 8.52225 19.7445 8.51883C19.5502 8.5154 19.3622 8.58752 19.22 8.72L12.75 15.19L10.28 12.72Z'
          fill='var(--success-base)'
        />
        <path
          d='M10.28 12.72C10.1378 12.5875 9.94978 12.5154 9.75548 12.5188C9.56118 12.5223 9.37579 12.601 9.23838 12.7384C9.10097 12.8758 9.02225 13.0612 9.01883 13.2555C9.0154 13.4498 9.08752 13.6378 9.22 13.78L12.22 16.78C12.3606 16.9205 12.5512 16.9993 12.75 16.9993C12.9488 16.9993 13.1394 16.9205 13.28 16.78L20.28 9.78C20.4125 9.63783 20.4846 9.44978 20.4812 9.25548C20.4777 9.06118 20.399 8.87579 20.2616 8.73838C20.1242 8.60097 19.9388 8.52225 19.7445 8.51883C19.5502 8.5154 19.3622 8.58752 19.22 8.72L12.75 15.19L10.28 12.72Z'
          fill='white'
        />
      </g>
      <defs>
        <filter
          id='toastCheckShadow'
          x='-1.25'
          y='-1.25024'
          width='32'
          height='32'
          filterUnits='userSpaceOnUse'
          colorInterpolationFilters='sRGB'
        >
          <feFlood floodOpacity='0' result='BackgroundImageFix' />
          <feColorMatrix
            in='SourceAlpha'
            type='matrix'
            values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0'
            result='hardAlpha'
          />
          <feOffset dy='2' />
          <feGaussianBlur stdDeviation='2' />
          <feComposite in2='hardAlpha' operator='out' />
          <feColorMatrix
            type='matrix'
            values='0 0 0 0 0.210308 0 0 0 0 0.210308 0 0 0 0 0.210308 0 0 0 0.04 0'
          />
          <feBlend
            mode='normal'
            in2='BackgroundImageFix'
            result='effect1_dropShadow'
          />
          <feBlend
            mode='normal'
            in='SourceGraphic'
            in2='effect1_dropShadow'
            result='shape'
          />
        </filter>
      </defs>
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg width='20' height='20' viewBox='0 0 20 20' fill='none'>
      <path
        d='m15.657,4.343c-3.119-3.119-8.195-3.119-11.314,0s-3.119,8.194,0,11.313c1.56,1.56,3.608,2.339,5.657,2.339s4.098-.78,5.657-2.339c3.119-3.119,3.119-8.194,0-11.313Zm-1.95,7.95c.391.391.391,1.023,0,1.414-.195.195-.451.293-.707.293s-.512-.098-.707-.293l-2.293-2.293-2.293,2.293c-.195.195-.451.293-.707.293s-.512-.098-.707-.293c-.391-.391-.391-1.023,0-1.414l2.293-2.293-2.293-2.293c-.391-.391-.391-1.023,0-1.414s1.023-.391,1.414,0l2.293,2.293,2.293-2.293c.391-.391,1.023-.391,1.414,0s.391,1.023,0,1.414l-2.293,2.293,2.293,2.293Z'
        fill='var(--error-base)'
      />
    </svg>
  )
}

// ─── Mount once, near the root layout ───
// Retheming is CSS-variable-first (Sonner's own --normal-bg /
// --success-border / etc., documented at sonner.emilkowal.ski/styling)
// rather than `unstyled: true` — going fully unstyled would mean
// rebuilding the positioning/animation CSS ourselves, which is the
// exact work switching to Sonner was meant to avoid. Because these
// map to KernUI's OWN var(--bg-default) etc., the toast re-themes
// for light/dark automatically through the normal CSS cascade —
// Sonner's separate `theme` prop isn't needed on top of that.
export function ToastStack() {
  return (
    <SonnerToaster
      position='bottom-right'
      closeButton
      icons={{
        success: <SuccessIcon />,
        error: <ErrorIcon />,
      }}
      toastOptions={{
        classNames: {
          toast: 'kernui-toast',
          title: 'kernui-toast-title',
          description: 'kernui-toast-description',
          closeButton: 'kernui-toast-close',
        },
      }}
      style={{
        '--normal-bg': 'var(--bg-default)',
        '--normal-text': 'var(--text-strong)',
        '--normal-border': 'var(--stroke-soft)',
        '--success-bg': 'var(--bg-default)',
        '--success-text': 'var(--text-strong)',
        '--success-border': 'var(--stroke-soft)',
        '--error-bg': 'var(--bg-default)',
        '--error-text': 'var(--text-strong)',
        '--error-border': 'var(--stroke-soft)',
      }}
    />
  )
}
