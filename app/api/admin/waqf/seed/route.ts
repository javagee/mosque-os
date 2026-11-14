import { NextResponse } from 'next/server'
import { seedDemoData } from '@/lib/waqf-store'

export const dynamic = 'force-dynamic'

export async function POST() {
  const seeded = await seedDemoData()
  return NextResponse.json(seeded ? { seeded: true } : { seeded: false, reason: 'already has data' })
}
