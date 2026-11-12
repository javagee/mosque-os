import { NextResponse } from 'next/server'
import { getAllFacilities, saveFacility, generateFacilityId } from '@/lib/facility-store'
import type { Facility } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(await getAllFacilities())
}

export async function POST(req: Request) {
  const body = await req.json()
  const { name, description, capacity } = body
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const facility: Facility = {
    id: generateFacilityId(),
    name,
    description: description || undefined,
    capacity: capacity ? Number(capacity) : undefined,
    active: true,
    created_at: new Date().toISOString(),
  }

  await saveFacility(facility)
  return NextResponse.json(facility, { status: 201 })
}
