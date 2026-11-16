import { NextRequest, NextResponse } from 'next/server'
import { getWaqfClaim, saveWaqfClaim } from '@/lib/waqf-claim-store'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const claim = await getWaqfClaim(token.toUpperCase())
  if (!claim) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (claim.status === 'settled') return NextResponse.json({ error: 'Already settled' }, { status: 409 })

  const { settlement_ref } = await req.json()
  if (!settlement_ref?.trim()) return NextResponse.json({ error: 'Settlement reference required' }, { status: 400 })

  const updated = {
    ...claim,
    status: 'settled' as const,
    settlement_ref: settlement_ref.trim(),
    settled_at: new Date().toISOString(),
  }
  await saveWaqfClaim(updated)
  return NextResponse.json(updated)
}
