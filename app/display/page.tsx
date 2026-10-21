import Link from 'next/link'
import { getPrayerTimes } from '@/lib/prayer-times'

export const dynamic = 'force-dynamic'

const PRAYERS = [
  { key: 'fajr',    label: 'Fajr',    arabic: 'الفجر'  },
  { key: 'sunrise', label: 'Sunrise', arabic: 'الشروق' },
  { key: 'dhuhr',   label: 'Dhuhr',   arabic: 'الظهر'  },
  { key: 'asr',     label: 'Asr',     arabic: 'العصر'  },
  { key: 'maghrib', label: 'Maghrib', arabic: 'المغرب' },
  { key: 'isha',    label: 'Isha',    arabic: 'العشاء'  },
]

export default async function DisplayPage() {
  const lat = parseFloat(process.env.NEXT_PUBLIC_MOSQUE_LAT ?? '51.5074')
  const lng = parseFloat(process.env.NEXT_PUBLIC_MOSQUE_LNG ?? '-0.1278')
  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'

  const times = await getPrayerTimes(lat, lng)

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
      <div className="text-center mb-12">
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

      {/* Footer */}
      <div className="mt-12 text-center text-white/30 text-xs">
        <p className="arabic text-lg text-white/40 mb-2">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
        <p>Prayer times auto-update daily · Powered by Imara</p>
      </div>
    </main>
  )
}
