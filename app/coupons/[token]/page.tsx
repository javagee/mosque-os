import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import CouponDisplay from '@/components/coupon/CouponDisplay'

export const dynamic = 'force-dynamic'

export default async function CouponPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const coupon = await db.getCouponByToken(token)
  if (!coupon) notFound()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const redemptionUrl = `${appUrl}/coupons/${token}`

  const merchantRedeemUrl = `${appUrl}/merchant/redeem?token=${token}`

  return (
    <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-4">
        <CouponDisplay coupon={coupon} redemptionUrl={redemptionUrl} />

        {/* Merchant shortcut — shown when this page is opened via QR camera scan */}
        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-500">Are you the merchant?</p>
            <p className="text-xs text-gray-400 mt-0.5">Tap below to open the redemption portal</p>
          </div>
          <a
            href={merchantRedeemUrl}
            className="flex-shrink-0 px-4 py-2 rounded-xl bg-[#1A3D2B] text-white text-xs font-semibold hover:bg-[#2D6A4F] transition-colors whitespace-nowrap"
          >
            Redeem →
          </a>
        </div>
      </div>
    </main>
  )
}
