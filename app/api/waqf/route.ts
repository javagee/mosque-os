import { NextResponse } from 'next/server'
import { getAllWaqfAssets, seedDemoData } from '@/lib/waqf-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  let assets = await getAllWaqfAssets()
  if (assets.length === 0) {
    await seedDemoData()
    assets = await getAllWaqfAssets()
  }
  return NextResponse.json(assets.filter(a => a.status === 'active'))
}
