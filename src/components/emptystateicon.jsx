export default function EmptyStateIcon() {
  return (
    <div
      className='check-reveal'
      style={{
        width: '32px',
        height: '32px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: 24,
            height: 21.85,
            left: 4,
            top: 5.27,
            position: 'absolute',
            background: 'var(--Texts-text-soft, #A3A3A3)',
          }}
        />
      </div>
    </div>
  )
}
