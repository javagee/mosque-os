import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import MerchantSidebarLayout from '@/components/merchant/MerchantSidebarLayout'

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
  const share = (cents: number) => Math.floor(cents / 2)

  const pending = coupons.filter(c => !c.merchant_settled)
  const settled = coupons.filter(c => c.merchant_settled)
  const totalPending = pending.reduce((s, c) => s + share(c.campaign?.coupon_price ?? 0), 0)
  const totalSettled = settled.reduce((s, c) => s + share(c.campaign?.coupon_price ?? 0), 0)

  return (
    <MerchantSidebarLayout merchantName={merchantName}>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div>
          <p className="text-[#C9A84C] text-xs font-semibold tracking-widest mb-0.5">MERCHANT PORTAL</p>
          <h1 className="text-2xl font-bold text-[#1A3D2B]">Redemption History</h1>
          <p className="text-sm text-gray-400 mt-0.5">{merchantName} · your share is 50% of each voucher</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Redeemed', value: coupons.length.toString(), sub: 'vouchers', color: 'text-[#1A3D2B]' },
            { label: 'Pending Payout', value: fmt(totalPending, currency), sub: `${pending.length} unsettled`, color: totalPending > 0 ? 'text-amber-600' : 'text-gray-400' },
            { label: 'Total Earned', value: fmt(totalSettled + totalPending, currency), sub: `${fmt(totalSettled, currency)} paid`, color: 'text-emerald-700' },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-semibold text-gray-400 mb-1">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
            </div>
          ))}
        </div>

        {totalPending > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
            <p className="text-sm text-amber-700">
              <span className="font-bold">{fmt(totalPending, currency)}</span> pending settlement —
              the mosque will PayNow this to you once redemptions are verified.
            </p>
          </div>
        )}

        {/* Redemption list */}
        {coupons.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-500">No redemptions yet</p>
            <p className="text-sm text-gray-400 mt-1">Vouchers redeemed at your outlet will appear here.</p>
            <a href="/merchant/redeem" className="inline-block mt-4 text-sm text-[#1A3D2B] font-semibold hover:underline">
              Redeem a voucher →
            </a>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-700">All redemptions</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {coupons.map(coupon => {
                const price = coupon.campaign?.coupon_price ?? 0
                const cur = coupon.campaign?.currency ?? currency
                return (
                  <div key={coupon.token} className="px-5 py-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-xs text-gray-400">{coupon.serial_number}</span>
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                          coupon.merchant_settled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
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
                      <p className="font-bold text-[#1A3D2B]">{fmt(share(price), cur)}</p>
                      <p className="text-xs text-gray-300">{fmt(price, cur)} voucher</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </MerchantSidebarLayout>
  )
}
