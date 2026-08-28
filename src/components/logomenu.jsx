'use client'

import { useEffect, useRef, useState } from 'react'

// ─── Logo context menu ───
// Right-click the wordmark to download it. A small courtesy that costs
// nothing and saves anyone writing about the product from screenshotting it
// off the page — which is where bad logo reproductions come from.
//
// The menu replaces the browser's own on this element only, so right-clicking
// anywhere else on the page behaves normally.

function svgOf(node) {
  const svg = node?.querySelector('svg')
  if (!svg) return null
  const clone = svg.cloneNode(true)
  // Tokens resolve to nothing outside the page, so the computed values are
  // baked in — otherwise a downloaded file opens as an invisible logo.
  const source = svg.querySelectorAll('path')
  clone.querySelectorAll('path').forEach((p, i) => {
    const fill = source[i] ? getComputedStyle(source[i]).fill : null
    if (fill) p.setAttribute('fill', fill)
  })
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  return clone
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function LogoMenu({ children }) {
  const [menu, setMenu] = useState(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    const onKey = (e) => e.key === 'Escape' && close()
    // `capture` on scroll: a menu anchored to a point on the page is wrong
    // the moment the page moves under it.
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    document.addEventListener('keydown', onKey)
    document.addEventListener('click', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('click', close)
    }
  }, [menu])

  function handleContext(e) {
    e.preventDefault()
    // Clamped so a right-click near the right edge doesn't open the menu
    // off-screen.
    const x = Math.min(e.clientX, window.innerWidth - 190)
    setMenu({ x, y: e.clientY })
  }

  function downloadSvg() {
    const clone = svgOf(wrapRef.current)
    if (!clone) return
    const source = new XMLSerializer().serializeToString(clone)
    download(new Blob([source], { type: 'image/svg+xml' }), 'luotain-logo.svg')
    setMenu(null)
  }

  function downloadPng() {
    const clone = svgOf(wrapRef.current)
    if (!clone) return

    // 1024 wide, not the 19px it renders at. A PNG exported at display size
    // is useless the moment anyone puts it anywhere — and since the source is
    // vector, the larger size costs nothing but a canvas.
    const viewBox = (clone.getAttribute('viewBox') || '0 0 323 64').split(' ')
    const ratio = Number(viewBox[3]) / Number(viewBox[2])
    const width = 1024
    const height = Math.round(width * ratio)
    clone.setAttribute('width', String(width))
    clone.setAttribute('height', String(height))

    const source = new XMLSerializer().serializeToString(clone)
    const img = new Image()
    // A data URL rather than an object URL: canvas treats a blob-sourced SVG
    // as cross-origin and taints it, and a tainted canvas can't be exported.
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(source)))}`
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob((blob) => {
        if (blob) download(blob, 'luotain-logo.png')
      }, 'image/png')
    }
    setMenu(null)
  }

  return (
    <>
      <span
        ref={wrapRef}
        onContextMenu={handleContext}
        style={{ display: 'inline-flex' }}
      >
        {children}
      </span>

      {menu ? (
        <div
          role='menu'
          className='logo-menu'
          style={{ left: `${menu.x}px`, top: `${menu.y}px` }}
          // The menu's own clicks mustn't reach the document listener that
          // closes it, or an option would close the menu before it ran.
          onClick={(e) => e.stopPropagation()}
        >
          <button type='button' role='menuitem' onClick={downloadSvg}>
            Download SVG
          </button>
          <button type='button' role='menuitem' onClick={downloadPng}>
            Download PNG
          </button>
        </div>
      ) : null}
    </>
  )
}
