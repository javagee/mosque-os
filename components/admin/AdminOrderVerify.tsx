'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Order } from '@/types'

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount / 100)
}

export default function AdminOrderVerify({ order }: { order: Order }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function verify() {
    setLoading(true)
    await fetch(`/api/orders/${order.reference}/verify`, { method: 'POST' })
    setDone(true)
    setLoading(false)
    router.refresh()
  }

  const paidAt = order.paid_at
    ? new Date(order.paid_at).toLocaleString('en-SG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '—'

  return (
    <div className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 transition-opacity ${done ? 'opacity-40' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-mono text-sm font-bold text-amber-800">{order.reference}</span>
          <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
            {order.quantity} coupon{order.quantity > 1 ? 's' : ''}
          </span>
        </div>
        <p className="text-sm text-gray-700">
          <strong>{order.buyer_name}</strong> · {order.buyer_email}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {order.campaign_name} · {order.merchant_name} · Paid {paidAt}
        </p>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right">
          <p className="font-bold text-[#1A3D2B]">{formatCurrency(order.total, order.currency)}</p>
          <p className="text-xs text-gray-400">
            Mosque: {formatCurrency(order.mosque_portion, order.currency)} · Merchant: {formatCurrency(order.merchant_portion, order.currency)}
          </p>
        </div>
        <button
          onClick={verify}
          disabled={loading || done}
          className="px-4 py-2 rounded-xl bg-[#1A3D2B] text-white text-sm font-semibold hover:bg-[#2D6A4F] disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {done ? '✓ Verified' : loading ? 'Verifying…' : 'Verify payment'}
        </button>
      </div>
    </div>
  )
}
