import { NextResponse } from 'next/server'
import { getEvent, saveEvent } from '@/lib/event-store'

export const dynamic = 'force-dynamic'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const event = await getEvent(id)
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await req.json()
  const updated = { ...event, ...body }
  await saveEvent(updated)
  return NextResponse.json(updated)
}
