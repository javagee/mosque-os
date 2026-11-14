import { NextRequest, NextResponse } from 'next/server'
import { getQurbaniOrder, saveQurbaniOrder } from '@/lib/qurbani-store'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getQurbaniOrder(id)
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const updates = await req.json()
  const updated = { ...order, ...updates }
  await saveQurbaniOrder(updated)
  return NextResponse.json(updated)
}
