import { NextResponse } from 'next/server'
import { getAllEvents } from '@/lib/event-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const events = await getAllEvents()
  return NextResponse.json(events.filter(e => e.active))
}
