import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import MerchantNav from '@/components/merchant/MerchantNav'

export const dynamic = 'force-dynamic'

function fmt(cents: number, currency: string) {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

export default async function MerchantHistoryPage() {
  const cookieStore = await cookies()
  const auth = cookieStore.get('merchant_auth')

  if (!auth?.value) redirect('/merchant/login')

  const merchantName = auth.value !== 'authenticated' ? auth.value : null
  if (!merchantName) redirect('/merchant/login?from=/merchant/history')

  const allRedeemed = await db.getRedeemedCoupons()
  const coupons = allRedeemed.filter(c => c.campaign?.merchant_name === merchantName)

  const currency = coupons[0]?.campaign?.currency ?? 'sgd'
  const merchantPortion = (cents: number) => Math.floor(cents / 2)

  const pendingCoupons = coupons.filter(c => !c.merchant_settled)
  const settledCoupons = coupons.filter(c => c.merchant_settled)
  const totalPending = pendingCoupons.reduce((s, c) => s + merchantPortion(c.campaign?.coupon_price ?? 0), 0)
  const totalSettled = settledCoupons.reduce((s, c) => s + merchantPortion(c.campaign?.coupon_price ?? 0), 0)

  return (
    <main className="min-h-screen bg-[#FAFAFA] px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <MerchantNav merchantName={merchantName} />

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total redeemed', value: coupons.length.toString(), sub: 'vouchers' },
            {
              label: 'Pending payout',
              value: fmt(totalPending, currency),
              sub: `${pendingCoupons.length} unsettled`,
              highlight: totalPending > 0,
            },
            {
              label: 'Total earned',
              value: fmt(totalSettled + totalPending, currency),
              sub: `${fmt(totalSettled, currency)} paid`,
            },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-semibold text-gray-400 mb-1">{card.label}</p>
              <p className={`text-xl font-bold ${card.highlight ? 'text-amber-600' : 'text-[#1A3D2B]'}`}>
                {card.value}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
            </div>
          ))}
        </div>

        {coupons.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-500">No redemptions yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Vouchers redeemed at your outlet will appear here.
            </p>
            <a
              href="/merchant/redeem"
              className="inline-block mt-4 text-sm text-[#1A3D2B] font-semibold hover:underline"
            >
              Redeem a voucher →
            </a>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-700">Redemption history</h2>
              <p className="text-xs text-gray-400 mt-0.5">Your share is 50% of each voucher value</p>
            </div>
            <div className="divide-y divide-gray-50">
              {coupons.map(coupon => {
                const price = coupon.campaign?.coupon_price ?? 0
                const share = merchantPortion(price)
                const cur = coupon.campaign?.currency ?? currency
                return (
                  <div key={coupon.token} className="px-5 py-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-xs text-gray-400">{coupon.serial_number}</span>
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                          coupon.merchant_settled
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {coupon.merchant_settled ? 'Paid' : 'Pending'}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-800 text-sm">{coupon.campaign?.name ?? '—'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {coupon.buyer_name}
                        {coupon.redeemed_at && (
                          <> · {new Date(coupon.redeemed_at).toLocaleDateString('en-SG', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}</>
                        )}
                        {coupon.redeemed_outlet && <> · {coupon.redeemed_outlet}</>}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-400">Your share</p>
                      <p className="font-bold text-[#1A3D2B]">{fmt(share, cur)}</p>
                      <p className="text-xs text-gray-300">{fmt(price, cur)} voucher</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {totalPending > 0 && (
              <div className="px-5 py-4 bg-amber-50 border-t border-amber-100">
                <p className="text-sm text-amber-700">
                  <span className="font-bold">{fmt(totalPending, currency)}</span> pending settlement
                  — the mosque will transfer this to you via PayNow after verifying redemptions.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
