import { NextRequest, NextResponse } from 'next/server'
import { findSponsorByOrderRef, confirmRamadanSponsor } from '@/lib/ramadan-store'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { reference } = await req.json() as { reference: string }
  if (!reference) return NextResponse.json({ error: 'Missing reference' }, { status: 400 })

  const year = new Date().getFullYear()
  const found = await findSponsorByOrderRef(year, reference)
  if (!found) {
    return NextResponse.json({ error: 'Sponsor not found' }, { status: 404 })
  }

  await confirmRamadanSponsor(year, found.night, found.sponsor.id)
  return NextResponse.json({ success: true, night: found.night })
}
