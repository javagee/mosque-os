import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { tokens } = await req.json() as { tokens: string[] }
  if (!tokens?.length) return NextResponse.json({ error: 'No coupons provided' }, { status: 400 })
  await db.markCouponsSettled(tokens)
  return NextResponse.json({ success: true, settled: tokens.length })
}
