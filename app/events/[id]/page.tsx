import { notFound } from 'next/navigation'
import Nav from '@/components/layout/Nav'
import { getEvent, countConfirmedRegistrations } from '@/lib/event-store'
import EventRegisterForm from './EventRegisterForm'

export const dynamic = 'force-dynamic'

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-SG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${ampm}`
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const event = await getEvent(id)
  if (!event || !event.active) notFound()

  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'
  const today = new Date().toISOString().slice(0, 10)
  const taken = await countConfirmedRegistrations(id)
  const isFull = event.capacity !== undefined && taken >= event.capacity
  const deadlinePassed = event.registration_deadline ? today > event.registration_deadline : false
  const registrationClosed = isFull || deadlinePassed
  const remaining = event.capacity !== undefined ? event.capacity - taken : null

  return (
    <>
      <Nav mosqueName={mosqueName} />
      <main className="min-h-screen bg-[#F0F4F3] px-6 py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <p className="text-[#C9A84C] text-xs font-semibold tracking-widest mb-1">EVENT</p>
            <h1 className="text-3xl font-bold text-[#1A3D2B]">{event.title}</h1>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-0.5">Date</p>
                <p className="font-medium text-gray-800">{fmtDate(event.date)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-0.5">Time</p>
                <p className="font-medium text-gray-800">
                  {fmtTime(event.time)}{event.end_time ? ` – ${fmtTime(event.end_time)}` : ''}
                </p>
              </div>
              {event.venue && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 mb-0.5">Venue</p>
                  <p className="font-medium text-gray-800">{event.venue}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-0.5">Fee</p>
                <p className="font-medium text-gray-800">{event.fee === 0 ? 'Free' : `S$${(event.fee / 100).toFixed(2)}`}</p>
              </div>
              {event.capacity !== undefined && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 mb-0.5">Capacity</p>
                  <p className="font-medium text-gray-800">{taken} / {event.capacity} registered</p>
                </div>
              )}
            </div>
            {event.description && (
              <p className="text-gray-600 text-sm border-t border-gray-50 pt-3">{event.description}</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-[#1A3D2B] text-base mb-4">Register</h2>
            {registrationClosed ? (
              <p className="text-gray-500 text-sm">
                {isFull ? 'This event is fully booked.' : 'Registration for this event has closed.'}
              </p>
            ) : (
              <EventRegisterForm eventId={id} remaining={remaining} />
            )}
          </div>
        </div>
      </main>
    </>
  )
}
