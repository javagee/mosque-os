import AdminSidebarLayout from '@/components/admin/AdminSidebarLayout'
import { getAllJemaah, getCheckIns } from '@/lib/jemaah-store'

export const dynamic = 'force-dynamic'

export default async function AdminJemaahPage() {
  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'
  const today = new Date().toISOString().slice(0, 10)

  const [members, todayCheckIns] = await Promise.all([
    getAllJemaah(),
    getCheckIns(today),
  ])

  const checkedInIds = new Set(todayCheckIns.map(c => c.jemaah_id))

  const todayLabel = new Date().toLocaleDateString('en-SG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <AdminSidebarLayout mosqueName={mosqueName}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[#C9A84C] text-xs font-semibold tracking-widest mb-0.5">JEMAAH</p>
            <h1 className="text-2xl font-bold text-[#1A3D2B]">Congregation</h1>
            <p className="text-sm text-gray-400 mt-0.5">{todayLabel}</p>
          </div>
          <a
            href="/jemaah"
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

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total members', value: String(members.length), color: 'text-[#1A3D2B]' },
            { label: "Today's attendance", value: String(checkedInIds.size), color: 'text-[#1A3D2B]' },
            { label: 'Not checked in today', value: String(members.length - checkedInIds.size), color: 'text-gray-500' },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-semibold text-gray-400 mb-1">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Member list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-[#1A3D2B] text-sm">All members</h2>
          </div>
          {members.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-400 text-sm">No members registered yet</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {members.map(m => (
                <div key={m.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{m.name}</p>
                    <p className="text-xs text-gray-400 truncate">{m.email}{m.phone ? ` · ${m.phone}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[10px] font-mono text-gray-400">{m.id}</span>
                    {checkedInIds.has(m.id) ? (
                      <span className="px-2.5 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-semibold">Present</span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-400 text-xs font-medium">Absent</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminSidebarLayout>
  )
}
