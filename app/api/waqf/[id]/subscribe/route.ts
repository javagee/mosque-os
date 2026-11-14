import { NextRequest, NextResponse } from 'next/server'
import { getWaqfAsset, saveWaqfShare, generateShareId } from '@/lib/waqf-store'
import { saveOrder } from '@/lib/order-store'
import type { Order, WaqfShare } from '@/types'

export const dynamic = 'force-dynamic'

function generateReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let ref = 'IMA-'
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)]
  return ref
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { donor_name, donor_email, shares } = await req.json()

  if (!donor_name || !donor_email || !shares || shares < 1) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const asset = await getWaqfAsset(id)
  if (!asset || asset.status !== 'active') {
    return NextResponse.json({ error: 'Waqf programme not found or inactive' }, { status: 404 })
  }

  const total = asset.unit_price * shares
  const reference = generateReference()
  const share_id = generateShareId()

  const order: Order = {
    reference,
    campaign_id: `waqf:${id}`,
    campaign_name: asset.name,
    merchant_name: 'Waqf Programme',
    buyer_name: donor_name.trim(),
    buyer_email: donor_email.trim().toLowerCase(),
    quantity: shares,
    unit_price: asset.unit_price,
    total,
    currency: 'SGD',
    mosque_portion: total,
    merchant_portion: 0,
    status: 'pending_payment',
    created_at: new Date().toISOString(),
  }

  const waqfShare: WaqfShare = {
    id: share_id,
    asset_id: id,
    asset_name: asset.name,
    currency: asset.currency,
    donor_name: donor_name.trim(),
    donor_email: donor_email.trim().toLowerCase(),
    shares,
    unit_price: asset.unit_price,
    total,
    order_reference: reference,
    status: 'pending',
    created_at: new Date().toISOString(),
  }

  await Promise.all([saveOrder(order), saveWaqfShare(waqfShare)])

  return NextResponse.json({ order_reference: reference, share_id })
}
