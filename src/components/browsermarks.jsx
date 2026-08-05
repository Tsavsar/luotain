'use client'

import { useId } from 'react'

// ─── Browser marks ───
// The small badge on a session's device circle.
//
// Safari is the real Devicon asset; Chrome and Firefox are simplified,
// because their official marks carry detail that turns to mush below about
// 16px. Worth swapping those for real assets too if you have them — see the
// note in my message about badge size.
//
// Chrome keeps its brand colours because the three segments ARE the identity;
// the generic fallback is monochrome on currentColor, since at this size a
// recognisable silhouette does more work than an approximate colour.

export function ChromeMark({ size = 10 }) {
  return (
    <svg width={size} height={size} viewBox='0 0 16 16' aria-hidden='true'>
      <circle cx='8' cy='8' r='7.4' fill='#fff' />
      <path
        d='M8 .6a7.4 7.4 0 0 1 6.4 3.7H8a3.7 3.7 0 0 0-3.5 2.5L2.3 3A7.4 7.4 0 0 1 8 .6Z'
        fill='#EA4335'
      />
      <path
        d='M2.3 3l2.2 3.8A3.7 3.7 0 0 0 7.3 12l-2.1 3.1A7.4 7.4 0 0 1 2.3 3Z'
        fill='#34A853'
      />
      <path
        d='M14.4 4.3a7.4 7.4 0 0 1-9.2 10.8l3.1-5.4a3.7 3.7 0 0 0 2.4-5.4h3.7Z'
        fill='#FBBC05'
      />
      <circle cx='8' cy='8' r='2.9' fill='#4285F4' />
    </svg>
  )
}

