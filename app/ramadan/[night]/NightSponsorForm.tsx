'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { RamadanNightData } from '@/types'

function sgd(cents: number) {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', minimumFractionDigits: 0 }).format(cents / 100)
}

export default function NightSponsorForm({ night, year }: { night: RamadanNightData; year: number }) {
  const router = useRouter()
  const remaining = Math.max(0, night.target - night.raised)
  const presets = [
    { label: `Full (${sgd(night.target)})`, cents: night.target },
    { label: `Half (${sgd(Math.floor(night.target / 2))})`, cents: Math.floor(night.target / 2) },
    { label: 'Custom', cents: 0 },
  ]

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [preset, setPreset] = useState(0)
  const [customAmt, setCustomAmt] = useState('')
  const [message, setMessage] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isCustom = preset === 2
  const amount = isCustom
    ? Math.round(parseFloat(customAmt || '0') * 100)
    : presets[preset].cents

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) { setError('Please fill in your name and email.'); return }
    if (amount < 100) { setError('Minimum amount is S$1.'); return }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ramadan/sponsor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          night: night.night,
          year,
          donor_name: name.trim(),
          donor_email: email.trim(),
          amount,
          message: message.trim() || undefined,
          anonymous,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong')
        return
      }
      const { order_reference } = await res.json()
      router.push(`/pay/${order_reference}`)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {night.status === 'sponsored' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800">
          This night is already fully sponsored. You can still add a contribution to increase the total.
        </div>
      )}

      {/* Amount selection */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-2">Your contribution</label>
        <div className="grid grid-cols-3 gap-2 mb-2">
          {presets.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPreset(i)}
              className={`py-2.5 px-2 rounded-xl text-sm font-semibold border transition-colors ${
                preset === i
                  ? 'bg-[#1A3D2B] text-white border-[#1A3D2B]'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-[#1A3D2B]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {isCustom && (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">S$</span>
            <input
              type="number"
              min="1"
              step="1"
              value={customAmt}
              onChange={e => setCustomAmt(e.target.value)}
              placeholder="0"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B]"
            />
          </div>
        )}
        {remaining > 0 && !isCustom && preset !== 0 && (
          <p className="text-xs text-gray-400 mt-1">Remaining to fully sponsor this night: {sgd(remaining)}</p>
        )}
      </div>

      {/* Name & email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Your name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ahmad bin Abdullah"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B]"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="ahmad@email.com"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B]"
            required
          />
        </div>
      </div>

      {/* Message */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Dedication message <span className="font-normal text-gray-400">(optional)</span></label>
        <input
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="In memory of my father…"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B]"
        />
      </div>

      {/* Anonymous toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <div
          onClick={() => setAnonymous(a => !a)}
          className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 ${anonymous ? 'bg-[#1A3D2B]' : 'bg-gray-200'}`}
        >
          <div className={`w-4 h-4 bg-white rounded-full m-0.5 transition-transform ${anonymous ? 'translate-x-5' : 'translate-x-0'}`} />
        </div>
        <span className="text-sm text-gray-600">Show as Anonymous on the board</span>
      </label>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || amount < 100}
        className="w-full py-3.5 bg-[#1A3D2B] text-white font-bold rounded-xl hover:bg-[#2D6A4F] disabled:opacity-40 transition-colors shadow-lg"
      >
        {loading ? 'Preparing payment…' : `Sponsor Night ${night.night} · ${sgd(amount)}`}
      </button>

      <p className="text-center text-xs text-gray-400">
        JazakAllah Khayran — your name will appear on the board once your payment is verified by the mosque.
      </p>
    </form>
  )
}
