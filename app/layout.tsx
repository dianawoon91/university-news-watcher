import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'University News Watcher',
  description: 'Daily admissions intelligence for top US universities',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
