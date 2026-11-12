'use client'

import { useState } from 'react'

export default function FacilityBookingForm({ facilityId }: { facilityId: string }) {
  const [form, setForm] = useState({
    date: '',
    start_time: '',
    end_time: '',
    purpose: '',
    organizer_name: '',
    organizer_email: '',
    organizer_phone: '',
    pax: '',
  })
  const [loading, setLoading] = useState(false)
  const [bookingId, setBookingId] = useState('')
  const [error, setError] = useState('')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/facilities/${facilityId}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          pax: form.pax ? Number(form.pax) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Submission failed'); return }
      setBookingId(data.id)
    } catch {
      setError('Network error, please try again')
    } finally {
      setLoading(false)
    }
  }

  if (bookingId) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-bold text-green-800 text-lg">Booking request submitted</p>
        <p className="text-green-700 text-sm mt-1">We&apos;ll confirm within 24 hours.</p>
        <p className="text-green-600 text-xs mt-2 font-mono">Reference: {bookingId}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date *</label>
          <input
            required
            type="date"
            value={form.date}
            onChange={set('date')}
            min={new Date().toISOString().slice(0, 10)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A3D2B]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Number of pax</label>
          <input
            type="number"
            min={1}
            value={form.pax}
            onChange={set('pax')}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A3D2B]"
            placeholder="e.g. 50"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Start time *</label>
          <input
            required
            type="time"
            value={form.start_time}
            onChange={set('start_time')}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A3D2B]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">End time *</label>
          <input
            required
            type="time"
            value={form.end_time}
            onChange={set('end_time')}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A3D2B]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Purpose *</label>
        <input
          required
          value={form.purpose}
          onChange={set('purpose')}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A3D2B]"
          placeholder="e.g. Aqiqah, Study circle, Community meeting"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Your name *</label>
        <input
          required
          value={form.organizer_name}
          onChange={set('organizer_name')}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A3D2B]"
          placeholder="Ahmad bin Abdullah"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email *</label>
          <input
            required
            type="email"
            value={form.organizer_email}
            onChange={set('organizer_email')}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A3D2B]"
            placeholder="ahmad@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone (optional)</label>
          <input
            type="tel"
            value={form.organizer_phone}
            onChange={set('organizer_phone')}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A3D2B]"
            placeholder="+65 9123 4567"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl bg-[#1A3D2B] text-white font-semibold text-sm hover:bg-[#153024] transition-colors disabled:opacity-60"
      >
        {loading ? 'Submitting…' : 'Submit booking request'}
      </button>
    </form>
  )
}
