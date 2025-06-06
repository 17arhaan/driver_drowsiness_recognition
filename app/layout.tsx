import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Drowsiness Recognition System',
  description: 'Drowsiness Recognition System - Real-time monitoring and alert system for driver safety',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
