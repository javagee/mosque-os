import { NextRequest, NextResponse } from 'next/server'
import { getSadaqahClaim, saveSadaqahClaim, getSadaqahAllocation, saveSadaqahAllocation } from '@/lib/sadaqah-store'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const claim = await getSadaqahClaim(token.toUpperCase())
  if (!claim) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (claim.status === 'settled') return NextResponse.json({ error: 'Already settled' }, { status: 409 })

  const { settlement_ref } = await req.json()
  if (!settlement_ref?.trim()) return NextResponse.json({ error: 'Settlement reference required' }, { status: 400 })

  const now = new Date().toISOString()
  const updatedClaim = { ...claim, status: 'settled' as const, settlement_ref: settlement_ref.trim(), settled_at: now }
  await saveSadaqahClaim(updatedClaim)

  // also mark the linked allocation as settled
  const alloc = await getSadaqahAllocation(claim.allocation_id)
  if (alloc) await saveSadaqahAllocation({ ...alloc, status: 'settled' as const, settlement_ref: settlement_ref.trim() })

  return NextResponse.json(updatedClaim)
}
