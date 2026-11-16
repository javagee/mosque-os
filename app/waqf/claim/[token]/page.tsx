import { notFound } from 'next/navigation'
import { getWaqfClaim } from '@/lib/waqf-claim-store'
import WaqfClaimDisplay from '@/components/waqf/WaqfClaimDisplay'

export const dynamic = 'force-dynamic'

export default async function WaqfClaimPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const claim = await getWaqfClaim(token.toUpperCase())
  if (!claim) notFound()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const claimUrl = `${appUrl}/waqf/claim/${claim.id}`

  return (
    <main className="min-h-screen bg-[#F0F4F3] flex items-center justify-center px-4 py-12">
      <WaqfClaimDisplay claim={claim} claimUrl={claimUrl} />
    </main>
  )
}
