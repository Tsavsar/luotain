// ─── QR download ───
// Serialises a rendered QR SVG to a file. Two formats, one code path.
//
// It reads the SVG that's ALREADY ON SCREEN rather than re-rendering. What
// downloads is exactly what someone is looking at — colours, pattern, logo and
// all — which a second render path couldn't guarantee.

// Vector, so it scales losslessly. The right default for print.
export function svgBlob(svg) {
  const clone = svg.cloneNode(true)

  // A standalone file has to declare the namespace; inside a document the
  // browser infers it. Without this the file opens as XML, not an image.
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

  // The on-screen SVG is sized by CSS, so width/height may be absent or a
  // percentage. A file with no intrinsic size renders tiny in some viewers.
  const box = (clone.getAttribute('viewBox') || '').split(/\s+/)
  if (box.length === 4) {
    clone.setAttribute('width', box[2])
    clone.setAttribute('height', box[3])
  }

  return new Blob(
    ['<?xml version="1.0" encoding="UTF-8"?>\n', clone.outerHTML],
    { type: 'image/svg+xml' }
  )
}

// Raster, for anywhere SVG isn't accepted — most print shops, Instagram, Word.
//
// Rendered at a fixed 1024px rather than the on-screen size. A QR exported at
// its display size is useless the moment anyone scales it up, and since the
// source is vector the larger canvas costs nothing but memory.
export function pngBlob(svg, size = 1024) {
  return new Promise((resolve, reject) => {
    const clone = svg.cloneNode(true)
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

    const box = (clone.getAttribute('viewBox') || '0 0 100 100').split(/\s+/)
    const ratio = Number(box[3]) / Number(box[2]) || 1
    const w = size
    const h = Math.round(size * ratio)
    clone.setAttribute('width', String(w))
    clone.setAttribute('height', String(h))

    const img = new Image()

    // A data URL, not an object URL. Canvas treats a blob-sourced SVG as
    // cross-origin and taints it, and a tainted canvas refuses toBlob.
    const source = new XMLSerializer().serializeToString(clone)
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(source)))}`

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')

      // White behind it. PNG supports transparency, and a transparent QR on a
      // dark background inverts — which scanners can't read.
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
      ctx.drawImage(img, 0, 0, w, h)

      canvas.toBlob((blob) => {
        blob ? resolve(blob) : reject(new Error('Canvas export failed'))
      }, 'image/png')
    }
    img.onerror = () => reject(new Error('Could not rasterise the code'))
  })
}

export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  // Revoked, or the blob is held in memory for the life of the page.
  URL.revokeObjectURL(url)
}

// Slugs a short URL into something a filesystem accepts.
export function qrFilename(shortUrl, ext) {
  const base = (shortUrl || 'qr-code')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
  return `${base}.${ext}`
}
