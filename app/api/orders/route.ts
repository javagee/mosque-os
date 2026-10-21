import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { saveOrder } from '@/lib/order-store'
import type { Order } from '@/types'

function generateReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let ref = 'IMA-'
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)]
  return ref
}

export async function POST(req: NextRequest) {
  const { campaign_id, quantity, buyer_name, buyer_email } = await req.json()

  if (!campaign_id || !quantity || !buyer_name || !buyer_email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const campaign = await db.getCampaign(campaign_id)
  if (!campaign || !campaign.active) {
    return NextResponse.json({ error: 'Campaign not found or inactive' }, { status: 404 })
  }

  if (campaign.total_coupons && campaign.coupons_sold + quantity > campaign.total_coupons) {
    return NextResponse.json({ error: 'Not enough coupons available' }, { status: 400 })
  }

  const total = campaign.coupon_price * quantity
  const mosque_portion = Math.floor(total * 0.5)
  const merchant_portion = total - mosque_portion

  const order: Order = {
    reference: generateReference(),
    campaign_id,
    campaign_name: campaign.name,
    merchant_name: campaign.merchant_name,
    buyer_name: buyer_name.trim(),
    buyer_email: buyer_email.trim().toLowerCase(),
    quantity,
    unit_price: campaign.coupon_price,
    total,
    currency: campaign.currency,
    mosque_portion,
    merchant_portion,
    status: 'pending_payment',
    created_at: new Date().toISOString(),
  }

  await saveOrder(order)

  return NextResponse.json({ reference: order.reference })
}
