import { NextResponse } from 'next/server'
import { getAllEvents, saveEvent, generateEventId } from '@/lib/event-store'
import type { MosqueEvent } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(await getAllEvents())
}

export async function POST(req: Request) {
  const body = await req.json()
  const { title, description, date, time, end_time, venue, capacity, fee, registration_deadline } = body
  if (!title || !date || !time) {
    return NextResponse.json({ error: 'title, date and time are required' }, { status: 400 })
  }

  const event: MosqueEvent = {
    id: generateEventId(),
    title,
    description: description || undefined,
    date,
    time,
    end_time: end_time || undefined,
    venue: venue || undefined,
    capacity: capacity ? Number(capacity) : undefined,
    fee: fee ? Number(fee) : 0,
    registration_deadline: registration_deadline || undefined,
    active: true,
    created_at: new Date().toISOString(),
  }

  await saveEvent(event)
  return NextResponse.json(event, { status: 201 })
}
