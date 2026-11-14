import { NextRequest, NextResponse } from 'next/server'
import { getWaqfAsset, saveWaqfAsset, saveWaqfTx, generateTxId } from '@/lib/waqf-store'
import type { WaqfTransaction } from '@/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { amount, note } = await req.json()
  if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })

  const asset = await getWaqfAsset(id)
  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const cents = Math.round(amount * 100)
  const updated = {
    ...asset,
    returns_available: asset.returns_available + cents,
    returns_ytd: asset.returns_ytd + cents,
    returns_lifetime: asset.returns_lifetime + cents,
  }
  const tx: WaqfTransaction = {
    id: generateTxId(),
    asset_id: id,
    type: 'return_earned',
    amount: cents,
    note: note?.trim() || undefined,
    created_at: new Date().toISOString(),
  }

  await Promise.all([saveWaqfAsset(updated), saveWaqfTx(tx)])
  return NextResponse.json(updated)
}
