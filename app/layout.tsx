import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Is The Owl In The House?',
  description: 'computerparty.fun — find out if the owl is home',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
