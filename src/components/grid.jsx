export default function grid({
  children,
  empty = false,
  activeIndex = null,
  activeLabel = '',
}) {
  const columns = 18

  return (
    <div className='relative w-full'>
      {/* Chart */}
      <div className='absolute inset-x-0 top-0 h-[328px]'>{children}</div>

      {/* Grid + Axis */}
      <div className='flex w-full justify-between'>
        {Array.from({ length: columns }).map((_, index) => {
          const isActive = index === activeIndex

          return (
            <div
              key={index}
              className='flex flex-1 flex-col items-center gap-[10px]'
            >
              {/* Grid line */}
              {!isActive && <div className='h-[328px] w-px bg-bg-default' />}

              {/* Bottom axis */}
              {index === 0 ? (
                <span className='text-xs font-normal leading-4 tracking-[0.24px] text-bg-subtle'>
                  00:00
                </span>
              ) : index === columns - 1 ? (
                <span className='text-xs font-normal leading-4 tracking-[0.24px] text-bg-subtle'>
                  23:00
                </span>
              ) : isActive ? (
                <>
                  <span className='text-xs font-medium leading-4 tracking-[0.24px] text-bg-weak'>
                    {activeLabel}
                  </span>

                  <div className='-mt-[188px] flex h-4 w-full items-center justify-center'>
                    <div className='h-1.5 w-1.5 rounded-full bg-primary-base' />
                  </div>
                </>
              ) : (
                <div className='flex h-4 w-full items-center justify-center'>
                  <div className='h-1.5 w-1.5 rounded-full bg-bg-subtle' />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {empty && (
        <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
          <div className='-mt-10 flex flex-col items-center gap-4'>
            <svg
              width='34'
              height='24'
              viewBox='0 0 34 24'
              fill='none'
              className='text-text-secondary'
            >
              <path
                d='M2 8L8 3L14 8L20 3'
                stroke='currentColor'
                strokeWidth='2.5'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <path
                d='M14 20L20 15L26 20L32 15'
                stroke='currentColor'
                strokeWidth='2.5'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>

            <span className='text-base font-medium text-text-secondary'>
              No data available
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
