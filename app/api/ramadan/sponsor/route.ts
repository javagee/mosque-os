import { NextRequest, NextResponse } from 'next/server'
import { addRamadanSponsor } from '@/lib/ramadan-store'
import { saveOrder } from '@/lib/order-store'
import type { RamadanSponsor } from '@/types'
import type { Order } from '@/types'

export const dynamic = 'force-dynamic'

function generateId(len = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let id = ''
  for (let i = 0; i < len; i++) id += chars[Math.floor(Math.random() * chars.length)]
  return id
}

function generateReference(): string {
  return `IMA-${generateId(6)}`
}

export async function POST(req: NextRequest) {
  const { night, donor_name, donor_email, amount, message, anonymous, year: reqYear } =
    await req.json() as {
      night: number
      donor_name: string
      donor_email: string
      amount: number
      message?: string
      anonymous?: boolean
      year?: number
    }

  if (!night || night < 1 || night > 30) {
    return NextResponse.json({ error: 'Invalid night number' }, { status: 400 })
  }
  if (!donor_name || !donor_email || !amount || amount < 100) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const year = reqYear ?? new Date().getFullYear()
  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'
  const reference = generateReference()
  const sponsorId = generateId(8)

  const sponsor: RamadanSponsor = {
    id: sponsorId,
    night,
    year,
    donor_name,
    donor_email,
    amount,
    message: message ?? undefined,
    anonymous: anonymous ?? false,
    status: 'pending',
    order_reference: reference,
    created_at: new Date().toISOString(),
  }

  const order: Order = {
    reference,
    campaign_id: 'ramadan',
    campaign_name: `Ramadan Sadaqah Night ${night}`,
    merchant_name: mosqueName,
    buyer_name: donor_name,
    buyer_email: donor_email,
    quantity: 1,
    unit_price: amount,
    total: amount,
    currency: 'sgd',
    mosque_portion: amount,
    merchant_portion: 0,
    status: 'pending_payment',
    created_at: new Date().toISOString(),
  }

  await Promise.all([
    addRamadanSponsor(year, night, sponsor),
    saveOrder(order),
  ])

  return NextResponse.json({ sponsor_id: sponsorId, order_reference: reference })
}
