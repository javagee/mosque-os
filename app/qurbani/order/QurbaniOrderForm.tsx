'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { QurbaniCampaign, QurbaniAnimalType, QurbaniNiyyah } from '@/types'

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount / 100)
}

const NIYYAH_LABELS: Record<QurbaniNiyyah, string> = {
  self: 'For myself',
  deceased: 'On behalf of a deceased person',
  family: 'For my family',
  general: 'General (lillah)',
}

export default function QurbaniOrderForm({ campaign }: { campaign: QurbaniCampaign }) {
  const router = useRouter()
  const params = useSearchParams()
  const defaultType = (params.get('type') as QurbaniAnimalType) ?? campaign.animals[0]?.type

  const [animalType, setAnimalType] = useState<QurbaniAnimalType>(defaultType)
  const [niyyah, setNiyyah] = useState<QurbaniNiyyah>('self')
  const [niyyahName, setNiyyahName] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const animal = campaign.animals.find(a => a.type === animalType) ?? campaign.animals[0]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/qurbani/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaign.id,
          animal_type: animalType,
          niyyah,
          niyyah_name: (niyyah === 'deceased' || niyyah === 'family') ? niyyahName : undefined,
          donor_name: name,
          donor_email: email,
          donor_phone: phone || undefined,
        }),
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Animal selection */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-2">Select Animal</label>
        <div className="space-y-2">
          {campaign.animals.map(a => (
            <label key={a.type} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${animalType === a.type ? 'border-[#1A3D2B] bg-[#1A3D2B]/5' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" name="animal" value={a.type} checked={animalType === a.type} onChange={() => setAnimalType(a.type)} className="sr-only" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="arabic text-[#C9A84C]">{a.arabic}</span>
                  <span className="text-sm font-semibold text-gray-800">{a.label}</span>
                </div>
                <p className="text-xs text-gray-400">{a.pax} person{a.pax !== 1 ? 's' : ''}</p>
              </div>
              <span className="text-sm font-bold text-[#1A3D2B]">{fmt(a.price, campaign.currency)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Niyyah */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-2">Niyyah — Who is this Qurbani for?</label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(NIYYAH_LABELS) as [QurbaniNiyyah, string][]).map(([val, label]) => (
            <label key={val} className={`flex items-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer text-sm transition-colors ${niyyah === val ? 'border-[#1A3D2B] bg-[#1A3D2B]/5 font-semibold' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              <input type="radio" name="niyyah" value={val} checked={niyyah === val} onChange={() => setNiyyah(val)} className="sr-only" />
              {label}
            </label>
          ))}
        </div>
      </div>

      {(niyyah === 'deceased' || niyyah === 'family') && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            {niyyah === 'deceased' ? 'Name of deceased' : 'Family name or member'}
          </label>
          <input
            required value={niyyahName} onChange={e => setNiyyahName(e.target.value)}
            placeholder={niyyah === 'deceased' ? 'e.g. Ahmad bin Yusuf (rahimahullah)' : 'e.g. Al-Rashidi Family'}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B]"
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
        <input required value={name} onChange={e => setName(e.target.value)} placeholder="Your full name"
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B]" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Email Address</label>
        <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B]" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Phone <span className="font-normal text-gray-400">(optional)</span></label>
        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+962 7x xxx xxxx"
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B]" />
      </div>

      {/* Summary */}
      {animal && (
        <div className="bg-[#1A3D2B]/5 rounded-xl p-4 space-y-1 text-sm">
          <p className="font-semibold text-[#1A3D2B]">Order Summary</p>
          <p className="text-gray-600"><span className="arabic">{animal.arabic}</span> {animal.label} · <strong>{fmt(animal.price, campaign.currency)}</strong></p>
          <p className="text-gray-600">Niyyah: {NIYYAH_LABELS[niyyah]}{niyyahName ? ` — ${niyyahName}` : ''}</p>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">Payment via secure bank transfer. Zero platform fees — 100% goes to Qurbani.</p>

      {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full py-3 rounded-xl bg-[#1A3D2B] text-white font-semibold text-sm hover:bg-[#143020] transition-colors disabled:opacity-60">
        {loading ? 'Processing…' : `Place Order — ${animal ? fmt(animal.price, campaign.currency) : ''}`}
      </button>

      <p className="arabic text-center text-[#C9A84C]/70 text-sm">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
    </form>
  )
}
