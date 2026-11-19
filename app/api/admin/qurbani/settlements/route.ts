import { NextRequest, NextResponse } from 'next/server'
import { getAllQurbaniSettlements, saveQurbaniSettlement, generateSettlementId } from '@/lib/qurbani-store'
import type { QurbaniSettlement } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(await getAllQurbaniSettlements())
}

export async function POST(req: NextRequest) {
  const { partner_id, partner_name, campaign_id, order_ids, amount, currency, payment_ref, payment_date, note } = await req.json()
  if (!partner_id || !campaign_id || !amount || !currency || !payment_date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  const settlement: QurbaniSettlement = {
    id: generateSettlementId(),
    partner_id,
    partner_name: partner_name ?? '',
    campaign_id,
    order_ids: order_ids ?? [],
    amount,
    currency,
    payment_ref: payment_ref || undefined,
    payment_date,
    note: note || undefined,
    created_at: new Date().toISOString(),
  }
  await saveQurbaniSettlement(settlement)
  return NextResponse.json(settlement)
}
