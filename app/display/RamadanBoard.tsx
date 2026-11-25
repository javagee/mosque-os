'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { RamadanNightData, RamadanConfig } from '@/types'

type SlotSummary = Record<number, { total: number; sponsored: number; held: number; available: number; amount: number }>

function sgd(cents: number) {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', minimumFractionDigits: 0 }).format(cents / 100)
}

function SlotNightCard({ night, summary }: { night: number; summary: { total: number; sponsored: number; held: number; available: number; amount: number } }) {
  const pct = summary.total > 0 ? Math.round((summary.sponsored / summary.total) * 100) : 0
  const full = summary.sponsored === summary.total && summary.total > 0

  return (
    <div className={`rounded-xl border p-2 flex flex-col items-center gap-1 ${full ? 'bg-[#1A3D2B] border-[#C9A84C]/40' : 'bg-white/8 border-white/10'}`}>
      <p className={`text-xs font-bold ${full ? 'text-[#C9A84C]' : 'text-white/80'}`}>{night}</p>
      <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${full ? 'bg-[#C9A84C]' : 'bg-emerald-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={`text-[9px] font-semibold ${full ? 'text-white/60' : 'text-white/40'}`}>
        {full ? '✓' : `${summary.sponsored}/${summary.total}`}
      </p>
    </div>
  )
}

function LegacyNightCard({ night }: { night: RamadanNightData }) {
  const topSponsor = night.sponsors.find(s => s.status === 'confirmed')
  const bg =
    night.status === 'sponsored' ? 'bg-[#1A3D2B] border-[#C9A84C]/40' :
    night.status === 'partial'   ? 'bg-amber-900/30 border-amber-500/30' :
                                   'bg-white/8 border-white/10'
  return (
    <div className={`rounded-xl border p-2 flex flex-col items-center gap-0.5 ${bg}`}>
      <p className={`text-xs font-bold ${night.status === 'sponsored' ? 'text-[#C9A84C]' : 'text-white/80'}`}>
        {night.night}
      </p>
      {topSponsor ? (
        <p className={`text-[9px] truncate w-full text-center ${night.status === 'sponsored' ? 'text-white/60' : 'text-gray-400'}`}>
          {topSponsor.anonymous ? 'Anon' : topSponsor.donor_name.split(' ')[0]}
        </p>
      ) : (
        <p className="text-[9px] text-white/25">open</p>
      )}
    </div>
  )
}

export default function RamadanBoard() {
  const [data, setData] = useState<{ config: RamadanConfig; nights: RamadanNightData[]; slotSummary: SlotSummary } | null>(null)

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch('/api/ramadan/board')
        if (res.ok) setData(await res.json())
      } catch { /* silent — TV screen should never crash */ }
    }
    poll()
    const id = setInterval(poll, 30_000)
    return () => clearInterval(id)
  }, [])

  if (!data?.config?.active) return null

  const { config, nights, slotSummary = {} } = data
  const hasSlots = Object.keys(slotSummary).length > 0
  const sponsoredCount = nights.filter(n => n.status === 'sponsored').length

  // Slot-based totals
  const totalSlots = Object.values(slotSummary).reduce((s, v) => s + v.total, 0)
  const sponsoredSlots = Object.values(slotSummary).reduce((s, v) => s + v.sponsored, 0)
  const totalRaisedSlots = Object.values(slotSummary).reduce((s, v) => s + v.sponsored * v.amount, 0)

  // Legacy sponsor totals (open-amount)
  const recentSponsors = nights
    .flatMap(n => n.sponsors.filter(s => s.status === 'confirmed').map(s => ({ ...s, night: n.night })))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return (
    <div className="w-full max-w-3xl mt-8">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-[#C9A84C]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3a9 9 0 100 18A9 9 0 0012 3zm0 2a7 7 0 010 14 7 7 0 010-14zm3.5 1.5a5.5 5.5 0 00-5.5 5.5 5.5 5.5 0 005.5 5.5 5.5 5.5 0 001-.09A5.5 5.5 0 0112 20.5 5.5 5.5 0 016.5 15 5.5 5.5 0 0112 9.5a5.5 5.5 0 011-.09 5.5 5.5 0 002.5.09z"/>
          </svg>
          <p className="text-[#C9A84C] text-sm font-semibold">
            Ramadan Sadaqah Board{config.hijri_month ? ` · ${config.hijri_month}` : ''}
          </p>
        </div>

        {/* Stats */}
        {hasSlots ? (
          <div className="flex items-center gap-4 text-xs">
            <div className="text-right">
              <p className="text-[#C9A84C] font-bold text-lg tabular-nums">{sponsoredSlots}<span className="text-white/40 font-normal">/{totalSlots}</span></p>
              <p className="text-white/40">slots sponsored</p>
            </div>
            <div className="text-right">
              <p className="text-[#C9A84C] font-bold text-lg tabular-nums">{sgd(totalRaisedSlots)}</p>
              <p className="text-white/40">raised</p>
            </div>
            <Link href="/ramadan" className="px-2.5 py-1 rounded-lg bg-[#C9A84C] text-[#1A3D2B] text-xs font-bold hover:bg-[#b8943f] transition-colors">
              Sponsor →
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-xs text-white/50">
            <span>{sponsoredCount}/30 nights sponsored</span>
            <Link href="/ramadan" className="px-2.5 py-1 rounded-lg bg-[#C9A84C] text-[#1A3D2B] text-xs font-bold">
              Sponsor a night
            </Link>
          </div>
        )}
      </div>

      {/* Night grid */}
      <div className="grid grid-cols-10 gap-1.5">
        {nights.map(night =>
          slotSummary[night.night] ? (
            <SlotNightCard key={night.night} night={night.night} summary={slotSummary[night.night]} />
          ) : (
            <LegacyNightCard key={night.night} night={night} />
          )
        )}
      </div>

      {/* Slot fill bar (only when slots exist) */}
      {hasSlots && totalSlots > 0 && (
        <div className="mt-3 bg-white/5 rounded-xl px-4 py-3">
          <div className="flex items-center justify-between text-xs text-white/50 mb-1.5">
            <span>Overall progress</span>
            <span className="tabular-nums">{Math.round((sponsoredSlots / totalSlots) * 100)}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#C9A84C] transition-all duration-1000"
              style={{ width: `${Math.round((sponsoredSlots / totalSlots) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-white/30 mt-1">
            <span>{sponsoredSlots} sponsored</span>
            <span>{totalSlots - sponsoredSlots} remaining</span>
          </div>
        </div>
      )}

      {/* Recent open-amount sponsors (legacy) */}
      {!hasSlots && recentSponsors.length > 0 && (
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
