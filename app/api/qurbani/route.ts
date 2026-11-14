import { NextResponse } from 'next/server'
import { getActiveCampaign, seedDemoData } from '@/lib/qurbani-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  let campaign = await getActiveCampaign()
  if (!campaign) {
    await seedDemoData()
    campaign = await getActiveCampaign()
  }
  return NextResponse.json({ campaign })
}
