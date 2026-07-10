import "./globals.css";

export const metadata = {
  title: "Luotain",
  description: "Shortlink and QR code generator",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light">
      <body>{children}</body>
    </html>
  );
}
