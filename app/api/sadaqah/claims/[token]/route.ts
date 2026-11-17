import { NextRequest, NextResponse } from 'next/server'
import { getSadaqahClaim } from '@/lib/sadaqah-store'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const claim = await getSadaqahClaim(token.toUpperCase())
  if (!claim) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(claim)
}
