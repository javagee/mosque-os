import { NextRequest, NextResponse } from 'next/server'
import { getRamadanSlot, holdSlotAtomic } from '@/lib/ramadan-store'

export const dynamic = 'force-dynamic'

function generateHoldToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let t = ''
  for (let i = 0; i < 32; i++) t += chars[Math.floor(Math.random() * chars.length)]
  return t
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slotId: string }> }) {
  const { slotId } = await params
  const year = new Date().getFullYear()

  const slot = await getRamadanSlot(year, slotId)
  if (!slot) return NextResponse.json({ error: 'Slot not found' }, { status: 404 })

  // D3: enforce booking cutoff (Iftar 4 PM, Sahur D-3)
  if (slot.booking_cutoff_at && new Date() >= new Date(slot.booking_cutoff_at)) {
    return NextResponse.json({ error: 'Booking period has closed for this slot' }, { status: 409 })
  }

  const holdToken = generateHoldToken()
  const result = await holdSlotAtomic(year, slotId, holdToken)

  if (!result) {
    return NextResponse.json({ error: 'Slot is no longer available' }, { status: 409 })
  }

  return NextResponse.json({
    slot_id: slotId,
    hold_token: result.holdToken,
    expires_at: result.expiresAt,
    amount: slot.amount,
    night: slot.night,
    meal_type: slot.meal_type,
  })
}
