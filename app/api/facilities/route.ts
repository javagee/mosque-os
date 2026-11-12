import { NextResponse } from 'next/server'
import { getAllFacilities } from '@/lib/facility-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const facilities = await getAllFacilities()
  return NextResponse.json(facilities.filter(f => f.active))
}
