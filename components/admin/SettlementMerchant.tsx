'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Order } from '@/types'

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency: currency.toUpperCase(), minimumFractionDigits: 2 }).format(amount / 100)
}

export default function SettlementMerchant({
  merchantName,
  pendingOrders,
  settledOrders,
  currency,
}: {
  merchantName: string
  pendingOrders: Order[]
  settledOrders: Order[]
  currency: string
}) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [settling, setSettling] = useState(false)
  const [settled, setSettled] = useState(false)

  const pendingMosque = pendingOrders.reduce((s, o) => s + o.mosque_portion, 0)
  const pendingMerchant = pendingOrders.reduce((s, o) => s + o.merchant_portion, 0)
  const pendingTotal = pendingOrders.reduce((s, o) => s + o.total, 0)

  const settledMerchant = settledOrders.reduce((s, o) => s + o.merchant_portion, 0)
  const allOrders = [...pendingOrders, ...settledOrders]
  const totalVouchers = allOrders.reduce((s, o) => s + o.quantity, 0)

  async function handleSettle() {
    if (!pendingOrders.length) return
    setSettling(true)
    try {
      await fetch('/api/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ references: pendingOrders.map(o => o.reference) }),
      })
      setSettled(true)
      router.refresh()
    } catch {
      setSettling(false)
    }
  }

  const hasPending = pendingOrders.length > 0 && !settled

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Merchant header row */}
      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900">{merchantName}</h3>
            {hasPending ? (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                Settlement due
              </span>
            ) : (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                Up to date
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">
            {totalVouchers} voucher{totalVouchers !== 1 ? 's' : ''} total ·{' '}
            {settledOrders.length > 0 && (
              <span className="text-emerald-600">{fmt(settledMerchant, currency)} settled · </span>
            )}
            {hasPending && <span className="text-amber-600 font-semibold">{fmt(pendingMerchant, currency)} pending</span>}
            {!hasPending && <span className="text-gray-500">All settled</span>}
          </p>
        </div>

        {/* Amounts */}
        <div className="flex items-center gap-6 flex-shrink-0">
          {hasPending && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Collected from buyers</p>
              <p className="font-bold text-gray-700">{fmt(pendingTotal, currency)}</p>
              <div className="flex gap-3 text-xs mt-0.5">
                <span className="text-[#1A3D2B]">Mosque: {fmt(pendingMosque, currency)}</span>
                <span className="text-amber-600 font-semibold">Pay: {fmt(pendingMerchant, currency)}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-xs px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors"
            >
              {expanded ? 'Hide' : 'View'} orders
            </button>
            {hasPending && (
              <button
                onClick={handleSettle}
                disabled={settling}
                className="text-sm px-4 py-2 rounded-xl bg-[#1A3D2B] text-white font-semibold hover:bg-[#2D6A4F] disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {settling ? 'Marking…' : `Mark settled · ${fmt(pendingMerchant, currency)}`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Order breakdown (expandable) */}
      {expanded && (
        <div className="border-t border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-50">
                <th className="text-left px-5 py-2.5 font-semibold">Reference</th>
                <th className="text-left px-5 py-2.5 font-semibold">Buyer</th>
                <th className="text-right px-5 py-2.5 font-semibold">Qty</th>
                <th className="text-right px-5 py-2.5 font-semibold">Total paid</th>
                <th className="text-right px-5 py-2.5 font-semibold">Merchant share</th>
                <th className="text-right px-5 py-2.5 font-semibold">Verified</th>
                <th className="text-center px-5 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {allOrders.map(order => (
                <tr key={order.reference} className="border-b border-gray-50 hover:bg-[#FAFAFA]">
                  <td className="px-5 py-3 font-mono text-xs font-semibold text-gray-700">{order.reference}</td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800">{order.buyer_name}</p>
                    <p className="text-xs text-gray-400">{order.buyer_email}</p>
                  </td>
                  <td className="px-5 py-3 text-right text-gray-600">{order.quantity}</td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-700">{fmt(order.total, currency)}</td>
                  <td className="px-5 py-3 text-right font-semibold text-amber-700">{fmt(order.merchant_portion, currency)}</td>
                  <td className="px-5 py-3 text-right text-xs text-gray-400">
                    {order.verified_at
                      ? new Date(order.verified_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })
                      : '—'}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      order.merchant_settled
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {order.merchant_settled ? 'Settled' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
