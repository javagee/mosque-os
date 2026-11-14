import { NextRequest, NextResponse } from 'next/server'
import { getWaqfAsset, getAssetShares, getAssetTransactions } from '@/lib/waqf-store'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const asset = await getWaqfAsset(id)
  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const [shares, transactions] = await Promise.all([
    getAssetShares(id),
    getAssetTransactions(id),
  ])
  return NextResponse.json({ asset, shares: shares.filter(s => s.status === 'confirmed'), transactions: transactions.slice(0, 10) })
}
