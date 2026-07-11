import AuthButton from '@/components/secondarybutton'
import Inputfield from '@/components/input'

export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '160px',
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '360px',
          gap: '18px',
        }}
      >
        {/*Logo and header texts*/}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className='luotain-logo'> 
            <svg
              width='30'
              height='32'
              viewBox='0 0 30 32'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                d='M3.59116 5.45659L11.2741 0.988578C13.5125 -0.313166 16.2804 -0.330419 18.5351 0.943317L26.274 5.31519C28.5287 6.58893 29.9277 8.96015 29.944 11.5356L29.9999 20.3755C30.0161 22.951 28.6473 25.3395 26.4088 26.6412L18.7259 31.1092C18.0545 31.4997 17.3354 31.7746 16.5969 31.9337C15.8429 32.0962 15.2017 31.4694 15.1968 30.7033L15.1787 27.833C15.174 27.0907 15.7874 26.504 16.4687 26.1982C16.5786 26.1488 16.6865 26.0934 16.792 26.0321L22.8942 22.4834C23.9601 21.8635 24.612 20.7261 24.6042 19.4997L24.5598 12.4786C24.5521 11.2522 23.8859 10.1231 22.8122 9.51651L16.6656 6.04414C15.5919 5.4376 14.2739 5.44582 13.208 6.0657L7.10579 9.61442C6.03988 10.2343 5.38802 11.3717 5.39578 12.5981L5.40876 14.6501C5.41355 15.4085 4.79823 16.0271 4.0344 16.0319L1.4106 16.0482C0.646764 16.053 0.0236675 15.4421 0.0188717 14.6837L0.000143737 11.7223C-0.0161435 9.14681 1.35274 6.75833 3.59116 5.45659Z'
                fill='#EBEBEB'
              />
              <path
                d='M14.5066 30.7544C14.5113 31.5015 13.8996 32.1576 13.1722 31.9665C12.5964 31.8152 12.0868 31.5372 11.3826 31.1343L3.668 26.7204C1.42036 25.4345 0.0344782 23.0557 0.0324018 20.4801L0.0328995 18.1078C0.0330574 17.3541 0.656887 16.7413 1.41595 16.7348L4.03974 16.7185C4.80426 16.7133 5.42636 17.328 5.42476 18.0871L5.42166 19.5664C5.42265 20.7929 6.08259 21.9256 7.1529 22.538L13.2803 26.0438C13.9056 26.4016 14.4835 27.0998 14.488 27.8164L14.5066 30.7544Z'
                fill='#FA7319'
              />
            </svg>
          </div>
          <div
            className='header'
            style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
          >
            <p className='label-md' style={{ color: 'var(--text-strong)' }}>
              Create your free account
            </p>
            <p className='para-sm' style={{ color: 'var(--text-sub)' }}>
              Shorten links, generate QR codes, and see exactly where every
              click and scan lands.
            </p>
          </div>
        </div>

        {/*Buttons*/}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '8px',
            width: '100%',
          }}
        >
          <AuthButton
            style={{ width: '100%' }}
            icon={
              <img
                src='/assets/googlelogo.svg'
                width={20}
                height={20}
                alt='Google'
              />
            }
            label='Google'
          />
          <AuthButton
            style={{ width: '100%' }}
            icon={
              <img
                src='/assets/githublogo.svg'
                width={20}
                height={20}
                alt='Github'
              />
            }
            label='Github'
          />
        </div>

        {/*Divider*/}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '10px',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              height: '1px',
              width: '80px',
              position: 'relative',
              backgroundColor: 'var(--bg-surface)',
            }}
          ></div>
          <div>
            <p className='para-sm text-sub'>or</p>
          </div>
          <div
            style={{
              height: '1px',
              width: '80px',
              position: 'relative',
              backgroundColor: 'var(--bg-surface)',
            }}
          ></div>
        </div>

        {/*input field & button*/}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Inputfield placeholder='Email address' />
          <AuthButton
            style={{ width: '100%' }}

            label='Continue with email'
          />
        </div>
      </div>
    </main>
  )
}
