import Link from 'next/link'
import { db } from '@/lib/db'
import CampaignsList from '@/components/coupon/CampaignsList'
import Nav from '@/components/layout/Nav'

export const dynamic = 'force-dynamic'

export default async function CampaignsPage() {
  const campaigns = await db.getCampaigns()
  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'

  return (
    <main className="min-h-screen bg-[#F7F6F2]">
      <Nav mosqueName={mosqueName} />

      {/* Hero band */}
      <div className="bg-[#1A3D2B]">
        <div className="max-w-2xl mx-auto px-6 py-14">
          <p className="text-[#C9A84C] text-sm font-semibold tracking-widest mb-3">{mosqueName}</p>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Fundraising<br />campaigns
          </h1>
          <p className="text-green-200/70 mt-4 text-sm leading-relaxed max-w-sm">
            Purchase a meal voucher redeemable at our merchant partners — every dollar goes directly to the mosque.
          </p>
          {campaigns.length > 0 && (
            <div className="mt-6 inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-4 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/80 text-xs font-medium">
                {campaigns.length} active campaign{campaigns.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Campaign list */}
      <div className="max-w-2xl mx-auto px-6 pt-8 pb-16">
        {campaigns.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center mt-8">
            <p className="text-2xl mb-2">🕌</p>
            <p className="text-gray-700 font-medium">No active campaigns right now</p>
            <p className="text-gray-400 text-sm mt-1">Check back soon — new campaigns are added regularly.</p>
            <Link href="/donate" className="inline-block mt-4 text-sm font-semibold text-[#1A3D2B] hover:underline">
              Make a direct donation →
            </Link>
          </div>
        ) : (
          <>
            <CampaignsList campaigns={campaigns} />

            <div className="mt-10 bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-800 text-sm">Prefer a direct donation?</p>
                <p className="text-gray-400 text-xs mt-0.5">No voucher — 100% goes straight to the mosque.</p>
              </div>
              <Link
                href="/donate"
                className="shrink-0 px-4 py-2 rounded-xl border-2 border-[#1A3D2B] text-[#1A3D2B] text-sm font-semibold hover:bg-[#1A3D2B] hover:text-white transition-colors"
              >
                Donate
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
