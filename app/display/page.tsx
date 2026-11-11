import Link from 'next/link'
import { getPrayerTimes } from '@/lib/prayer-times'
import { getRamadanConfig, getAllRamadanNights } from '@/lib/ramadan-store'
import type { RamadanNightData } from '@/types'

export const dynamic = 'force-dynamic'

const PRAYERS = [
  { key: 'fajr',    label: 'Fajr',    arabic: 'الفجر'  },
  { key: 'sunrise', label: 'Sunrise', arabic: 'الشروق' },
  { key: 'dhuhr',   label: 'Dhuhr',   arabic: 'الظهر'  },
  { key: 'asr',     label: 'Asr',     arabic: 'العصر'  },
  { key: 'maghrib', label: 'Maghrib', arabic: 'المغرب' },
  { key: 'isha',    label: 'Isha',    arabic: 'العشاء'  },
]

function sgd(cents: number) {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', minimumFractionDigits: 0 }).format(cents / 100)
}

function MiniNightCard({ night }: { night: RamadanNightData }) {
  const topSponsor = night.sponsors.find(s => s.status === 'confirmed')
  const bg =
    night.status === 'sponsored' ? 'bg-[#1A3D2B] border-[#1A3D2B]' :
    night.status === 'partial'   ? 'bg-amber-100 border-amber-300' :
                                   'bg-white/10 border-white/15'

  return (
    <div className={`rounded-xl border p-2 flex flex-col items-center gap-0.5 ${bg}`}>
      <p className={`text-xs font-bold ${night.status === 'sponsored' ? 'text-[#C9A84C]' : 'text-white/80'}`}>
        {night.night}
      </p>
      {topSponsor && (
        <p className={`text-[9px] truncate w-full text-center ${night.status === 'sponsored' ? 'text-white/70' : 'text-gray-500'}`}>
          {topSponsor.anonymous ? 'Anon' : topSponsor.donor_name.split(' ')[0]}
        </p>
      )}
      {!topSponsor && (
        <p className="text-[9px] text-white/30">open</p>
      )}
    </div>
  )
}

export default async function DisplayPage() {
  const lat = parseFloat(process.env.NEXT_PUBLIC_MOSQUE_LAT ?? '51.5074')
  const lng = parseFloat(process.env.NEXT_PUBLIC_MOSQUE_LNG ?? '-0.1278')
  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'
  const year = new Date().getFullYear()

  const [times, ramadanConfig, ramadanNights] = await Promise.all([
    getPrayerTimes(lat, lng),
    getRamadanConfig(year).catch(() => null),
    getAllRamadanNights(year).catch(() => []),
  ])

  const showRamadan = ramadanConfig?.active ?? false
  const sponsoredCount = ramadanNights.filter(n => n.status === 'sponsored').length
  const recentSponsors = ramadanNights
    .flatMap(n => n.sponsors.filter(s => s.status === 'confirmed').map(s => ({ ...s, night: n.night })))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return (
    <main className="min-h-screen bg-[#1A3D2B] flex flex-col items-center justify-center px-8 py-12 text-white relative">
      {/* Corner navigation */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <Link
          href="/campaigns"
          className="px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          Campaigns
        </Link>
        <Link
          href="/donate"
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#C9A84C] text-[#1A3D2B] hover:bg-[#b8943f] transition-colors"
        >
          Donate
        </Link>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <p className="text-[#C9A84C] text-lg font-600 mb-1">Imara</p>
        <h1 className="text-4xl font-800">{mosqueName}</h1>
        <div className="mt-3 space-y-1">
          <p className="text-white/60 text-sm">
            {times.date.gregorian.weekday.en}, {times.date.gregorian.date}
          </p>
          <p className="text-[#C9A84C] text-sm arabic">
            {times.date.hijri.day} {times.date.hijri.month.ar} {times.date.hijri.year}
          </p>
        </div>
      </div>

      {/* Prayer times grid */}
      <div className="w-full max-w-3xl grid grid-cols-2 gap-4">
        {PRAYERS.map(({ key, label, arabic }) => {
          const timeVal = times[key as keyof typeof times] as string
          return (
            <div key={key} className="bg-white/10 backdrop-blur rounded-2xl px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-white/50 text-sm arabic mb-1">{arabic}</p>
                <p className="text-xl font-700">{label}</p>
              </div>
              <p className="text-3xl font-800 tabular-nums text-[#C9A84C]">{timeVal}</p>
            </div>
          )
        })}
      </div>

      {/* Ramadan Sadaqah Board — shown only during Ramadan */}
      {showRamadan && (
        <div className="w-full max-w-3xl mt-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#C9A84C]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3a9 9 0 100 18A9 9 0 0012 3zm0 2a7 7 0 010 14 7 7 0 010-14zm3.5 1.5a5.5 5.5 0 00-5.5 5.5 5.5 5.5 0 005.5 5.5 5.5 5.5 0 001-.09A5.5 5.5 0 0112 20.5 5.5 5.5 0 016.5 15 5.5 5.5 0 0112 9.5a5.5 5.5 0 011-.09 5.5 5.5 0 002.5.09z"/>
              </svg>
              <p className="text-[#C9A84C] text-sm font-semibold">
                Ramadan Sadaqah Board
                {ramadanConfig?.hijri_month ? ` · ${ramadanConfig.hijri_month}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/50">
              <span>{sponsoredCount}/30 nights sponsored</span>
              <Link href="/ramadan" className="px-2.5 py-1 rounded-lg bg-[#C9A84C] text-[#1A3D2B] text-xs font-bold hover:bg-[#b8943f] transition-colors">
                Sponsor a night
              </Link>
            </div>
          </div>

          {/* Mini 30-night grid */}
          <div className="grid grid-cols-10 gap-1.5">
            {ramadanNights.map(night => (
              <MiniNightCard key={night.night} night={night} />
            ))}
          </div>

          {/* Recent sponsors ticker */}
          {recentSponsors.length > 0 && (
            <div className="mt-3 bg-white/5 rounded-xl px-4 py-2.5 flex items-center gap-3">
              <span className="text-[#C9A84C] text-xs font-semibold flex-shrink-0">Recent:</span>
              <div className="flex items-center gap-4 overflow-hidden">
                {recentSponsors.map(s => (
                  <span key={s.id} className="text-xs text-white/60 whitespace-nowrap">
                    <span className="text-white/80 font-medium">{s.anonymous ? 'Anonymous' : s.donor_name}</span>
                    {' — '}Night {s.night}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-10 text-center text-white/30 text-xs">
        <p className="arabic text-lg text-white/40 mb-2">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
        <p>Prayer times auto-update daily · Powered by Imara</p>
      </div>
    </main>
  )
}
