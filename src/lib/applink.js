// ─── App links ───
// A link with a store for each phone: iPhones open the App Store, Android
// phones open Google Play, and everyone else goes to the link's destination.
// The redirect decides by user agent ([shortCode]/route.js), so a QR code on
// the link does the same thing: a scan is a visit to its short link.
//
// Stored as two nullable columns on Link, iosUrl and androidUrl.
// destinationUrl stays the one required destination and is the fallback, so
// every screen that shows a destination keeps working. An app link made
// without a fallback of its own falls back to its App Store page, then its
// Google Play page, both of which a desktop browser can show.
//
// Shared by the API, which validates, and the create page, which checks the
// same rules before sending.

export const STORES = {
  ios: {
    label: 'App Store',
    article: 'an',
    hosts: ['apps.apple.com', 'itunes.apple.com'],
    placeholder: 'https://apps.apple.com/app/…',
  },
  android: {
    label: 'Google Play',
    article: 'a',
    hosts: ['play.google.com'],
    placeholder: 'https://play.google.com/store/apps/details?id=…',
  },
}

// { url: null } for an empty field (no store for that phone), { url } for a
// store page, { error } for anything else. Store pages only: a store's own
// schemes (itms-apps:, market:) open nothing in a desktop browser, and any
// other site in a store field is a paste into the wrong box.
export function normalizeStoreUrl(raw, platform) {
  const store = STORES[platform]
  const trimmed = String(raw ?? '').trim()
  if (!trimmed) return { url: null }

  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`
  let url
  try {
    url = new URL(withScheme)
  } catch {
    return { error: `Paste the app’s ${store.label} link` }
  }
  if (!store.hosts.includes(url.hostname.toLowerCase())) {
    return { error: `That isn’t ${store.article} ${store.label} link` }
  }
  // The app's own page, not the store's front page or a search
  if (platform === 'ios' && !/\/app\//.test(url.pathname)) {
    return { error: 'Use the app’s page on the App Store' }
  }
  if (platform === 'android' && !url.searchParams.get('id')) {
    return { error: 'Use the app’s page on Google Play' }
  }
  url.protocol = 'https:'
  return { url: url.toString() }
}

export const isAppLink = (link) => Boolean(link?.iosUrl || link?.androidUrl)

// Which store a device opens, from its user agent. iPhones say so. An iPad on
// iPadOS 13 or later asks for desktop sites and sends a Mac's user agent, so
// it gets the fallback a Mac would, which on an app link without a fallback
// of its own is the App Store page anyway.
export function platformFrom(ua = '') {
  if (/iphone|ipod|ipad/i.test(ua)) return 'ios'
  if (/android/i.test(ua)) return 'android'
  return null
}

export function destinationFor(link, ua) {
  const platform = platformFrom(ua)
  if (platform === 'ios' && link.iosUrl) return link.iosUrl
  if (platform === 'android' && link.androidUrl) return link.androidUrl
  return link.destinationUrl
}
