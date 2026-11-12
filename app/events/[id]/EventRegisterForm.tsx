'use client'

import { useState } from 'react'

export default function EventRegisterForm({
  eventId,
  remaining,
}: {
  eventId: string
  remaining: number | null
}) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', pax: 1 })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ id: string; event_title: string } | null>(null)
  const [error, setError] = useState('')

  const maxPax = remaining ?? 99

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, pax: form.pax }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Registration failed'); return }
      setResult(data)
    } catch {
      setError('Network error, please try again')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-bold text-green-800 text-lg">You&apos;re registered!</p>
        <p className="text-green-700 text-sm mt-1">{form.name} · {result.event_title}</p>
        <p className="text-green-600 text-xs mt-2 font-mono">Reference: {result.id}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full name *</label>
        <input
          required
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A3D2B]"
          placeholder="Ahmad bin Abdullah"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email *</label>
        <input
          required
          type="email"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A3D2B]"
          placeholder="ahmad@example.com"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone (optional)</label>
        <input
          type="tel"
          value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A3D2B]"
          placeholder="+65 9123 4567"
        />
      </div>
      {maxPax > 1 && (
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Number of attendees{remaining !== null ? ` (max ${remaining} remaining)` : ''}
          </label>
          <input
            type="number"
            min={1}
            max={maxPax}
            value={form.pax}
            onChange={e => setForm(f => ({ ...f, pax: Math.max(1, Math.min(maxPax, Number(e.target.value))) }))}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A3D2B]"
          />
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl bg-[#1A3D2B] text-white font-semibold text-sm hover:bg-[#153024] transition-colors disabled:opacity-60"
      >
        {loading ? 'Registering…' : 'Register'}
      </button>
    </form>
  )
}
