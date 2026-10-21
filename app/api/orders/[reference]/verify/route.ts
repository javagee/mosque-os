import { NextRequest, NextResponse } from 'next/server'
import { getOrder, saveOrder } from '@/lib/order-store'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  const { reference } = await params
  const order = await getOrder(reference)
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const updated = { ...order, status: 'verified' as const, verified_at: new Date().toISOString() }
  await saveOrder(updated)
  return NextResponse.json({ success: true })
}
