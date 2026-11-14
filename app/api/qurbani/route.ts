import { NextResponse } from 'next/server'
import { getActiveCampaign } from '@/lib/qurbani-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const campaign = await getActiveCampaign()
  return NextResponse.json({ campaign })
}
