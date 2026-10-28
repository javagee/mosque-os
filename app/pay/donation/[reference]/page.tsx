import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDonation } from '@/lib/donation-store'
import { DONATION_CATEGORIES } from '@/types'
import PayNowDonation from './PayNowDonation'

export const dynamic = 'force-dynamic'

export default async function DonationPayPage({
  params,
}: {
  params: Promise<{ reference: string }>
}) {
  const { reference } = await params
  const donation = await getDonation(reference)
  if (!donation) notFound()

  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'
  const qrImageUrl = process.env.PAYNOW_QR_URL ?? null
  const uen = process.env.PAYNOW_UEN ?? null

  const catInfo = DONATION_CATEGORIES[donation.category as keyof typeof DONATION_CATEGORIES]
  const amountStr = new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', minimumFractionDigits: 2 }).format(donation.amount / 100)

  if (donation.status === 'pending_verification' || donation.status === 'verified') {
    return (
      <div className="min-h-screen bg-[#F7F6F2] flex flex-col items-center justify-center gap-4 px-6">
        <div className="w-16 h-16 rounded-full bg-[#1A3D2B]/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-[#1A3D2B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-bold text-[#1A3D2B] text-xl">Payment already confirmed</p>
        <p className="text-sm text-gray-500 text-center">
          Your donation of <strong>{amountStr}</strong> is being verified by the mosque team.
        </p>
        <Link href="/donate" className="text-sm text-[#1A3D2B] font-semibold hover:underline">
          ← Back to donations
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F6F2]">
      <nav className="bg-[#1A3D2B] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex flex-col leading-none">
            <span className="text-base font-bold text-white">Imara</span>
            <span className="text-[10px] text-green-300/70">{mosqueName}</span>
          </Link>
          <Link href="/donate" className="text-sm text-green-200/70 hover:text-white transition-colors">
            ← Cancel
          </Link>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-6">
          {catInfo && (
            <p className="text-xs font-semibold text-[#C9A84C] mb-1">{catInfo.label} · {catInfo.arabic}</p>
          )}
          <h1 className="text-2xl font-bold text-[#1A3D2B]">Complete your donation</h1>
          <p className="text-sm text-gray-500 mt-1">
            {donation.donor_name} · {donation.type} · <strong className="text-gray-700">{amountStr}</strong>
          </p>
        </div>

        <PayNowDonation donation={donation} qrImageUrl={qrImageUrl} uen={uen} />
      </div>
    </div>
  )
}
