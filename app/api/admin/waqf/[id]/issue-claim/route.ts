import { NextRequest, NextResponse } from 'next/server'
import { getWaqfAsset, saveWaqfAsset, saveWaqfTx, generateTxId } from '@/lib/waqf-store'
import { saveWaqfClaim, generateClaimId } from '@/lib/waqf-claim-store'
import type { WaqfTransaction, WaqfClaim } from '@/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { amount, purpose, beneficiary_name } = await req.json()

  if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  if (!purpose?.trim()) return NextResponse.json({ error: 'Purpose is required' }, { status: 400 })

  const asset = await getWaqfAsset(id)
  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const cents = Math.round(amount * 100)
  if (cents > asset.returns_available) {
    return NextResponse.json({ error: 'Insufficient returns available' }, { status: 400 })
  }

  const now = new Date().toISOString()
  const claimId = generateClaimId()
  const txId = generateTxId()

  const tx: WaqfTransaction = {
    id: txId,
    asset_id: id,
    type: 'disbursement',
    amount: -cents,
    note: purpose.trim(),
    jurisdiction_code: asset.jurisdiction_code,
    beneficiary_name: beneficiary_name?.trim() || undefined,
    rule_note: `Claim QR issued: ${claimId}`,
    created_at: now,
  }

  const claim: WaqfClaim = {
    id: claimId,
    asset_id: id,
    asset_name: asset.name,
    tx_id: txId,
    beneficiary_name: beneficiary_name?.trim() || undefined,
    amount: cents,
    currency: asset.currency,
    purpose: purpose.trim(),
    jurisdiction_code: asset.jurisdiction_code,
    status: 'pending',
    issued_at: now,
  }

  const updated = { ...asset, returns_available: asset.returns_available - cents }

  await Promise.all([saveWaqfAsset(updated), saveWaqfTx(tx), saveWaqfClaim(claim)])
  return NextResponse.json({ asset: updated, claim })
}
