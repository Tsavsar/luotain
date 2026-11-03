// ─── The demo ───
// "View a demo" opens the real dashboard on its mock data, signed out. /demo
// sets this cookie and goes to the dashboard; the dashboard layout sees it on
// a signed-out visit and, instead of sending the visitor to /login, runs in
// demo mode:
//
//   - mock data is forced on (mockdatacontext.jsx), on the Pro plan, so every
//     page has something to show and nothing is behind an upgrade;
//   - every /api request is answered in the browser (demoapi.js), so a
//     visitor never reaches the server and nothing they do is saved;
//   - a bar across the top says so, with the way out and the way in.
//
// Signed in, the cookie is ignored and cleared: someone with an account always
// gets their own workspace, and signing up from the demo lands them in it.
//
// A session cookie rather than storage: it outlives a reload and reaches a
// link opened in a new tab, and it's gone when the browser closes. Set by a
// page rather than a route handler, so a prefetch of /demo from the landing
// can't set it before anyone has clicked.

export const DEMO_COOKIE = 'luotain_demo'

export function hasDemoCookie() {
  return document.cookie
    .split(';')
    .some((c) => c.trim() === `${DEMO_COOKIE}=1`)
}

export function setDemoCookie() {
  document.cookie = `${DEMO_COOKIE}=1; Path=/; SameSite=Lax`
}

export function clearDemoCookie() {
  document.cookie = `${DEMO_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
}

// Leaving goes through a full navigation, so the demo's stand-in for the API
// goes with the page instead of having to be taken out again.
export function leaveDemo(to = '/') {
  clearDemoCookie()
  window.location.href = to
}

// What a write gets back in the demo, shown by the page's own error toast.
export const DEMO_NOT_SAVED = 'This is a demo, so changes aren’t saved'

// Links deleted in the demo. Per tab rather than for good, and apart from
// mock mode's own list, so one visitor's tidying never follows them into the
// next visit and a developer's mock state is left alone.
export const DEMO_DELETED_KEY = 'luotain:demo-deleted'

export function readDemoDeleted() {
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(DEMO_DELETED_KEY))
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

export function writeDemoDeleted(urls) {
  try {
    window.sessionStorage.setItem(DEMO_DELETED_KEY, JSON.stringify(urls))
  } catch {
    // Private browsing can refuse storage; the deletes just won't outlive the
    // page, which is all a demo needs.
  }
}
