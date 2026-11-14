import { NextRequest, NextResponse } from 'next/server'
import { getCampaign, saveCampaign } from '@/lib/qurbani-store'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const campaign = await getCampaign(id)
  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const updates = await req.json()
  const updated = { ...campaign, ...updates }
  await saveCampaign(updated)
  return NextResponse.json(updated)
}
