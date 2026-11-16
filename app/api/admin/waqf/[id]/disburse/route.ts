import { NextRequest, NextResponse } from 'next/server'
import { getWaqfAsset, saveWaqfAsset, saveWaqfTx, generateTxId } from '@/lib/waqf-store'
import type { WaqfTransaction } from '@/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { amount, note, beneficiary_name, settlement_ref, asset_registry_ref } = await req.json()
  if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  if (!note?.trim()) return NextResponse.json({ error: 'Note required for disbursement' }, { status: 400 })

  const asset = await getWaqfAsset(id)
  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const cents = Math.round(amount * 100)
  if (cents > asset.returns_available) {
    return NextResponse.json({ error: 'Insufficient returns available' }, { status: 400 })
  }

  const updated = { ...asset, returns_available: asset.returns_available - cents }
  const tx: WaqfTransaction = {
    id: generateTxId(),
    asset_id: id,
    type: 'disbursement',
    amount: -cents,
    note: note.trim(),
    jurisdiction_code: asset.jurisdiction_code,
    beneficiary_name: beneficiary_name?.trim() || undefined,
    settlement_ref: settlement_ref?.trim() || undefined,
    asset_registry_ref: asset_registry_ref?.trim() || undefined,
    created_at: new Date().toISOString(),
  }

  await Promise.all([saveWaqfAsset(updated), saveWaqfTx(tx)])
  return NextResponse.json(updated)
}
