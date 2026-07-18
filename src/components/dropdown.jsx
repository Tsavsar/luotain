// In dropdown.jsx — add offsetX/offsetY props, both default to 0/6
// so every EXISTING dropdown call (Date, Profile, card filters) keeps
// behaving exactly as it does now, unchanged.

export function Dropdown({
  trigger,
  children,
  align = 'left',
  offsetX = 0,
  offsetY = 6,
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen((o) => !o)} style={{ cursor: 'pointer' }}>
        {trigger}
      </div>

      {open && (
        <div
          className='dropdown-panel'
          style={{
            position: 'absolute',
            top: `calc(100% + ${offsetY}px)`,
            [align === 'right' ? 'right' : 'left']: 0,
            transform: `translateX(${offsetX}px)`,
            zIndex: 50,
            transformOrigin: align === 'right' ? 'top right' : 'top left',
          }}
        >
          {isValidElement(children)
            ? cloneElement(children, { close })
            : children}
        </div>
      )}
    </div>
  )
}
