import { NextRequest, NextResponse } from 'next/server'
import { getRamadanSlot, claimSlot } from '@/lib/ramadan-store'
import { saveOrder } from '@/lib/order-store'
import type { Order } from '@/types'

export const dynamic = 'force-dynamic'

function generateReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let id = ''
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)]
  return `IMA-${id}`
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slotId: string }> }) {
  const { slotId } = await params
  const { hold_token, donor_name, donor_email, donor_anonymous } = await req.json() as {
    hold_token: string
    donor_name: string
    donor_email: string
    donor_anonymous?: boolean
  }

  if (!hold_token || !donor_name || !donor_email) {
    return NextResponse.json({ error: 'hold_token, donor_name and donor_email are required' }, { status: 400 })
  }

  const year = new Date().getFullYear()
  const slot = await getRamadanSlot(year, slotId)
  if (!slot) return NextResponse.json({ error: 'Slot not found' }, { status: 404 })

  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'
  const reference = generateReference()

  const claimed = await claimSlot(
    year,
    slotId,
    hold_token,
    donor_name.trim(),
    donor_email.trim().toLowerCase(),
    donor_anonymous ?? false,
    reference,
  )

  if (!claimed) {
    return NextResponse.json({ error: 'Hold expired or invalid — please try again' }, { status: 409 })
  }

  const order: Order = {
    reference,
    campaign_id: 'ramadan-slot',
    campaign_name: `Ramadan Night ${slot.night} — ${slot.meal_type} Sponsorship`,
    merchant_name: mosqueName,
    buyer_name: donor_name.trim(),
    buyer_email: donor_email.trim().toLowerCase(),
    quantity: 1,
    unit_price: slot.amount,
    total: slot.amount,
    currency: 'sgd',
    mosque_portion: slot.amount,
    merchant_portion: 0,
    status: 'pending_payment',
    created_at: new Date().toISOString(),
  }

  await saveOrder(order)

  return NextResponse.json({ order_reference: reference, slot_id: slotId, amount: slot.amount })
}
