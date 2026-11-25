import { NextResponse } from 'next/server'
import { getRamadanConfig, getAllRamadanNights, getNightSlots } from '@/lib/ramadan-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const year = new Date().getFullYear()
  const [config, nights, ...allNightSlots] = await Promise.all([
    getRamadanConfig(year),
    getAllRamadanNights(year),
    ...Array.from({ length: 30 }, (_, i) => getNightSlots(year, i + 1)),
  ])

  // Compact slot summary per night for the TV display
  const slotSummary: Record<number, { total: number; sponsored: number; held: number; available: number; amount: number }> = {}
  allNightSlots.forEach((nightSlots, i) => {
    const slots = nightSlots as Awaited<ReturnType<typeof getNightSlots>>
    if (slots.length) {
      slotSummary[i + 1] = {
        total: slots.length,
        sponsored: slots.filter(s => s.status === 'SPONSORED').length,
        held: slots.filter(s => s.status === 'HELD' || s.status === 'CLAIMED_PENDING').length,
        available: slots.filter(s => s.status === 'AVAILABLE').length,
        amount: slots[0]?.amount ?? 0,
      }
    }
  })

  return NextResponse.json({ config, nights, slotSummary })
}
