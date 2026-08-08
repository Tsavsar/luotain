import QRCode from 'qrcode'

// ─── QR encoding ───
// Turns a URL into the real module matrix.
//
// Everything up to now has been a seeded random pattern that looked like a QR
// and scanned as nothing. This is the part that makes a code work.
//
// Uses the `qrcode` package for the encoding itself — Reed-Solomon error
// correction, mode selection, mask evaluation. That's a few thousand lines of
// spec compliance with a lot of subtle detail, and getting any of it slightly
// wrong produces a code that scans on one phone and not another. Not worth
// hand-writing.
//
// What isn't taken from the library is the rendering: it only emits plain
// black squares, and the designer's patterns, colours and logo cut-out are the
// point. So this extracts the matrix and hands it to the existing renderer.

// 'H' — the highest error correction level, recovering from ~30% loss.
//
// Not just belt-and-braces: the branding option punches a hole in the middle of
// the code, and 'H' is what lets it still scan. It also means a printed code
// survives a scuff or a fingerprint, which matters for the thing a QR is
// actually for.
const ERROR_CORRECTION = 'H'

// Returns { size, isDark(x, y) } — the grid dimension and a lookup, which is
// the shape the renderer already expects.
export function encodeQr(text) {
  const qr = QRCode.create(String(text || ''), {
    errorCorrectionLevel: ERROR_CORRECTION,
  })

  const size = qr.modules.size
  const data = qr.modules.data

  return {
    size,
    // Row-major, matching the library's flat array.
    isDark: (x, y) => {
      if (x < 0 || y < 0 || x >= size || y >= size) return false
      return Boolean(data[y * size + x])
    },
  }
}

// Which modules are structural rather than data. The renderer draws finders and
// the logo box itself, so it needs to know what to skip — and the timing
// patterns and alignment blocks have to be drawn as-is rather than styled,
// because a scanner locates the code by them.
export function moduleRoles(size) {
  const inFinder = (x, y) =>
    (x < 7 && y < 7) || (x > size - 8 && y < 7) || (x < 7 && y > size - 8)

  // One blank module around each finder. Without the separator the finders bleed
  // into surrounding data and detection gets less reliable.
  const inSeparator = (x, y) =>
    (x < 8 && y < 8) || (x > size - 9 && y < 8) || (x < 8 && y > size - 9)

  return { inFinder, inSeparator }
}
