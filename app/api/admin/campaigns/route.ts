import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { CampaignInsertData } from '@/lib/db/types'

export async function GET() {
  const campaigns = await db.getAllCampaigns()
  return NextResponse.json(campaigns)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as CampaignInsertData
    if (!body.name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    if (!body.merchant_name?.trim()) return NextResponse.json({ error: 'Merchant name is required' }, { status: 400 })
    if (!body.coupon_price || body.coupon_price <= 0) return NextResponse.json({ error: 'Price must be greater than 0' }, { status: 400 })

    const campaign = await db.createCampaign({
      name: body.name.trim(),
      merchant_name: body.merchant_name.trim(),
      description: body.description?.trim(),
      coupon_price: body.coupon_price,
      currency: body.currency || 'sgd',
      total_coupons: body.total_coupons || undefined,
      redemption_end: body.redemption_end || undefined,
      image_url: body.image_url?.trim() || undefined,
      active: body.active ?? true,
    })
    return NextResponse.json(campaign, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
