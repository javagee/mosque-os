import { NextRequest, NextResponse } from 'next/server'
import { getAllPartners, savePartner, generatePartnerId } from '@/lib/qurbani-store'
import type { QurbaniPartner } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(await getAllPartners())
}

export async function POST(req: NextRequest) {
  const { name, country, address, halal_cert_number, capacity_per_day, animal_types } = await req.json()
  if (!name || !capacity_per_day || !animal_types?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  const partner: QurbaniPartner = {
    id: generatePartnerId(),
    name, country, address, halal_cert_number, capacity_per_day, animal_types,
    active: true,
    created_at: new Date().toISOString(),
  }
  await savePartner(partner)
  return NextResponse.json(partner)
}
