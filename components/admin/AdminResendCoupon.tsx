'use client'

import { useState } from 'react'

export default function AdminResendCoupon() {
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  async function handleResend(e: React.FormEvent) {
    e.preventDefault()
    const ref = reference.trim().toUpperCase()
    if (!ref) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/orders/${ref}/resend-coupon`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setResult({ ok: true, message: `E-coupon resent to ${data.to} (${data.coupons} coupon${data.coupons > 1 ? 's' : ''})` })
        setReference('')
      } else {
        setResult({ ok: false, message: data.error ?? 'Failed to resend' })
      }
    } catch {
      setResult({ ok: false, message: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-bold text-gray-700 mb-1">Resend E-Coupon Email</h3>
      <p className="text-xs text-gray-400 mb-4">Use if a buyer did not receive their e-coupon after verification.</p>
      <form onSubmit={handleResend} className="flex gap-2 flex-wrap">
        <input
          type="text"
          value={reference}
          onChange={e => { setReference(e.target.value.toUpperCase()); setResult(null) }}
          placeholder="IMA-XXXXXX"
          className="flex-1 min-w-0 px-4 py-2.5 border border-gray-200 rounded-xl font-mono text-sm font-bold text-[#1A3D2B] tracking-widest placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B] uppercase"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={loading || !reference.trim()}
          className="px-5 py-2.5 rounded-xl bg-[#1A3D2B] text-white text-sm font-semibold hover:bg-[#2D6A4F] disabled:opacity-40 transition-colors whitespace-nowrap"
        >
          {loading ? 'Sending…' : 'Resend coupon'}
        </button>
      </form>
      {result && (
        <p className={`mt-3 text-sm font-semibold rounded-xl px-4 py-2.5 ${result.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {result.ok ? '✓ ' : '✗ '}{result.message}
        </p>
      )}
    </div>
  )
}
