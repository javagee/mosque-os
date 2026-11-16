import { NextRequest, NextResponse } from 'next/server'
import { getAssetClaims } from '@/lib/waqf-claim-store'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const claims = await getAssetClaims(id)
  return NextResponse.json(claims)
}
