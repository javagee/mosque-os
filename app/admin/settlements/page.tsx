import Link from 'next/link'
import { db } from '@/lib/db'
import SettlementMerchant from '@/components/admin/SettlementMerchant'
import type { Coupon } from '@/types'

export const dynamic = 'force-dynamic'

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency: currency.toUpperCase(), minimumFractionDigits: 2 }).format(amount / 100)
}

function groupByMerchant(coupons: Coupon[]) {
  const map: Record<string, { pending: Coupon[]; settled: Coupon[]; currency: string }> = {}
  for (const coupon of coupons) {
    const merchant = coupon.campaign?.merchant_name ?? 'Unknown Merchant'
    const currency = coupon.campaign?.currency ?? 'sgd'
    if (!map[merchant]) map[merchant] = { pending: [], settled: [], currency }
    if (coupon.merchant_settled) map[merchant].settled.push(coupon)
    else map[merchant].pending.push(coupon)
  }
  return map
}

export default async function SettlementsPage() {
  const redeemedCoupons = await db.getRedeemedCoupons()
  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'
  const byMerchant = groupByMerchant(redeemedCoupons)

  const currency = redeemedCoupons[0]?.campaign?.currency ?? 'sgd'

  const pendingCoupons = redeemedCoupons.filter(c => !c.merchant_settled)
  const settledCoupons = redeemedCoupons.filter(c => c.merchant_settled)

  const merchantPortion = (c: Coupon) => Math.floor((c.campaign?.coupon_price ?? 0) / 2)
  const mosquePortion = (c: Coupon) => (c.campaign?.coupon_price ?? 0) - merchantPortion(c)

  const totalPendingMerchant = pendingCoupons.reduce((s, c) => s + merchantPortion(c), 0)
  const totalPendingMosque = pendingCoupons.reduce((s, c) => s + mosquePortion(c), 0)
  const totalSettledMerchant = settledCoupons.reduce((s, c) => s + merchantPortion(c), 0)
  const totalCollected = redeemedCoupons.reduce((s, c) => s + (c.campaign?.coupon_price ?? 0), 0)
  const pendingMerchantCount = Object.values(byMerchant).filter(m => m.pending.length > 0).length

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1A3D2B]">Settlement Report</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {mosqueName} · Based on redeemed vouchers
            </p>
          </div>
          <Link href="/admin" className="text-sm text-[#1A3D2B] font-semibold hover:underline">
            ← Back to admin
          </Link>
        </div>

        {redeemedCoupons.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-600">No redeemed vouchers yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Settlement is calculated from vouchers that customers have redeemed at merchants.<br />
              Once a merchant scans a voucher at <code className="bg-gray-100 px-1 rounded">/merchant/redeem</code>, it appears here.
            </p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  label: 'Total redeemed value',
                  value: fmt(totalCollected, currency),
                  sub: `${redeemedCoupons.length} voucher${redeemedCoupons.length !== 1 ? 's' : ''} redeemed`,
                  color: 'text-gray-800',
                },
                {
                  label: 'Mosque income',
                  value: fmt(totalPendingMosque + settledCoupons.reduce((s, c) => s + mosquePortion(c), 0), currency),
                  sub: '50% of redeemed value',
                  color: 'text-[#1A3D2B]',
                },
                {
                  label: 'Pending payment',
                  value: fmt(totalPendingMerchant, currency),
                  sub: `${pendingMerchantCount} merchant${pendingMerchantCount !== 1 ? 's' : ''} to settle`,
                  color: pendingMerchantCount > 0 ? 'text-amber-600' : 'text-gray-400',
                },
                {
                  label: 'Total settled',
                  value: fmt(totalSettledMerchant, currency),
                  sub: `${settledCoupons.length} vouchers paid out`,
                  color: 'text-emerald-600',
                },
              ].map(card => (
                <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <p className="text-xs font-semibold text-gray-400 mb-1">{card.label}</p>
                  <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* How settlement works */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 flex items-start gap-3">
              <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-700">
                Settlement is based on <strong>redeemed vouchers only</strong> — when a customer uses their voucher at the merchant.
                Transfer the merchant&apos;s share via PayNow, then click <strong>Mark settled</strong>.
              </p>
            </div>

            {/* Per-merchant settlement cards */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-gray-700">Merchants</h2>
              {Object.entries(byMerchant)
                .sort(([, a], [, b]) => b.pending.length - a.pending.length)
                .map(([merchant, { pending, settled, currency: cur }]) => (
                  <SettlementMerchant
                    key={merchant}
                    merchantName={merchant}
                    pendingCoupons={pending}
                    settledCoupons={settled}
                    currency={cur}
                  />
                ))}
            </div>

            {/* Settlement history */}
            {settledCoupons.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-bold text-gray-700">Settlement history</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-400 border-b border-gray-50">
                        <th className="text-left px-5 py-3 font-semibold">Voucher token</th>
                        <th className="text-left px-5 py-3 font-semibold">Campaign</th>
                        <th className="text-left px-5 py-3 font-semibold">Merchant</th>
                        <th className="text-left px-5 py-3 font-semibold">Buyer</th>
                        <th className="text-right px-5 py-3 font-semibold">Redeemed</th>
                        <th className="text-right px-5 py-3 font-semibold">Paid to merchant</th>
                        <th className="text-right px-5 py-3 font-semibold">Settled on</th>
                      </tr>
                    </thead>
                    <tbody>
                      {settledCoupons
                        .sort((a, b) => new Date(b.merchant_settled_at!).getTime() - new Date(a.merchant_settled_at!).getTime())
                        .map(coupon => (
                          <tr key={coupon.token} className="border-b border-gray-50 hover:bg-[#FAFAFA]">
                            <td className="px-5 py-3 font-mono text-xs text-gray-500">{coupon.serial_number}</td>
                            <td className="px-5 py-3 text-gray-700 text-xs">{coupon.campaign?.name ?? '—'}</td>
                            <td className="px-5 py-3 font-medium text-gray-800">{coupon.campaign?.merchant_name ?? '—'}</td>
                            <td className="px-5 py-3 text-xs text-gray-500">{coupon.buyer_name}</td>
                            <td className="px-5 py-3 text-right text-xs text-gray-400">
                              {coupon.redeemed_at
                                ? new Date(coupon.redeemed_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })
                                : '—'}
                            </td>
                            <td className="px-5 py-3 text-right font-semibold text-emerald-700">
                              {fmt(merchantPortion(coupon), coupon.campaign?.currency ?? 'sgd')}
                            </td>
                            <td className="px-5 py-3 text-right text-xs text-gray-400">
                              {coupon.merchant_settled_at
                                ? new Date(coupon.merchant_settled_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })
                                : '—'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
