import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getRamadanConfig, getRamadanNight } from '@/lib/ramadan-store'
import NightSponsorForm from './NightSponsorForm'

export const dynamic = 'force-dynamic'

function sgd(cents: number) {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', minimumFractionDigits: 0 }).format(cents / 100)
}

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export default async function NightPage({ params }: { params: Promise<{ night: string }> }) {
  const { night: nightParam } = await params
  const nightNum = parseInt(nightParam)
  if (isNaN(nightNum) || nightNum < 1 || nightNum > 30) notFound()

  const year = new Date().getFullYear()
  const [config, night] = await Promise.all([
    getRamadanConfig(year),
    getRamadanNight(year, nightNum),
  ])

  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'
  const pct = Math.min(100, Math.round((night.raised / night.target) * 100))
  const confirmedSponsors = night.sponsors.filter(s => s.status === 'confirmed')

  return (
    <main className="min-h-screen bg-[#F0F4F3]">
      {/* Header */}
      <div className="bg-[#1A3D2B] px-4 pt-6 pb-8">
        <div className="max-w-lg mx-auto">
          <Link href="/ramadan" className="inline-flex items-center gap-1.5 text-white/50 hover:text-white text-sm mb-4 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to board
          </Link>
          <p className="text-[#C9A84C] text-sm font-semibold mb-1">{mosqueName}</p>
          <h1 className="text-3xl font-bold text-white">Night {nightNum}</h1>
          <p className="text-white/60 text-sm mt-0.5">{ordinal(nightNum)} Night of Ramadan {config.hijri_month ? `· ${config.hijri_month}` : ''}</p>

          {/* Progress */}
          <div className="mt-5">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-white/60">Raised: <span className="text-white font-semibold">{sgd(night.raised)}</span></span>
              <span className="text-white/60">Target: <span className="text-white font-semibold">{sgd(night.target)}</span></span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/15">
              <div
                className="h-2 rounded-full bg-[#C9A84C] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              {night.status === 'sponsored' && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#C9A84C]/20 text-[#C9A84C]">Fully Sponsored</span>
              )}
              {night.status === 'partial' && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-200/20 text-amber-300">{pct}% Sponsored</span>
              )}
              {night.status === 'available' && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/60">Available</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Confirmed sponsors */}
        {confirmedSponsors.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-[#1A3D2B] text-sm mb-3">
              Sponsors for Night {nightNum}
            </h2>
            <div className="space-y-2">
              {confirmedSponsors.map(s => (
                <div key={s.id} className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#1A3D2B]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-[#1A3D2B]">
                        {s.anonymous ? '?' : s.donor_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {s.anonymous ? 'Anonymous' : s.donor_name}
                      </p>
                      {s.message && <p className="text-xs text-gray-400 italic">&ldquo;{s.message}&rdquo;</p>}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-[#1A3D2B] flex-shrink-0">{sgd(s.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sponsor form */}
        {config.active && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-[#1A3D2B] text-sm mb-4">
              {night.status === 'sponsored' ? 'Add another contribution' : `Sponsor Night ${nightNum}`}
            </h2>
            <NightSponsorForm night={night} year={year} />
          </div>
        )}

        {!config.active && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
            <p className="text-amber-800 font-semibold text-sm">The Ramadan board is currently closed.</p>
            <p className="text-amber-700 text-xs mt-1">Check back when the mosque opens registrations.</p>
          </div>
        )}
      </div>
    </main>
  )
}
