import './globals.css'
;<meta
  name='viewport'
  content='width=device-width, initial-scale=1, maximum-scale=1'
/>

export const metadata = {
  title: 'Luotain',
  description: 'Shortlink and QR code generator',
}

export default function RootLayout({ children }) {
  return (
    <html lang='en' data-theme='light'>
      <body>{children}</body>
    </html>
  )
}
