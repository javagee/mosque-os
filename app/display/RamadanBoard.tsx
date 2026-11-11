'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { RamadanNightData, RamadanConfig } from '@/types'

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
      {topSponsor ? (
        <p className={`text-[9px] truncate w-full text-center ${night.status === 'sponsored' ? 'text-white/70' : 'text-gray-500'}`}>
          {topSponsor.anonymous ? 'Anon' : topSponsor.donor_name.split(' ')[0]}
        </p>
      ) : (
        <p className="text-[9px] text-white/30">open</p>
      )}
    </div>
  )
}

export default function RamadanBoard() {
  const [data, setData] = useState<{ config: RamadanConfig; nights: RamadanNightData[] } | null>(null)

  useEffect(() => {
    async function fetch30s() {
      try {
        const res = await fetch('/api/ramadan/board')
        if (res.ok) setData(await res.json())
      } catch { /* silent — TV screen should never crash */ }
    }
    fetch30s()
    const id = setInterval(fetch30s, 30_000)
    return () => clearInterval(id)
  }, [])

  if (!data?.config?.active) return null

  const { config, nights } = data
  const sponsoredCount = nights.filter(n => n.status === 'sponsored').length
  const recentSponsors = nights
    .flatMap(n => n.sponsors.filter(s => s.status === 'confirmed').map(s => ({ ...s, night: n.night })))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return (
    <div className="w-full max-w-3xl mt-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-[#C9A84C]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3a9 9 0 100 18A9 9 0 0012 3zm0 2a7 7 0 010 14 7 7 0 010-14zm3.5 1.5a5.5 5.5 0 00-5.5 5.5 5.5 5.5 0 005.5 5.5 5.5 5.5 0 001-.09A5.5 5.5 0 0112 20.5 5.5 5.5 0 016.5 15 5.5 5.5 0 0112 9.5a5.5 5.5 0 011-.09 5.5 5.5 0 002.5.09z"/>
          </svg>
          <p className="text-[#C9A84C] text-sm font-semibold">
            Ramadan Sadaqah Board{config.hijri_month ? ` · ${config.hijri_month}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/50">
          <span>{sponsoredCount}/30 nights sponsored</span>
          <Link href="/ramadan" className="px-2.5 py-1 rounded-lg bg-[#C9A84C] text-[#1A3D2B] text-xs font-bold hover:bg-[#b8943f] transition-colors">
            Sponsor a night
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-10 gap-1.5">
        {nights.map(night => <MiniNightCard key={night.night} night={night} />)}
      </div>

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
  )
}
