import { NextRequest, NextResponse } from 'next/server'
import { getOrder } from '@/lib/order-store'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  const { reference } = await params
  const order = await getOrder(reference)
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  return NextResponse.json(order)
}
