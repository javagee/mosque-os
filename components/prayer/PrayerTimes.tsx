'use client'

import { useEffect, useState } from 'react'
import type { PrayerTimesResponse } from '@/lib/prayer-times'

const PRAYERS = [
  { key: 'fajr',    label: 'Fajr',    arabic: 'الفجر'  },
  { key: 'sunrise', label: 'Sunrise', arabic: 'الشروق' },
  { key: 'dhuhr',   label: 'Dhuhr',   arabic: 'الظهر'  },
  { key: 'asr',     label: 'Asr',     arabic: 'العصر'  },
  { key: 'maghrib', label: 'Maghrib', arabic: 'المغرب' },
  { key: 'isha',    label: 'Isha',    arabic: 'العشاء'  },
] as const

function getNextPrayerKey(times: PrayerTimesResponse): string {
  const now = new Date()
  const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const
  for (const p of prayers) {
    const [h, m] = times[p].split(':').map(Number)
    const t = new Date(); t.setHours(h, m, 0, 0)
    if (now < t) return p
  }
  return 'fajr'
}

export default function PrayerTimes() {
  const [times, setTimes] = useState<PrayerTimesResponse | null>(null)
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    fetch('/api/prayer-times').then(r => r.json()).then(setTimes)
    const tick = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(tick)
  }, [])

  if (!times) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  const nextPrayer = getNextPrayerKey(times)
  const currentTime = now?.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) ?? '--:--'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs text-gray-400">
            {times.date.gregorian.weekday.en}, {times.date.gregorian.date}
          </p>
          <p className="text-xs text-[#C9A84C]">
            {times.date.hijri.day} {times.date.hijri.month.en} {times.date.hijri.year} AH
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-700 text-[#1A3D2B]">{currentTime}</p>
        </div>
      </div>

      <div className="space-y-2">
        {PRAYERS.map(({ key, label, arabic }) => {
          const isNext = key === nextPrayer
          const timeVal = times[key as keyof typeof times] as string
          return (
            <div
              key={key}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                isNext
                  ? 'bg-[#1A3D2B] text-white'
                  : 'bg-white border border-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                {isNext && (
                  <span className="w-2 h-2 rounded-full bg-[#C9A84C] block" />
                )}
                <span className={`text-sm font-600 ${isNext ? 'text-white' : 'text-gray-700'}`}>
                  {label}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className={`arabic text-sm ${isNext ? 'text-[#C9A84C]' : 'text-gray-400'}`}>
                  {arabic}
                </span>
                <span className={`text-sm font-700 tabular-nums ${isNext ? 'text-white' : 'text-gray-800'}`}>
                  {timeVal}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
