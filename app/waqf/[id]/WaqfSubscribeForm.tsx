'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { WaqfAsset } from '@/types'

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount / 100)
}

export default function WaqfSubscribeForm({ asset }: { asset: WaqfAsset }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [shares, setShares] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const total = asset.unit_price * shares

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/waqf/${asset.id}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donor_name: name, donor_email: email, shares }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong'); return }
      router.push(`/pay/${data.order_reference}`)
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div>
        <p className="text-sm font-semibold text-gray-400 mb-0.5">Unit price</p>
        <p className="text-2xl font-bold text-[#1A3D2B]">{fmt(asset.unit_price, asset.currency)} <span className="text-sm font-normal text-gray-400">per share</span></p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
        <input
          required value={name} onChange={e => setName(e.target.value)}
          placeholder="Your full name"
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B]"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Email Address</label>
        <input
          required type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B]"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Number of Shares</label>
        <input
          required type="number" min={1} value={shares} onChange={e => setShares(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B]"
        />
        <p className="text-xs text-gray-400 mt-1">{shares} share{shares !== 1 ? 's' : ''} × {fmt(asset.unit_price, asset.currency)} = <span className="font-bold text-[#1A3D2B]">{fmt(total, asset.currency)}</span></p>
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

      <button
        type="submit" disabled={loading}
        className="w-full py-3 rounded-xl bg-[#1A3D2B] text-white font-semibold text-sm hover:bg-[#143020] transition-colors disabled:opacity-60"
      >
        {loading ? 'Processing…' : `Subscribe — ${fmt(total, asset.currency)}`}
      </button>

      <p className="arabic text-center text-[#C9A84C]/70 text-sm">الوقف للأبد — The endowment is forever</p>
      <p className="text-center text-[10px] text-gray-400 leading-relaxed">
        Your principal is permanently preserved. Only returns are disbursed for charitable purposes, in accordance with AAOIFI Waqf Standards.
      </p>
    </form>
  )
}
