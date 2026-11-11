import Link from 'next/link'
import { getRamadanConfig, getAllRamadanNights } from '@/lib/ramadan-store'
import type { RamadanNightData } from '@/types'

export const dynamic = 'force-dynamic'

function sgd(cents: number) {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', minimumFractionDigits: 0 }).format(cents / 100)
}

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function NightCard({ night }: { night: RamadanNightData }) {
  const pct = Math.min(100, Math.round((night.raised / night.target) * 100))
  const topSponsor = night.sponsors.find(s => s.status === 'confirmed')
  const pendingCount = night.sponsors.filter(s => s.status === 'pending').length

  const cardClass =
    night.status === 'sponsored'
      ? 'bg-[#1A3D2B] text-white border-[#1A3D2B]'
      : night.status === 'partial'
      ? 'bg-amber-50 border-amber-300 text-gray-800'
      : 'bg-white border-gray-200 text-gray-800'

  return (
    <Link href={`/ramadan/${night.night}`}>
      <div className={`rounded-2xl border p-3 h-full flex flex-col gap-1.5 hover:shadow-md transition-shadow cursor-pointer ${cardClass}`}>
        <div className="flex items-start justify-between gap-1">
          <div>
            <p className={`text-xs font-semibold ${night.status === 'sponsored' ? 'text-[#C9A84C]' : 'text-gray-400'}`}>
              Night
            </p>
            <p className={`text-2xl font-bold leading-none ${night.status === 'sponsored' ? 'text-white' : 'text-[#1A3D2B]'}`}>
              {night.night}
            </p>
          </div>
          {night.status === 'sponsored' && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#C9A84C]/20 text-[#C9A84C] whitespace-nowrap">
              Sponsored
            </span>
          )}
          {night.status === 'partial' && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-800 whitespace-nowrap">
              Partial
            </span>
          )}
          {night.status === 'available' && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 whitespace-nowrap">
              Open
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className={`w-full h-1 rounded-full ${night.status === 'sponsored' ? 'bg-white/20' : 'bg-gray-200'}`}>
          <div
            className={`h-1 rounded-full transition-all ${night.status === 'sponsored' ? 'bg-[#C9A84C]' : night.status === 'partial' ? 'bg-amber-500' : 'bg-emerald-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="mt-auto">
          {topSponsor ? (
            <p className={`text-xs font-medium truncate ${night.status === 'sponsored' ? 'text-white/80' : 'text-gray-600'}`}>
              {topSponsor.anonymous ? 'Anonymous' : topSponsor.donor_name}
            </p>
          ) : pendingCount > 0 ? (
            <p className={`text-xs ${night.status === 'sponsored' ? 'text-white/50' : 'text-gray-400'}`}>
              {pendingCount} pending
            </p>
          ) : (
            <p className={`text-xs ${night.status === 'sponsored' ? 'text-white/50' : 'text-gray-400'}`}>
              {sgd(night.target)} target
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

export default async function RamadanPage() {
  const year = new Date().getFullYear()
  const [config, nights] = await Promise.all([
    getRamadanConfig(year),
    getAllRamadanNights(year),
  ])

  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'
  const sponsoredCount = nights.filter(n => n.status === 'sponsored').length
  const totalRaised = nights.reduce((s, n) => s + n.raised, 0)

  return (
    <main className="min-h-screen bg-[#F0F4F3]">
      {/* Header */}
      <div className="bg-[#1A3D2B] px-4 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <svg className="w-7 h-7 text-[#C9A84C]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3a9 9 0 100 18A9 9 0 0012 3zm0 2a7 7 0 010 14 7 7 0 010-14zm3.5 1.5a5.5 5.5 0 00-5.5 5.5 5.5 5.5 0 005.5 5.5 5.5 5.5 0 001-.09A5.5 5.5 0 0112 20.5 5.5 5.5 0 016.5 15 5.5 5.5 0 0112 9.5a5.5 5.5 0 011-.09 5.5 5.5 0 002.5.09z"/>
          </svg>
          <p className="text-[#C9A84C] font-semibold text-sm tracking-wide">Ramadan Giving Board</p>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">{mosqueName}</h1>
        {config.hijri_month && (
          <p className="text-white/60 text-sm mt-1">{config.hijri_month}</p>
        )}

        {/* Summary stats */}
        <div className="flex items-center justify-center gap-6 mt-5">
          <div className="text-center">
            <p className="text-2xl font-bold text-[#C9A84C]">{sponsoredCount}<span className="text-white/40 text-sm font-normal">/30</span></p>
            <p className="text-white/50 text-xs mt-0.5">Nights sponsored</p>
          </div>
          <div className="w-px h-10 bg-white/15" />
          <div className="text-center">
            <p className="text-2xl font-bold text-[#C9A84C]">{sgd(totalRaised)}</p>
            <p className="text-white/50 text-xs mt-0.5">Total raised</p>
          </div>
          <div className="w-px h-10 bg-white/15" />
          <div className="text-center">
            <p className="text-2xl font-bold text-[#C9A84C]">{30 - sponsoredCount}</p>
            <p className="text-white/50 text-xs mt-0.5">Nights open</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {!config.active ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
            <div className="w-14 h-14 rounded-full bg-[#C9A84C]/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-[#C9A84C]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3a9 9 0 100 18A9 9 0 0012 3zm0 2a7 7 0 010 14 7 7 0 010-14zm3.5 1.5a5.5 5.5 0 00-5.5 5.5 5.5 5.5 0 005.5 5.5 5.5 5.5 0 001-.09A5.5 5.5 0 0112 20.5 5.5 5.5 0 016.5 15 5.5 5.5 0 0112 9.5a5.5 5.5 0 011-.09 5.5 5.5 0 002.5.09z"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold text-[#1A3D2B] mb-2">Ramadan Board Opening Soon</h2>
            <p className="text-gray-500 text-sm">The Ramadan Sadaqah Board will be available once the mosque opens registrations. Check back closer to Ramadan.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[#1A3D2B] text-sm">Select a night to sponsor</h2>
              <p className="text-xs text-gray-400">Click any night to give</p>
            </div>

            {/* 30-night grid */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 md:gap-3">
              {nights.map(night => (
                <NightCard key={night.night} night={night} />
              ))}
            </div>

            {/* How it works */}
            <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-[#1A3D2B] mb-3 text-sm">How it works</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                {[
                  { step: '1', title: 'Pick a night', desc: 'Choose any available Ramadan night to sponsor with Sadaqah.' },
                  { step: '2', title: 'Pay via PayNow', desc: 'Transfer your contribution to the mosque via PayNow — zero fees.' },
                  { step: '3', title: 'Your name appears', desc: 'Once verified by the mosque, your name appears live on the board.' },
                ].map(item => (
                  <div key={item.step} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#1A3D2B] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{item.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
