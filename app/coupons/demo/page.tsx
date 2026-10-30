import CouponDisplay from '@/components/coupon/CouponDisplay'

const DEMO_COUPON = {
  token: 'DEMO-SMPL-0001',
  serial_number: 'IMA-DEMO01-01',
  status: 'active' as const,
  buyer_name: 'Ahmad bin Abdullah',
  buyer_email: 'ahmad@example.com',
  redeemed_at: null,
  redeemed_outlet: null,
  campaign: {
    id: 'demo',
    name: 'Nasi Lemak Deluxe Set',
    merchant_name: 'Warung Al-Barakah',
    coupon_price: 1200,
    currency: 'sgd',
    image_url: '/images/nasi-lemak-family-set.jpg',
    redemption_start: new Date().toISOString(),
    redemption_end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
}

export default function DemoCouponPage() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mosque-os-ai.vercel.app'
  const redemptionUrl = `${appUrl}/coupons/DEMO-SMPL-0001`

  return (
    <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center">
          <p className="text-xs font-semibold text-amber-700">Demo coupon — for presentation only</p>
        </div>
        <CouponDisplay coupon={DEMO_COUPON as never} redemptionUrl={redemptionUrl} />
      </div>
    </main>
  )
}
