import { NextResponse } from 'next/server'
import { getAllQurbaniOrders } from '@/lib/qurbani-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(await getAllQurbaniOrders())
}
