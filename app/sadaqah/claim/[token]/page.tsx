import { notFound } from 'next/navigation'
import { getSadaqahClaim } from '@/lib/sadaqah-store'
import SadaqahClaimDisplay from '@/components/waqf/SadaqahClaimDisplay'

export const dynamic = 'force-dynamic'

export default async function SadaqahClaimPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const claim = await getSadaqahClaim(token.toUpperCase())
  if (!claim) notFound()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return (
    <main className="min-h-screen bg-[#F0F4F3] flex items-center justify-center px-4 py-12">
      <SadaqahClaimDisplay claim={claim} claimUrl={`${appUrl}/sadaqah/claim/${claim.id}`} />
    </main>
  )
}
