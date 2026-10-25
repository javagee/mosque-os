import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { CampaignInsertData } from '@/lib/db/types'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const updates = await req.json() as Partial<CampaignInsertData>
  const updated = await db.updateCampaign(id, updates)
  if (!updated) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  return NextResponse.json(updated)
}
