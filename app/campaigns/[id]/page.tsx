import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import CampaignPurchaseForm from '@/components/coupon/CampaignPurchaseForm'

export const dynamic = 'force-dynamic'

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amount / 100)
}

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const campaign = await db.getCampaign(id)
  if (!campaign) notFound()

  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'
  const progress = campaign.total_coupons
    ? Math.min(100, Math.round((campaign.coupons_sold / campaign.total_coupons) * 100))
    : null

  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="mb-6">
          <Link href="/campaigns" className="text-sm text-[#1A3D2B] font-600 hover:underline">
            ← All campaigns
          </Link>
        </div>

        {/* Campaign image */}
        {campaign.image_url ? (
          <div className="relative h-52 w-full rounded-2xl overflow-hidden mb-6">
            <Image
              src={campaign.image_url}
              alt={campaign.name}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        ) : (
          <div className="h-40 w-full rounded-2xl bg-gradient-to-br from-[#1A3D2B] to-[#2D6A4F] flex items-center justify-center mb-6">
            <span className="text-6xl font-800 text-white/20 select-none">{campaign.merchant_name.charAt(0)}</span>
          </div>
        )}

        {/* Campaign header */}
        <div className="mb-6">
          <p className="text-xs font-600 text-[#C9A84C] mb-2 tracking-wide">
            Imara · {mosqueName} · {campaign.merchant_name}
          </p>
          <h1 className="text-3xl font-800 text-[#1A3D2B]">{campaign.name}</h1>
          {campaign.description && (
            <p className="text-gray-500 mt-2 text-sm leading-relaxed">{campaign.description}</p>
          )}
        </div>

        {/* Coupon price card */}
        <div className="bg-[#1A3D2B] rounded-2xl p-5 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-300 font-600 mb-1">Coupon value</p>
              <p className="text-4xl font-800">{formatCurrency(campaign.coupon_price, campaign.currency)}</p>
              <p className="text-sm text-green-200 mt-1">per coupon · 100% goes to mosque</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-green-300 mb-1">Partner merchant</p>
              <p className="text-lg font-700">{campaign.merchant_name}</p>
            </div>
          </div>

          {campaign.redemption_start && campaign.redemption_end && (
            <div className="mt-4 pt-4 border-t border-green-800">
              <p className="text-xs text-green-300 font-600 mb-1">Redemption period</p>
              <p className="text-sm text-white">
                {new Date(campaign.redemption_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                {' '}–{' '}
                {new Date(campaign.redemption_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          )}
        </div>

        {/* Progress */}
        {progress !== null && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span><strong className="text-[#1A3D2B]">{campaign.coupons_sold}</strong> coupons sold</span>
              <span>{campaign.total_coupons} total</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1A3D2B] rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Purchase form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <h2 className="font-700 text-gray-800 mb-4">Buy a fundraising coupon</h2>
          <CampaignPurchaseForm campaign={campaign} />
        </div>

        {/* Direct donation fallback */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
          <p className="text-sm text-gray-500 mb-3">
            Prefer to donate without a coupon?
          </p>
          <Link
            href="/donate"
            className="text-sm font-600 text-[#1A3D2B] hover:underline"
          >
            Make a direct donation →
          </Link>
        </div>

        {/* Terms */}
        {campaign.terms && campaign.terms.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-700 text-gray-700 mb-3">Terms & conditions</h3>
            <ul className="space-y-2">
              {campaign.terms.map((term, i) => (
                <li key={i} className="text-xs text-gray-500 flex gap-2">
                  <span className="text-[#C9A84C] mt-0.5">•</span>
                  <span>{term}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  )
}
