import AdminSidebarLayout from '@/components/admin/AdminSidebarLayout'
import { getRamadanConfig, getAllRamadanNights } from '@/lib/ramadan-store'
import RamadanAdminConfig from './RamadanAdminConfig'

export const dynamic = 'force-dynamic'

function sgd(cents: number) {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', minimumFractionDigits: 0 }).format(cents / 100)
}

export default async function AdminRamadanPage() {
  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'
  const year = new Date().getFullYear()
  const [config, nights] = await Promise.all([
    getRamadanConfig(year),
    getAllRamadanNights(year),
  ])

  const sponsoredCount = nights.filter(n => n.status === 'sponsored').length
  const totalRaised = nights.reduce((s, n) => s + n.raised, 0)
  const pendingCount = nights.reduce((s, n) => s + n.sponsors.filter(sp => sp.status === 'pending').length, 0)

  return (
    <AdminSidebarLayout mosqueName={mosqueName}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[#C9A84C] text-xs font-semibold tracking-widest mb-0.5">RAMADAN</p>
            <h1 className="text-2xl font-bold text-[#1A3D2B]">Sadaqah Board</h1>
            <p className="text-sm text-gray-400 mt-0.5">Manage the 30-night Ramadan giving board</p>
          </div>
          <a
            href="/ramadan"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:border-[#1A3D2B] hover:text-[#1A3D2B] transition-colors whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View public board
          </a>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Nights sponsored', value: `${sponsoredCount}/30`, color: 'text-[#1A3D2B]' },
            { label: 'Total raised', value: sgd(totalRaised), color: 'text-[#1A3D2B]' },
            { label: 'Pending verification', value: String(pendingCount), color: pendingCount > 0 ? 'text-amber-600' : 'text-gray-400' },
            { label: 'Nights open', value: String(30 - sponsoredCount), color: 'text-gray-600' },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-semibold text-gray-400 mb-1">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        <RamadanAdminConfig config={config} nights={nights} />
      </div>
    </AdminSidebarLayout>
  )
}
