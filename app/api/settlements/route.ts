import { NextRequest, NextResponse } from 'next/server'
import { getOrder, saveOrder } from '@/lib/order-store'

export async function POST(req: NextRequest) {
  const { references } = await req.json() as { references: string[] }
  if (!references?.length) return NextResponse.json({ error: 'No orders provided' }, { status: 400 })

  const now = new Date().toISOString()
  await Promise.all(
    references.map(async (ref) => {
      const order = await getOrder(ref)
      if (order && order.status === 'verified') {
        await saveOrder({ ...order, merchant_settled: true, merchant_settled_at: now })
      }
    })
  )
  return NextResponse.json({ success: true, settled: references.length })
}
