'use client'

import { useState } from 'react'
import Nav from '@/components/layout/Nav'
import type { QurbaniOrder, QurbaniOrderStatus } from '@/types'

const STEPS: { status: QurbaniOrderStatus; label: string; arabic: string }[] = [
  { status: 'pending_payment', label: 'Order Placed', arabic: 'تم الطلب' },
  { status: 'confirmed', label: 'Payment Confirmed', arabic: 'تأكيد الدفع' },
  { status: 'slaughtered', label: 'Qurbani Performed', arabic: 'تم الذبح' },
  { status: 'distributed', label: 'Meat Distributed', arabic: 'تم التوزيع' },
]

const STATUS_ORDER: Record<QurbaniOrderStatus, number> = {
  pending_payment:         0,
  confirmed:               1,
  partner_allocated:       1,
  animal_verified:         1,
  evidence_uploaded:       2,
  slaughter_approved:      2,
  slaughtered:             2,
  meat_processed:          2,
  distribution_dispatched: 2,
  distributed:             3,
  certificate_issued:      3,
  financially_settled:     3,
  closed:                  3,
  cancelled:               -1,
}

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount / 100)
}

export default function QurbaniTrackPage() {
  const [ref, setRef] = useState('')
  const [order, setOrder] = useState<QurbaniOrder | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function lookup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setOrder(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/qurbani/order?ref=${encodeURIComponent(ref.trim())}`)
      if (!res.ok) { setError('Order not found. Check your reference and try again.'); return }
      setOrder(await res.json())
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  const stepIdx = order ? (STATUS_ORDER[order.status] ?? 0) : -1

  return (
    <>
      <main className="min-h-screen bg-[#F0F4F3]">
        <div className="bg-[#1A3D2B] text-white px-6 py-12 text-center">
          <p className="arabic text-[#C9A84C] text-2xl mb-2">تتبع الطلب</p>
          <h1 className="text-3xl font-bold">Track Your Qurbani</h1>
          <p className="text-white/60 text-sm mt-1">Enter your order reference to check the status</p>
        </div>

        <div className="max-w-md mx-auto px-6 py-10 space-y-6">
          <form onSubmit={lookup} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Order Reference</label>
              <input
                required value={ref} onChange={e => setRef(e.target.value)}
                placeholder="QOR-XXXXXX or IMA-XXXXXX"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B] font-mono"
              />
            </div>
            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#1A3D2B] text-white font-semibold text-sm hover:bg-[#143020] transition-colors disabled:opacity-60">
              {loading ? 'Looking up…' : 'Track Order'}
            </button>
          </form>

          {order && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <div>
                <p className="text-xs text-gray-400 font-semibold mb-0.5">Order</p>
                <p className="font-mono text-sm font-bold text-[#1A3D2B]">{order.order_reference}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Donor</p>
                  <p className="font-semibold">{order.donor_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Animal</p>
                  <p className="font-semibold">{order.animal_label}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Amount</p>
                  <p className="font-semibold">{fmt(order.amount, order.currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Niyyah</p>
                  <p className="font-semibold capitalize">{order.niyyah}{order.niyyah_name ? ` — ${order.niyyah_name}` : ''}</p>
                </div>
              </div>

              {order.status === 'cancelled' ? (
                <div className="bg-red-50 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">Order cancelled.</div>
              ) : (
                <div className="space-y-2">
                  {STEPS.map((step, i) => {
                    const done = i <= stepIdx
                    const current = i === stepIdx
                    return (
                      <div key={step.status} className={`flex items-center gap-3 p-3 rounded-xl ${current ? 'bg-[#1A3D2B]/8' : ''}`}>
                        <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${done ? 'bg-[#1A3D2B] text-white' : 'bg-gray-100 text-gray-400'}`}>
                          {done ? '✓' : i + 1}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-semibold ${done ? 'text-[#1A3D2B]' : 'text-gray-400'}`}>{step.label}</p>
                          {step.status === 'slaughtered' && order.slaughter_date && (
                            <p className="text-xs text-gray-500">{order.slaughter_date}{order.slaughter_location ? ` · ${order.slaughter_location}` : ''}</p>
                          )}
                        </div>
                        <span className="arabic text-xs text-gray-400">{step.arabic}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
