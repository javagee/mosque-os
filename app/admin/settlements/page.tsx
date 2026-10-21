import Link from 'next/link'
import { getVerifiedOrders } from '@/lib/order-store'
import SettlementMerchant from '@/components/admin/SettlementMerchant'
import type { Order } from '@/types'

export const dynamic = 'force-dynamic'

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency: currency.toUpperCase(), minimumFractionDigits: 2 }).format(amount / 100)
}

function groupByMerchant(orders: Order[]) {
  const map: Record<string, { pending: Order[]; settled: Order[]; currency: string }> = {}
  for (const order of orders) {
    if (!map[order.merchant_name]) {
      map[order.merchant_name] = { pending: [], settled: [], currency: order.currency }
    }
    if (order.merchant_settled) {
      map[order.merchant_name].settled.push(order)
    } else {
      map[order.merchant_name].pending.push(order)
    }
  }
  return map
}

export default async function SettlementsPage() {
  const orders = await getVerifiedOrders()
  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'
  const byMerchant = groupByMerchant(orders)

  const totalPendingMerchant = orders.filter(o => !o.merchant_settled).reduce((s, o) => s + o.merchant_portion, 0)
  const totalPendingMosque = orders.filter(o => !o.merchant_settled).reduce((s, o) => s + o.mosque_portion, 0)
  const totalSettledMerchant = orders.filter(o => o.merchant_settled).reduce((s, o) => s + o.merchant_portion, 0)
  const totalCollected = orders.reduce((s, o) => s + o.total, 0)
  const pendingMerchantCount = Object.values(byMerchant).filter(m => m.pending.length > 0).length
  const currency = orders[0]?.currency ?? 'sgd'

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1A3D2B]">Settlement Report</h1>
            <p className="text-sm text-gray-400 mt-1">Imara · {mosqueName}</p>
          </div>
          <Link href="/admin" className="text-sm text-[#1A3D2B] font-semibold hover:underline">
            ← Back to admin
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-600">No verified orders yet</p>
            <p className="text-sm text-gray-400 mt-1">Verified PayNow orders will appear here for settlement.</p>
            <Link href="/admin" className="inline-block mt-4 text-sm text-[#1A3D2B] font-semibold hover:underline">
              View pending verifications →
            </Link>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  label: 'Total collected',
                  value: fmt(totalCollected, currency),
                  sub: `${orders.length} verified order${orders.length !== 1 ? 's' : ''}`,
                  color: 'text-gray-800',
                },
                {
                  label: 'Mosque income',
                  value: fmt(totalPendingMosque + totalSettledMerchant > 0 ? orders.reduce((s, o) => s + o.mosque_portion, 0) : 0, currency),
                  sub: 'retained (50% of sales)',
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
                  sub: 'paid to merchants',
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

            {/* How to settle banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 flex items-start gap-3">
              <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-700">
                To settle: transfer the merchant&apos;s amount via PayNow to their account, then click <strong>Mark settled</strong> below. This records the settlement date for your records.
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
                    pendingOrders={pending}
                    settledOrders={settled}
                    currency={cur}
                  />
                ))}
            </div>

            {/* Settlement log */}
            {orders.some(o => o.merchant_settled) && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-bold text-gray-700">Settlement history</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-400 border-b border-gray-50">
                        <th className="text-left px-5 py-3 font-semibold">Reference</th>
                        <th className="text-left px-5 py-3 font-semibold">Merchant</th>
                        <th className="text-left px-5 py-3 font-semibold">Campaign</th>
                        <th className="text-right px-5 py-3 font-semibold">Paid to merchant</th>
                        <th className="text-right px-5 py-3 font-semibold">Settled on</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders
                        .filter(o => o.merchant_settled)
                        .sort((a, b) => new Date(b.merchant_settled_at!).getTime() - new Date(a.merchant_settled_at!).getTime())
                        .map(order => (
                          <tr key={order.reference} className="border-b border-gray-50 hover:bg-[#FAFAFA]">
                            <td className="px-5 py-3 font-mono text-xs text-gray-500">{order.reference}</td>
                            <td className="px-5 py-3 font-medium text-gray-800">{order.merchant_name}</td>
                            <td className="px-5 py-3 text-gray-500 text-xs">{order.campaign_name}</td>
                            <td className="px-5 py-3 text-right font-semibold text-emerald-700">
                              {fmt(order.merchant_portion, order.currency)}
                            </td>
                            <td className="px-5 py-3 text-right text-xs text-gray-400">
                              {order.merchant_settled_at
                                ? new Date(order.merchant_settled_at).toLocaleDateString('en-SG', {
                                    day: 'numeric', month: 'short', year: 'numeric',
                                  })
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
