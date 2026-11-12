import { NextResponse } from 'next/server'
import { getEvent, generateRegistrationId, addRegistration, countConfirmedRegistrations } from '@/lib/event-store'
import type { EventRegistration } from '@/types'

export const dynamic = 'force-dynamic'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const event = await getEvent(id)
  if (!event || !event.active) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const body = await req.json()
  const { name, email, phone, pax = 1 } = body
  if (!name || !email) return NextResponse.json({ error: 'name and email are required' }, { status: 400 })

  if (event.registration_deadline && new Date() > new Date(event.registration_deadline)) {
    return NextResponse.json({ error: 'Registration deadline has passed' }, { status: 400 })
  }

  if (event.capacity !== undefined) {
    const taken = await countConfirmedRegistrations(id)
    if (taken + pax > event.capacity) {
      return NextResponse.json({ error: 'Not enough capacity remaining' }, { status: 400 })
    }
  }

  const reg: EventRegistration = {
    id: generateRegistrationId(),
    event_id: id,
    event_title: event.title,
    name,
    email,
    phone: phone || undefined,
    pax,
    status: 'confirmed',
    created_at: new Date().toISOString(),
  }

  await addRegistration(reg)
  return NextResponse.json({ id: reg.id, event_title: reg.event_title }, { status: 201 })
}
