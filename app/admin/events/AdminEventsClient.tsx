'use client'

import { useState } from 'react'
import type { MosqueEvent, EventRegistration } from '@/types'

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${ampm}`
}

function CreateEventForm({ onCreated }: { onCreated: (e: MosqueEvent) => void }) {
  const [form, setForm] = useState({
    title: '', description: '', date: '', time: '', end_time: '',
    venue: '', capacity: '', fee: '', registration_deadline: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          capacity: form.capacity ? Number(form.capacity) : undefined,
          fee: form.fee ? Math.round(Number(form.fee) * 100) : 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create'); return }
      onCreated(data)
      setForm({ title: '', description: '', date: '', time: '', end_time: '', venue: '', capacity: '', fee: '', registration_deadline: '' })
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <h2 className="font-bold text-[#1A3D2B] text-base">Create event</h2>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Title *</label>
        <input required value={form.title} onChange={set('title')}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A3D2B]"
          placeholder="Jumaah Khutbah — Special Series" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
        <textarea value={form.description} onChange={set('description')} rows={2}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A3D2B] resize-none"
          placeholder="Brief description of the event" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date *</label>
          <input required type="date" value={form.date} onChange={set('date')}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A3D2B]" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Start time *</label>
          <input required type="time" value={form.time} onChange={set('time')}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A3D2B]" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">End time</label>
          <input type="time" value={form.end_time} onChange={set('end_time')}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A3D2B]" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Venue</label>
          <input value={form.venue} onChange={set('venue')}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A3D2B]"
            placeholder="Prayer Hall" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Capacity (leave blank = unlimited)</label>
          <input type="number" min={1} value={form.capacity} onChange={set('capacity')}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A3D2B]"
            placeholder="e.g. 100" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Fee (S$, 0 = free)</label>
          <input type="number" min={0} step={0.01} value={form.fee} onChange={set('fee')}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A3D2B]"
            placeholder="0" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Registration deadline</label>
          <input type="date" value={form.registration_deadline} onChange={set('registration_deadline')}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A3D2B]" />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading}
        className="px-5 py-2.5 rounded-xl bg-[#1A3D2B] text-white font-semibold text-sm hover:bg-[#153024] transition-colors disabled:opacity-60">
        {loading ? 'Creating…' : 'Create event'}
      </button>
    </form>
  )
}

function EventRow({ event, regs }: { event: MosqueEvent; regs: EventRegistration[] }) {
  const [open, setOpen] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [active, setActive] = useState(event.active)
  const confirmed = regs.filter(r => r.status === 'confirmed')
  const totalPax = confirmed.reduce((sum, r) => sum + r.pax, 0)

  async function toggleActive() {
    setToggling(true)
    try {
      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !active }),
      })
      if (res.ok) setActive(a => !a)
    } finally {
      setToggling(false)
    }
  }

  return (
    <>
      <tr className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <td className="px-5 py-3.5">
          <p className="font-medium text-sm text-gray-900">{event.title}</p>
          {event.venue && <p className="text-xs text-gray-400">{event.venue}</p>}
        </td>
        <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">{fmtDate(event.date)}</td>
        <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">{fmtTime(event.time)}</td>
        <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">
          {totalPax}{event.capacity ? ` / ${event.capacity}` : ''}
        </td>
        <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">
          {event.fee === 0 ? 'Free' : `S$${(event.fee / 100).toFixed(2)}`}
        </td>
        <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={toggleActive}
            disabled={toggling}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
          >
            {active ? 'Active' : 'Inactive'}
          </button>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={6} className="px-5 py-3 bg-gray-50/50">
            {confirmed.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">No registrations yet</p>
            ) : (
              <div className="space-y-1">
                {confirmed.map(r => (
                  <div key={r.id} className="flex items-center gap-4 text-xs text-gray-600">
                    <span className="font-medium text-gray-800">{r.name}</span>
                    <span>{r.email}</span>
                    {r.phone && <span>{r.phone}</span>}
                    <span className="text-gray-400">{r.pax} pax</span>
                    <span className="font-mono text-gray-300">{r.id}</span>
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

export default function AdminEventsClient({
  events,
  registrationsByEvent,
}: {
  events: MosqueEvent[]
  registrationsByEvent: Record<string, EventRegistration[]>
}) {
  const [eventList, setEventList] = useState(events)

  return (
    <div className="space-y-6">
      <CreateEventForm onCreated={e => setEventList(list => [e, ...list])} />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-[#1A3D2B] text-sm">All events</h2>
        </div>
        {eventList.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">No events yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Event', 'Date', 'Time', 'Registered', 'Fee', 'Status'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {eventList.map(e => (
                  <EventRow key={e.id} event={e} regs={registrationsByEvent[e.id] ?? []} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
