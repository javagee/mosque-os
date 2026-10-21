export interface PrayerTimesResponse {
  fajr: string
  sunrise: string
  dhuhr: string
  asr: string
  maghrib: string
  isha: string
  date: {
    gregorian: { date: string; month: { en: string }; year: string; day: string; weekday: { en: string } }
    hijri: { date: string; month: { en: string; ar: string }; year: string; day: string }
  }
}

export async function getPrayerTimes(
  lat: number,
  lng: number,
  dateStr?: string
): Promise<PrayerTimesResponse> {
  if (!dateStr) {
    const d = new Date(Date.now())
    dateStr = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
  }

  const res = await fetch(
    `https://api.aladhan.com/v1/timings/${dateStr!}?latitude=${lat}&longitude=${lng}&method=2`,
    { cache: 'no-store' }
  )

  if (!res.ok) throw new Error('Failed to fetch prayer times')
  const json = await res.json()
  const t = json.data.timings

  return {
    fajr: t.Fajr,
    sunrise: t.Sunrise,
    dhuhr: t.Dhuhr,
    asr: t.Asr,
    maghrib: t.Maghrib,
    isha: t.Isha,
    date: json.data.date,
  }
}

export function getNextPrayer(times: PrayerTimesResponse): string {
  const now = new Date()
  const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const
  const labels: Record<string, string> = {
    fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha',
  }

  for (const prayer of prayers) {
    const [h, m] = times[prayer].split(':').map(Number)
    const prayerDate = new Date()
    prayerDate.setHours(h, m, 0, 0)
    if (now < prayerDate) return labels[prayer]
  }
  return 'Fajr'
}
