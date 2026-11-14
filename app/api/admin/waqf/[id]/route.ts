import { NextRequest, NextResponse } from 'next/server'
import { getWaqfAsset, saveWaqfAsset } from '@/lib/waqf-store'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const asset = await getWaqfAsset(id)
  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const updates = await req.json()
  const updated = { ...asset, ...updates }
  await saveWaqfAsset(updated)
  return NextResponse.json(updated)
}
