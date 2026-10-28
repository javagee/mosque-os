import { NextRequest, NextResponse } from 'next/server'
import { getOrder } from '@/lib/order-store'

// POST /api/orders/lookup — validates reference + email, returns order if match
export async function POST(req: NextRequest) {
  const { reference, email } = await req.json() as { reference: string; email: string }

  if (!reference?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Reference and email are required' }, { status: 400 })
  }

  const ref = reference.trim().toUpperCase()
  const order = await getOrder(ref)

  if (!order) {
    return NextResponse.json({ error: 'Order not found. Check your reference and try again.' }, { status: 404 })
  }

  if (order.buyer_email.toLowerCase() !== email.trim().toLowerCase()) {
    return NextResponse.json({ error: 'Email does not match this order.' }, { status: 401 })
  }

  // Return only safe fields (no internal token/stripe data)
  return NextResponse.json({
    reference: order.reference,
    campaign_name: order.campaign_name,
    merchant_name: order.merchant_name,
    quantity: order.quantity,
    total: order.total,
    currency: order.currency,
    status: order.status,
    buyer_name: order.buyer_name,
    created_at: order.created_at,
    paid_at: order.paid_at,
    verified_at: order.verified_at,
  })
}
