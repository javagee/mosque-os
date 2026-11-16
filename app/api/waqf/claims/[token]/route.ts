import { NextRequest, NextResponse } from 'next/server'
import { getWaqfClaim } from '@/lib/waqf-claim-store'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const claim = await getWaqfClaim(token.toUpperCase())
  if (!claim) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(claim)
}
