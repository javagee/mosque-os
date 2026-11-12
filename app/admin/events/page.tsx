import AdminSidebarLayout from '@/components/admin/AdminSidebarLayout'
import { getAllEvents, getEventRegistrations } from '@/lib/event-store'
import AdminEventsClient from './AdminEventsClient'

export const dynamic = 'force-dynamic'

export default async function AdminEventsPage() {
  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'
  const events = await getAllEvents()

  const registrationsByEvent: Record<string, Awaited<ReturnType<typeof getEventRegistrations>>> = {}
  await Promise.all(
    events.map(async e => {
      registrationsByEvent[e.id] = await getEventRegistrations(e.id)
    })
  )

  return (
    <AdminSidebarLayout mosqueName={mosqueName}>
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[#C9A84C] text-xs font-semibold tracking-widest mb-0.5">EVENTS</p>
            <h1 className="text-2xl font-bold text-[#1A3D2B]">Event Management</h1>
          </div>
          <a
            href="/events"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:border-[#1A3D2B] hover:text-[#1A3D2B] transition-colors whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Public page
          </a>
        </div>
        <AdminEventsClient events={events} registrationsByEvent={registrationsByEvent} />
      </div>
    </AdminSidebarLayout>
  )
}
