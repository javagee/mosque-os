import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Imara — Your Mosque Platform',
  description: 'Developing, building and flourishing — the all-in-one platform for mosque donations, prayer times, and community.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
