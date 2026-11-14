import { NextResponse } from 'next/server'
import { getAllWaqfAssets } from '@/lib/waqf-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const assets = await getAllWaqfAssets()
  return NextResponse.json(assets.filter(a => a.status === 'active'))
}
