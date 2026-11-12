import Link from 'next/link'
import Nav from '@/components/layout/Nav'
import { getAllEvents } from '@/lib/event-store'
import { countConfirmedRegistrations } from '@/lib/event-store'

export const dynamic = 'force-dynamic'

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${ampm}`
}

export default async function EventsPage() {
  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'
  const today = new Date().toISOString().slice(0, 10)
  const events = await getAllEvents()
  const active = events.filter(e => e.active)

  const registrationCounts = await Promise.all(
    active.map(e => countConfirmedRegistrations(e.id))
  )

  return (
    <>
      <Nav mosqueName={mosqueName} />
      <main className="min-h-screen bg-[#F0F4F3] px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <p className="text-[#C9A84C] text-xs font-semibold tracking-widest mb-1">EVENTS</p>
            <h1 className="text-3xl font-bold text-[#1A3D2B]">Upcoming Events</h1>
          </div>

          {active.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
              No upcoming events. Check back soon.
            </div>
          ) : (
            <div className="space-y-4">
              {active.map((event, i) => {
                const taken = registrationCounts[i]
                const isFull = event.capacity !== undefined && taken >= event.capacity
                const deadlinePassed = event.registration_deadline ? today > event.registration_deadline : false
                const registrationClosed = isFull || deadlinePassed

                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-[#1A3D2B]/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="font-bold text-[#1A3D2B] text-lg leading-tight">{event.title}</h2>
                        <p className="text-sm text-gray-500 mt-1">
                          {fmtDate(event.date)} · {fmtTime(event.time)}
                          {event.end_time ? ` – ${fmtTime(event.end_time)}` : ''}
                        </p>
                        {event.venue && <p className="text-xs text-gray-400 mt-0.5">{event.venue}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className="text-sm font-bold text-[#1A3D2B]">
                          {event.fee === 0 ? 'Free' : `S$${(event.fee / 100).toFixed(2)}`}
                        </span>
                        {registrationClosed ? (
                          <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-400 text-xs font-medium">
                            {isFull ? 'Full' : 'Closed'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-semibold">
                            Register →
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
