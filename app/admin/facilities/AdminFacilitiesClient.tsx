'use client'

import { useState } from 'react'
import type { Facility, FacilityBooking } from '@/types'

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
}

function CreateFacilityForm({ onCreated }: { onCreated: (f: Facility) => void }) {
  const [form, setForm] = useState({ name: '', description: '', capacity: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/facilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, capacity: form.capacity ? Number(form.capacity) : undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed'); return }
      onCreated(data)
      setForm({ name: '', description: '', capacity: '' })
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <h2 className="font-bold text-[#1A3D2B] text-base">Add facility</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Name *</label>
          <input required value={form.name} onChange={set('name')}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A3D2B]"
            placeholder="Prayer Hall" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Capacity (pax)</label>
          <input type="number" min={1} value={form.capacity} onChange={set('capacity')}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A3D2B]"
            placeholder="e.g. 200" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
          <input value={form.description} onChange={set('description')}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A3D2B]"
            placeholder="Brief description" />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading}
        className="px-5 py-2.5 rounded-xl bg-[#1A3D2B] text-white font-semibold text-sm hover:bg-[#153024] transition-colors disabled:opacity-60">
        {loading ? 'Adding…' : 'Add facility'}
      </button>
    </form>
  )
}

function BookingCard({ booking: initial }: { booking: FacilityBooking }) {
  const [booking, setBooking] = useState(initial)
  const [loading, setLoading] = useState<'confirmed' | 'rejected' | null>(null)

  async function update(status: 'confirmed' | 'rejected') {
    setLoading(status)
    try {
      const res = await fetch(`/api/admin/facilities/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) setBooking(await res.json())
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="p-4 border-b border-amber-100 last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold text-sm text-gray-900">{booking.facility_name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {fmtDate(booking.date)} · {booking.start_time} – {booking.end_time}
            {booking.pax ? ` · ${booking.pax} pax` : ''}
          </p>
          <p className="text-xs text-gray-600 mt-1"><span className="font-medium">Purpose:</span> {booking.purpose}</p>
          <p className="text-xs text-gray-500 mt-0.5">{booking.organizer_name} · {booking.organizer_email}</p>
          <p className="text-xs font-mono text-gray-300 mt-1">{booking.id}</p>
        </div>
        {booking.status === 'pending' && (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => update('confirmed')}
              disabled={loading !== null}
              className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
            >
              {loading === 'confirmed' ? '…' : 'Approve'}
            </button>
            <button
              onClick={() => update('rejected')}
              disabled={loading !== null}
              className="px-3 py-1.5 rounded-lg bg-red-100 text-red-600 text-xs font-semibold hover:bg-red-200 transition-colors disabled:opacity-60"
            >
              {loading === 'rejected' ? '…' : 'Reject'}
            </button>
          </div>
        )}
        {booking.status !== 'pending' && (
          <span className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_STYLES[booking.status]}`}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </span>
        )}
      </div>
    </div>
  )
}

export default function AdminFacilitiesClient({
  facilities: initFacilities,
  pendingBookings,
  allBookings,
}: {
  facilities: Facility[]
  pendingBookings: FacilityBooking[]
  allBookings: FacilityBooking[]
}) {
  const [facilities, setFacilities] = useState(initFacilities)

  return (
    <div className="space-y-6">
      <CreateFacilityForm onCreated={f => setFacilities(list => [...list, f])} />

      {pendingBookings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-amber-200 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="font-semibold text-amber-800 text-sm">{pendingBookings.length} pending booking{pendingBookings.length > 1 ? 's' : ''}</h2>
          </div>
          {pendingBookings.map(b => <BookingCard key={b.id} booking={b} />)}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-[#1A3D2B] text-sm">All bookings</h2>
        </div>
        {allBookings.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">No bookings yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Facility', 'Date', 'Time', 'Purpose', 'Organizer', 'Status'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allBookings.map(b => (
                  <tr key={b.id} className="border-b border-gray-50">
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{b.facility_name}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">{fmtDate(b.date)}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">{b.start_time} – {b.end_time}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 max-w-[160px] truncate">{b.purpose}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{b.organizer_name}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_STYLES[b.status]}`}>
                        {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {facilities.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-[#1A3D2B] text-sm">Facilities ({facilities.length})</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {facilities.map(f => (
              <div key={f.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-sm text-gray-900">{f.name}</p>
                  {f.description && <p className="text-xs text-gray-400">{f.description}</p>}
                </div>
                {f.capacity && <span className="text-xs text-gray-400">{f.capacity} pax</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
