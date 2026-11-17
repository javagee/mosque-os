import { NextRequest, NextResponse } from 'next/server'
import { getSadaqahAllocation, saveSadaqahAllocation, getSadaqahFund, saveSadaqahFund, saveSadaqahClaim, generateSadaqahClaimId } from '@/lib/sadaqah-store'
import type { SadaqahClaim } from '@/types'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const alloc = await getSadaqahAllocation(id)
  if (!alloc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (alloc.status !== 'approved') return NextResponse.json({ error: 'Allocation must be approved before issuing a claim' }, { status: 409 })

  const fund = await getSadaqahFund(alloc.fund_id)
  if (!fund) return NextResponse.json({ error: 'Fund not found' }, { status: 404 })
  if (alloc.amount > fund.balance) return NextResponse.json({ error: 'Insufficient fund balance' }, { status: 400 })

  const now = new Date().toISOString()
  const claimId = generateSadaqahClaimId()

  const claim: SadaqahClaim = {
    id: claimId,
    fund_id: alloc.fund_id,
    fund_name: alloc.fund_name,
    allocation_id: alloc.id,
    beneficiary_name: alloc.beneficiary_name,
    amount: alloc.amount,
    currency: alloc.currency,
    purpose: alloc.purpose,
    status: 'pending',
    issued_at: now,
  }

  const updatedFund = { ...fund, balance: fund.balance - alloc.amount, disbursed_total: fund.disbursed_total + alloc.amount }
  const updatedAlloc = { ...alloc, status: 'claimed' as const, claim_id: claimId }

  await Promise.all([saveSadaqahClaim(claim), saveSadaqahFund(updatedFund), saveSadaqahAllocation(updatedAlloc)])
  return NextResponse.json({ claim, allocation: updatedAlloc })
}
