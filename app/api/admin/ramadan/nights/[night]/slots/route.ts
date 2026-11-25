import { NextRequest, NextResponse } from 'next/server'
import { createRamadanSlot, getNightSlots } from '@/lib/ramadan-store'
import type { RamadanSlot } from '@/types'

export const dynamic = 'force-dynamic'

function isAuthed(req: NextRequest) {
  return !!req.cookies.get('admin_auth')?.value
}

function generateSlotId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let id = 'RSL-'
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)]
  return id
}

function computeBookingCutoff(mealType: RamadanSlot['meal_type'], mealCivilDate: string): string {
  // mealCivilDate: YYYY-MM-DD in Asia/Singapore
  const [y, m, d] = mealCivilDate.split('-').map(Number)
  if (mealType === 'IFTAR') {
    // 4 PM Asia/Singapore same day = 08:00 UTC
    return `${mealCivilDate}T08:00:00.000Z`
  }
  if (mealType === 'SAHUR') {
    // D-3: booking must close 3 civil days before the meal date
    const cutoffDate = new Date(Date.UTC(y, m - 1, d - 3, 15, 59, 59)) // 23:59:59 SGT = 15:59:59 UTC
    return cutoffDate.toISOString()
  }
  // GENERAL: midnight SGT = 16:00 UTC day before
  return `${mealCivilDate}T16:00:00.000Z`
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ night: string }> }) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { night } = await params
  const year = new Date().getFullYear()
  const slots = await getNightSlots(year, parseInt(night))
  return NextResponse.json(slots)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ night: string }> }) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { night } = await params
  const nightNum = parseInt(night)
  if (isNaN(nightNum) || nightNum < 1 || nightNum > 30) {
    return NextResponse.json({ error: 'Invalid night' }, { status: 400 })
  }

  const { amount_cents, quantity, meal_type, meal_civil_date } = await req.json() as {
    amount_cents: number
    quantity: number
    meal_type: RamadanSlot['meal_type']
    meal_civil_date: string
  }

  if (!amount_cents || amount_cents < 100) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  if (!quantity || quantity < 1 || quantity > 100) return NextResponse.json({ error: 'Quantity 1–100' }, { status: 400 })
  if (!['IFTAR', 'SAHUR', 'GENERAL'].includes(meal_type)) return NextResponse.json({ error: 'Invalid meal_type' }, { status: 400 })
  if (!meal_civil_date || !/^\d{4}-\d{2}-\d{2}$/.test(meal_civil_date)) return NextResponse.json({ error: 'meal_civil_date required (YYYY-MM-DD)' }, { status: 400 })

  const year = new Date().getFullYear()
  const bookingCutoff = computeBookingCutoff(meal_type, meal_civil_date)
  const now = new Date().toISOString()

  const created: RamadanSlot[] = []
  for (let i = 0; i < quantity; i++) {
    const slot: RamadanSlot = {
      id: generateSlotId(),
      night: nightNum,
      year,
      amount: amount_cents,
      meal_type,
      status: 'AVAILABLE',
      booking_cutoff_at: bookingCutoff,
      created_at: now,
    }
    await createRamadanSlot(year, slot)
    created.push(slot)
  }

  return NextResponse.json({ created: created.length, slots: created })
}
