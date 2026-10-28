import type { Metadata } from 'next'
import './globals.css'
import DemoBar from '@/components/layout/DemoBar'

export const metadata: Metadata = {
  title: 'Imara — Your Mosque Platform',
  description: 'Developing, building and flourishing — the all-in-one platform for mosque donations, prayer times, and community.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        <DemoBar />
        {children}
      </body>
    </html>
  )
}
