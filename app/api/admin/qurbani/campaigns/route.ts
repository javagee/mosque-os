import { NextRequest, NextResponse } from 'next/server'
import { getAllCampaigns, saveCampaign, generateCampaignId } from '@/lib/qurbani-store'
import type { QurbaniCampaign } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(await getAllCampaigns())
}

export async function POST(req: NextRequest) {
  const { year, hijri_year, eid_date, fulfilment_deadline, currency, animals } = await req.json()
  if (!year || !eid_date || !fulfilment_deadline || !currency || !animals?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  const campaign: QurbaniCampaign = {
    id: generateCampaignId(),
    year, hijri_year, eid_date, fulfilment_deadline, currency, animals,
    active: true,
    created_at: new Date().toISOString(),
  }
  await saveCampaign(campaign)
  return NextResponse.json(campaign)
}
