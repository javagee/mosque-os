import { NextRequest, NextResponse } from 'next/server'
import { getSadaqahFund, saveSadaqahFund } from '@/lib/sadaqah-store'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const fund = await getSadaqahFund(id)
  if (!fund) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { amount } = await req.json()
  if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })

  const cents = Math.round(amount * 100)
  const updated = { ...fund, balance: fund.balance + cents, received_total: fund.received_total + cents }
  await saveSadaqahFund(updated)
  return NextResponse.json(updated)
}