// The real Devicon mark.
//
// The gradient id comes from useId rather than the asset's hardcoded one.
// That matters here specifically: the sessions screen renders one badge per
// device, so the same id would appear several times in one document — ids
// have to be unique, and browsers resolve url(#id) to the first match. Every
// badge after the first would reference another instance's gradient, and
// deleting a session could leave the rest pointing at a node that no longer
// exists.
export function SafariMark({ size = 10 }) {
  // Colons stripped: React's useId returns values like ':r1:', which are
  // legal HTML ids but are also CSS selector syntax — so url(#a-:r1:-b) can
  // fail to resolve and the gradient silently renders as nothing.
  const gradientId = `safari-grad-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 128 128'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <linearGradient
        id={gradientId}
        x1='295.835'
        x2='295.835'
        y1='274.049'
        y2='272.933'
        gradientTransform='matrix(112 0 0 -112 -33069.5 30695)'
        gradientUnits='userSpaceOnUse'
      >
        <stop offset='0' stopColor='#19d7ff' />
        <stop offset='1' stopColor='#1e64f0' />
      </linearGradient>
      <circle cx='64' cy='64' r='62.5' fill={`url(#${gradientId})`} />
      {/* The compass tick marks. Kept because they're most of what makes the
          dial read as Safari's, even when they blur together at badge size —
          without them the face is just a blue circle. */}
      <path
        fill='#fff'
        d='M63.5 7.6v9.2h1V7.6Zm-3.902.26l-.996.08l.4 5l.996-.08zm8.804 0l-.4 5l.996.08l.4-5zm-13.709.554l-.986.172l1.6 9.101l.986-.173zm18.614 0l-1.6 9.1l.986.174l1.6-9.102zM49.883 9.47l-.965.261l1.299 4.801l.965-.261Zm28.234 0l-1.299 4.8l.965.262l1.299-4.8zm-32.846 1.363l-.943.336l3.102 8.7l.941-.337zm37.458 0l-3.1 8.7l.941.335l3.102-8.699zm4.62 1.852l-2.2 4.601l.902.43l2.201-4.6zm-46.695.007l-.908.416l2.1 4.6l.908-.414zm-4.32 2.26l-.867.498l4.6 8l.867-.498zm55.332 0l-4.6 8l.868.498l4.6-8zm-59.559 2.56l-.816.577l2.9 4.101l.817-.578zm63.786 0l-2.9 4.1l.816.578l2.9-4.101zm-67.61 2.968l-.765.644l5.9 7l.764-.644zm71.434 0l-5.899 7l.764.644l5.9-7zm-75.168 3.263l-.697.717l3.6 3.5l.696-.717zm-3.33 3.574l-.639.768l7.1 5.9l.64-.77zm85.562 0l-7.101 5.899l.64.77l7.1-5.901zM18.184 31.19l-.569.823l4.201 2.9l.569-.824zm91.632 0l-4.2 2.899l.568.824l4.2-2.9zM15.55 35.367l-.498.867l8 4.6l.498-.867zm96.902 0l-8 4.6l.498.867l8-4.6zm-99.14 4.28l-.422.906l4.5 2.1l.422-.907zm101.378 0l-4.5 2.1l.422.905l4.5-2.1zM11.375 44.13l-.35.937l8.6 3.202l.35-.938zm105.25 0l-8.6 3.201l.35.938l8.6-3.202zM9.828 48.816l-.256.967l4.9 1.301l.257-.967zm108.344 0l-4.9 1.301l.255.967l4.9-1.3zM8.688 53.607l-.174.985l9.1 1.601l.173-.986zm110.624 0l-9.1 1.6l.175.986l9.1-1.601zM8.05 58.402l-.098.996l5 .5l.098-.996zm111.902 0l-5 .5l.098.996l5-.5zM7.801 63.4v1H17v-1zM111 63.4v1h9.2v-1zm-98.049 4.403l-5 .5l.098.994l5-.5zm102.098 0l-.098.994l5 .5l.098-.994zm-97.436 3.705l-9.1 1.6l.175.984l9.1-1.6zm92.774 0l-.174.984l9.1 1.6l.173-.985zm-95.914 5.11l-4.9 1.298l.255.967l4.9-1.299zm99.054 0l-.256.966l4.9 1.299l.257-.967zm-93.902 2.814l-8.6 3.199l.35.937l8.6-3.199zm88.75 0l-.35.937l8.6 3.2l.35-.938zm-90.986 5.615l-4.5 2.1l.422.906l4.5-2.1zm93.222 0l-.422.906l4.5 2.1l.422-.907zm-87.56 1.92l-8 4.6l.498.867l8-4.6zm81.898 0l-.498.867l8 4.6l.498-.868zm-83.133 5.822l-4.2 2.9l.568.823l4.2-2.9zm84.368 0l-.569.822l4.201 2.9l.569-.822zm-78.504.926l-7.1 5.9l.639.77l7.101-5.9zm72.64 0l-.64.77l7.101 5.9l.639-.77zm-66.902 5.863l-5.9 7l.765.645l5.899-7zm61.164 0l-.764.645l5.899 7l.765-.645zm5.967.164l-.697.717l3.6 3.5l.696-.717zm-60.48 4.606l-4.6 7.9l.863.504l4.6-7.9zm47.863 0l-.864.504l4.6 7.9l.863-.504zm-53.74 1.164l-2.901 4.1l.816.577l2.9-4.101zm59.617 0l-.817.576l2.9 4.101l.817-.578zm-46.38 2.32l-3.1 8.7l.942.335l3.1-8.699zm33.141 0l-.941.336l3.1 8.7l.943-.337zm-25.263 2.182l-1.6 9.1l.986.173l1.6-9.1zm17.386 0l-.986.174l1.6 9.1l.986-.175zm-30.742.066l-2.201 4.5l.898.44l2.202-4.5zm44.098 0l-.899.44l2.202 4.5l.898-.44Zm-22.549.82v9.2h1v-9.2zm-13.283 2.272l-1.301 4.9l.967.256l1.3-4.9zm27.566 0l-.967.256l1.301 4.9l.967-.256zm-18.781 1.687l-.4 5l.996.08l.4-5zm9.996 0l-.996.08l.4 5l.996-.08z'
        color='#000'
      />
      <path fill='red' d='m106.7 21l-48 37.7l5.2 5.2z' />
      <path fill='#d01414' d='m63.9 63.9l6 6L106.7 21z' />
      <path fill='#fff' d='m58.7 58.7l-37.7 48l42.9-42.8z' />
      <path fill='#acacac' d='m21 106.7l48.9-36.8l-6-6z' />
    </svg>
  )
}

export function FirefoxMark({ size = 10 }) {
  return (
    <svg width={size} height={size} viewBox='0 0 16 16' aria-hidden='true'>
      <circle cx='8' cy='8' r='7.2' fill='#fff' />
      <path
        d='M8 1.2a6.8 6.8 0 1 0 6.6 8.4c-.5 1.5-1.9 2.6-3.6 2.6a3.9 3.9 0 0 1-3.9-3.9c0-1.6 1-2.9 2.4-3.5-1.9-.5-3.6.3-4.4 1.6.4-2.2 2-3.9 4-4.5-.4-.4-.7-.6-1.1-.7Z'
        fill='currentColor'
      />
    </svg>
  )
}

export function GenericBrowserMark({ size = 10 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden='true'
    >
      <circle cx='8' cy='8' r='6.4' stroke='currentColor' strokeWidth='1.3' />
      <path
        d='M1.6 8h12.8M8 1.6a11 11 0 0 1 0 12.8A11 11 0 0 1 8 1.6Z'
        stroke='currentColor'
        strokeWidth='1.3'
      />
    </svg>
  )
}

export function browserMarkFor(browser) {
  if (browser === 'Chrome') return ChromeMark
  if (browser === 'Safari') return SafariMark
  if (browser === 'Firefox') return FirefoxMark
  return GenericBrowserMark
}
