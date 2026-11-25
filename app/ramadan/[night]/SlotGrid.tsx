'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { RamadanSlot } from '@/types'

function sgd(cents: number) {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', minimumFractionDigits: 0 }).format(cents / 100)
}

type Step = 'grid' | 'form' | 'paying'

export default function SlotGrid({ slots, night }: { slots: RamadanSlot[]; night: number }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('grid')
  const [selected, setSelected] = useState<RamadanSlot | null>(null)
  const [holdToken, setHoldToken] = useState('')
  const [holdExpiry, setHoldExpiry] = useState(0)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)

  // Countdown timer while holding
  const startCountdown = (expiresAt: number) => {
    const tick = () => {
      const remaining = Math.max(0, expiresAt - Math.floor(Date.now() / 1000))
      setCountdown(remaining)
      if (remaining > 0) setTimeout(tick, 1000)
    }
    tick()
  }

  async function handleSelectSlot(slot: RamadanSlot) {
    if (slot.status !== 'AVAILABLE') return
    setSelected(slot)
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/ramadan/slots/${slot.id}/hold`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'This slot is no longer available')
        setSelected(null)
        return
      }
      const data = await res.json()
      setHoldToken(data.hold_token)
      setHoldExpiry(data.expires_at)
      startCountdown(data.expires_at)
      setStep('form')
    } catch {
      setError('Failed to reserve slot. Please try again.')
      setSelected(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitClaim(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) { setError('Name and email are required'); return }
    if (!selected) return

    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/ramadan/slots/${selected.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hold_token: holdToken, donor_name: name.trim(), donor_email: email.trim(), donor_anonymous: anonymous }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong')
        return
      }
      const data = await res.json()
      router.push(`/pay/${data.order_reference}`)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const available = slots.filter(s => s.status === 'AVAILABLE').length
  const sponsored = slots.filter(s => s.status === 'SPONSORED').length

  if (!slots.length) return null

  if (step === 'form' && selected) {
    const mins = Math.floor(countdown / 60)
    const secs = countdown % 60
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => { setStep('grid'); setSelected(null) }} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
          <div>
            <p className="text-xs text-gray-400">Reserved for</p>
            <p className="font-bold text-[#1A3D2B] tabular-nums">
              {mins}:{String(secs).padStart(2, '0')}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-400">Night {night} · {selected.meal_type}</p>
            <p className="font-bold text-[#1A3D2B]">{sgd(selected.amount)}</p>
          </div>
        </div>

        {countdown === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-sm text-amber-800 mb-3">
            Your hold expired. Please select another slot.
          </div>
        )}

        <form onSubmit={handleSubmitClaim} className="space-y-3">
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
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setAnonymous(a => !a)}
              className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 ${anonymous ? 'bg-[#1A3D2B]' : 'bg-gray-200'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full m-0.5 transition-transform ${anonymous ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm text-gray-600">Show as Anonymous on the board</span>
          </label>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button
            type="submit"
            disabled={loading || countdown === 0}
            className="w-full py-3.5 bg-[#1A3D2B] text-white font-bold rounded-xl hover:bg-[#2D6A4F] disabled:opacity-40 transition-colors"
          >
            {loading ? 'Preparing payment…' : `Continue to PayNow · ${sgd(selected.amount)}`}
          </button>
          <p className="text-center text-xs text-gray-400">Payment instructions will appear on the next page.</p>
        </form>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-[#1A3D2B] text-sm">Sponsorship Slots</h3>
          <p className="text-xs text-gray-400 mt-0.5">{available} available · {sponsored} sponsored</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${available > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
          {available > 0 ? 'Open' : 'Full'}
        </span>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>}

      <div className="grid grid-cols-5 gap-1.5">
        {slots.map(slot => {
          const isAvail = slot.status === 'AVAILABLE'
          const isHeld = slot.status === 'HELD'
          const isFull = slot.status === 'SPONSORED'
          return (
            <button
              key={slot.id}
              disabled={!isAvail || loading}
              onClick={() => handleSelectSlot(slot)}
              title={isFull && slot.donor_name && !slot.donor_anonymous ? slot.donor_name : undefined}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-all border
                ${isFull ? 'bg-[#1A3D2B] border-[#1A3D2B] text-white' : ''}
                ${isHeld ? 'bg-amber-100 border-amber-300 text-amber-700' : ''}
                ${isAvail ? 'bg-white border-gray-200 text-[#1A3D2B] hover:border-[#1A3D2B] hover:bg-emerald-50 cursor-pointer' : ''}
              `}
            >
              <span className="text-[9px]">{sgd(slot.amount)}</span>
              <span>{isFull ? '✓' : isHeld ? '⏱' : '+'}</span>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-gray-400 mt-3">Select an available slot to sponsor. Each slot is held for 15 minutes while you complete payment.</p>
    </div>
  )
}
