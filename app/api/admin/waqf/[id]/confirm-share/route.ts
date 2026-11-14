import { NextRequest, NextResponse } from 'next/server'
import { getWaqfAsset, saveWaqfAsset, getWaqfShare, saveWaqfShare, saveWaqfTx, generateTxId } from '@/lib/waqf-store'
import type { WaqfTransaction } from '@/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { share_id } = await req.json()

  const [asset, share] = await Promise.all([getWaqfAsset(id), getWaqfShare(share_id)])
  if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  if (!share || share.asset_id !== id) return NextResponse.json({ error: 'Share not found' }, { status: 404 })
  if (share.status === 'confirmed') return NextResponse.json({ error: 'Already confirmed' }, { status: 400 })

  const confirmed = { ...share, status: 'confirmed' as const }
  const updatedAsset = { ...asset, principal: asset.principal + share.total }
  const tx: WaqfTransaction = {
    id: generateTxId(),
    asset_id: id,
    type: 'contribution',
    amount: share.total,
    note: `${share.shares} share${share.shares > 1 ? 's' : ''} from ${share.donor_name}`,
    created_at: new Date().toISOString(),
  }

  await Promise.all([saveWaqfShare(confirmed), saveWaqfAsset(updatedAsset), saveWaqfTx(tx)])
  return NextResponse.json(updatedAsset)
}
