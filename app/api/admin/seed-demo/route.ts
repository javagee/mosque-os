import { NextResponse } from 'next/server'
import { saveOrder } from '@/lib/order-store'
import type { Order } from '@/types'

function randomRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let r = 'IMA-'
  for (let i = 0; i < 6; i++) r += chars[Math.floor(Math.random() * chars.length)]
  return r
}

export async function POST() {
  const now = new Date()
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString()

  const orders: Order[] = [
    {
      reference: randomRef(),
      campaign_id: 'demo-campaign-1',
      campaign_name: 'Springleaf Prata Place',
      merchant_name: 'Springleaf Prata Place',
      buyer_name: 'Ahmad Faris',
      buyer_email: 'ahmad.faris@demo.sg',
      quantity: 2,
      unit_price: 800,
      total: 1600,
      currency: 'sgd',
      mosque_portion: 800,
      merchant_portion: 800,
      status: 'pending_verification',
      created_at: fiveMinAgo,
      paid_at: fiveMinAgo,
    },
    {
      reference: randomRef(),
      campaign_id: 'demo-campaign-2',
      campaign_name: 'Bella Cucina Halal',
      merchant_name: 'Bella Cucina Halal',
      buyer_name: 'Siti Norzahra',
      buyer_email: 'siti.norzahra@demo.sg',
      quantity: 1,
      unit_price: 1200,
      total: 1200,
      currency: 'sgd',
      mosque_portion: 600,
      merchant_portion: 600,
      status: 'pending_verification',
      created_at: now.toISOString(),
      paid_at: now.toISOString(),
    },
  ]

  for (const order of orders) {
    await saveOrder(order)
  }

  return NextResponse.json({ seeded: orders.length, references: orders.map(o => o.reference) })
}
