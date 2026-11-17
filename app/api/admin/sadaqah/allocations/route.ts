import { NextRequest, NextResponse } from 'next/server'
import { getAllSadaqahAllocations, saveSadaqahAllocation, generateAllocationId, getSadaqahFund } from '@/lib/sadaqah-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(await getAllSadaqahAllocations())
}

export async function POST(req: NextRequest) {
  const { fund_id, amount, purpose, beneficiary_name, beneficiary_id } = await req.json()
  if (!fund_id || !amount || !purpose?.trim()) {
    return NextResponse.json({ error: 'fund_id, amount and purpose are required' }, { status: 400 })
  }

  const fund = await getSadaqahFund(fund_id)
  if (!fund) return NextResponse.json({ error: 'Fund not found' }, { status: 404 })

  const cents = Math.round(amount * 100)
  if (cents > fund.balance) return NextResponse.json({ error: 'Insufficient fund balance' }, { status: 400 })

  const alloc = {
    id: generateAllocationId(),
    fund_id,
    fund_name: fund.name,
    amount: cents,
    currency: fund.currency,
    purpose: purpose.trim(),
    beneficiary_name: beneficiary_name?.trim() || undefined,
    beneficiary_id: beneficiary_id?.trim() || undefined,
    status: 'pending' as const,
    created_at: new Date().toISOString(),
  }
  await saveSadaqahAllocation(alloc)
  return NextResponse.json(alloc)
}
