import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const coupon = await db.getCouponByToken(token)
  if (!coupon) return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
  return NextResponse.json(coupon)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const { outlet } = await req.json().catch(() => ({ outlet: null }))

  const coupon = await db.getCouponByToken(token)
  if (!coupon) return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })

  if (coupon.status === 'redeemed') {
    return NextResponse.json({ error: 'Already redeemed', coupon }, { status: 409 })
  }

  const now = new Date()
  if (coupon.campaign?.redemption_end && now > new Date(coupon.campaign.redemption_end)) {
    return NextResponse.json({ error: 'Coupon has expired' }, { status: 410 })
  }
  if (coupon.campaign?.redemption_start && now < new Date(coupon.campaign.redemption_start)) {
    return NextResponse.json({ error: 'Coupon redemption period has not started yet' }, { status: 400 })
  }

  const updated = await db.redeemCoupon(token, outlet ?? null)
  if (!updated) {
    return NextResponse.json({ error: 'Redemption failed — coupon may have already been used' }, { status: 409 })
  }

  return NextResponse.json({ success: true, coupon: updated })
}
