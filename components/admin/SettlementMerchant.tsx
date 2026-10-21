'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Coupon } from '@/types'

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency: currency.toUpperCase(), minimumFractionDigits: 2 }).format(amount / 100)
}

const merchantPortion = (c: Coupon) => Math.floor((c.campaign?.coupon_price ?? 0) / 2)
const mosquePortion = (c: Coupon) => (c.campaign?.coupon_price ?? 0) - merchantPortion(c)

export default function SettlementMerchant({
  merchantName,
  pendingCoupons,
  settledCoupons,
  currency,
}: {
  merchantName: string
  pendingCoupons: Coupon[]
  settledCoupons: Coupon[]
  currency: string
}) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [settling, setSettling] = useState(false)
  const [done, setDone] = useState(false)

  const pendingMerchantTotal = pendingCoupons.reduce((s, c) => s + merchantPortion(c), 0)
  const pendingMosqueTotal = pendingCoupons.reduce((s, c) => s + mosquePortion(c), 0)
  const settledMerchantTotal = settledCoupons.reduce((s, c) => s + merchantPortion(c), 0)
  const allCoupons = [...pendingCoupons, ...settledCoupons]
  const hasPending = pendingCoupons.length > 0 && !done

  async function handleSettle() {
    if (!pendingCoupons.length) return
    setSettling(true)
    try {
      await fetch('/api/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens: pendingCoupons.map(c => c.token) }),
      })
      setDone(true)
      router.refresh()
    } catch {
      setSettling(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900">{merchantName}</h3>
            {hasPending ? (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Settlement due</span>
            ) : (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Up to date</span>
            )}
          </div>
          <p className="text-xs text-gray-400">
            {allCoupons.length} voucher{allCoupons.length !== 1 ? 's' : ''} redeemed ·{' '}
            {settledCoupons.length > 0 && (
              <span className="text-emerald-600">{fmt(settledMerchantTotal, currency)} settled · </span>
            )}
            {hasPending
              ? <span className="text-amber-600 font-semibold">{fmt(pendingMerchantTotal, currency)} pending</span>
              : <span className="text-gray-500">All settled</span>
            }
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {hasPending && (
            <div className="text-right">
              <p className="text-xs text-gray-400">{pendingCoupons.length} redeemed vouchers</p>
              <div className="flex gap-3 text-xs mt-0.5">
                <span className="text-[#1A3D2B]">Mosque keeps: {fmt(pendingMosqueTotal, currency)}</span>
                <span className="text-amber-600 font-semibold">Pay merchant: {fmt(pendingMerchantTotal, currency)}</span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-xs px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:border-gray-300 transition-colors"
            >
              {expanded ? 'Hide' : 'View'} vouchers
            </button>
            {hasPending && (
              <button
                onClick={handleSettle}
                disabled={settling}
                className="text-sm px-4 py-2 rounded-xl bg-[#1A3D2B] text-white font-semibold hover:bg-[#2D6A4F] disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {settling ? 'Marking…' : `Mark settled · ${fmt(pendingMerchantTotal, currency)}`}
              </button>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-50">
                <th className="text-left px-5 py-2.5 font-semibold">Serial</th>
                <th className="text-left px-5 py-2.5 font-semibold">Campaign</th>
                <th className="text-left px-5 py-2.5 font-semibold">Buyer</th>
                <th className="text-right px-5 py-2.5 font-semibold">Voucher value</th>
                <th className="text-right px-5 py-2.5 font-semibold">Merchant share</th>
                <th className="text-right px-5 py-2.5 font-semibold">Redeemed</th>
                <th className="text-center px-5 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {allCoupons.map(coupon => (
                <tr key={coupon.token} className="border-b border-gray-50 hover:bg-[#FAFAFA]">
                  <td className="px-5 py-3 font-mono text-xs text-gray-600">{coupon.serial_number}</td>
                  <td className="px-5 py-3 text-xs text-gray-600">{coupon.campaign?.name ?? '—'}</td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800 text-xs">{coupon.buyer_name}</p>
                    <p className="text-gray-400 text-xs">{coupon.buyer_email}</p>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-700">
                    {fmt(coupon.campaign?.coupon_price ?? 0, currency)}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-amber-700">
                    {fmt(merchantPortion(coupon), currency)}
                  </td>
                  <td className="px-5 py-3 text-right text-xs text-gray-400">
                    {coupon.redeemed_at
                      ? new Date(coupon.redeemed_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      coupon.merchant_settled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {coupon.merchant_settled ? 'Settled' : 'Pending'}
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
