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
          width: '24px',
          height: '21.85px',
          left: '4px',
          top: '5.27px',
          position: 'absolute',
          background: 'var(--text-soft)',
        }}
      />
    </div>
  )
}
