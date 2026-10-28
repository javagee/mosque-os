'use client'

import { useState } from 'react'
import { DONATION_CATEGORIES, PRESET_AMOUNTS, type DonationCategory, type DonationType } from '@/types'

export default function DonationForm() {
  const [category, setCategory] = useState<DonationCategory>('sadaqah')
  const [type, setType] = useState<DonationType>('one-time')
  const [amount, setAmount] = useState<number>(25)
  const [customAmount, setCustomAmount] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const finalAmount = customAmount ? parseFloat(customAmount) : amount

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Please enter your name'
    if (!email.trim() || !email.includes('@')) e.email = 'Please enter a valid email'
    if (!finalAmount || finalAmount < 1) e.amount = 'Minimum donation is S$1'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleDonate() {
    if (!validate()) return
    setLoading(true)
    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donor_name: name, donor_email: email, amount: finalAmount, category, type }),
      })
      const { reference, error } = await res.json()
      if (reference) {
        window.location.href = `/pay/donation/${reference}`
      } else {
        alert(error ?? 'Something went wrong. Please try again.')
        setLoading(false)
      }
    } catch {
      alert('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

      {/* Type toggle */}
      <div className="flex border-b border-gray-100">
        {(['one-time', 'monthly'] as DonationType[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`flex-1 py-3.5 text-sm font-semibold transition-colors relative ${
              type === t ? 'text-[#1A3D2B]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {t === 'one-time' ? 'Give once' : 'Give monthly'}
            {type === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A3D2B]" />}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-5">

        {/* Donor details */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-1 transition-all ${
                errors.name ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-[#1A3D2B] focus:ring-[#1A3D2B]/20'
              }`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-1 transition-all ${
                errors.email ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-[#1A3D2B] focus:ring-[#1A3D2B]/20'
              }`}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>
        </div>

        {/* Category selection */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Donation type</p>
          <div className="space-y-2">
            {(Object.entries(DONATION_CATEGORIES) as [DonationCategory, typeof DONATION_CATEGORIES[DonationCategory]][]).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                  category === key
                    ? 'border-[#1A3D2B] bg-[#F0F7F3] shadow-sm'
                    : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${
                    category === key ? 'bg-[#1A3D2B]' : 'bg-gray-300'
                  }`} />
                  <div>
                    <span className={`text-sm font-semibold ${category === key ? 'text-[#1A3D2B]' : 'text-gray-700'}`}>
                      {cat.label}
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">{cat.description}</p>
                  </div>
                </div>
                <span className="arabic text-lg text-[#C9A84C] font-semibold ml-3 flex-shrink-0">{cat.arabic}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Amount selection */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Amount</p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {PRESET_AMOUNTS.map((a) => (
              <button
                key={a}
                onClick={() => { setAmount(a); setCustomAmount('') }}
                className={`py-3 rounded-xl text-sm font-bold transition-all ${
                  amount === a && !customAmount
                    ? 'bg-[#1A3D2B] text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 border border-gray-100 hover:border-gray-300 hover:bg-white'
                }`}
              >
                S${a}
              </button>
            ))}
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">S$</span>
            <input
              type="number"
              placeholder="Other amount"
              value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setAmount(0) }}
              className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A3D2B] focus:ring-1 focus:ring-[#1A3D2B]/20 transition-all"
              min={1}
            />
          </div>
          {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
        </div>

        {/* Donate button */}
        <button
          onClick={handleDonate}
          disabled={loading}
          className="w-full py-4 rounded-xl text-base font-bold bg-[#1A3D2B] hover:bg-[#2D6A4F] disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors shadow-sm"
        >
          {loading
            ? 'Processing...'
            : `Donate S$${finalAmount || '—'}${type === 'monthly' ? '/month' : ''}`}
        </button>

        <p className="text-xs text-center text-gray-400">
          PayNow · Zero fees · Your data stays with the mosque
        </p>
      </div>
    </div>
  )
}
