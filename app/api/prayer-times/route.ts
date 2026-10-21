import { NextResponse } from 'next/server'
import { getPrayerTimes } from '@/lib/prayer-times'

export async function GET() {
  const lat = parseFloat(process.env.NEXT_PUBLIC_MOSQUE_LAT ?? '51.5074')
  const lng = parseFloat(process.env.NEXT_PUBLIC_MOSQUE_LNG ?? '-0.1278')

  try {
    const times = await getPrayerTimes(lat, lng)
    return NextResponse.json(times, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch prayer times' }, { status: 500 })
  }
}
