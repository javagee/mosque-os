import { NextResponse } from 'next/server'
import { getFacility, generateBookingId, saveBooking, getFacilityBookingsForDate } from '@/lib/facility-store'
import type { FacilityBooking } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'date param required' }, { status: 400 })
  const bookings = await getFacilityBookingsForDate(id, date)
  return NextResponse.json(bookings.filter(b => b.status === 'confirmed'))
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const facility = await getFacility(id)
  if (!facility || !facility.active) return NextResponse.json({ error: 'Facility not found' }, { status: 404 })

  const body = await req.json()
  const { date, start_time, end_time, purpose, organizer_name, organizer_email, organizer_phone, pax } = body
  if (!date || !start_time || !end_time || !purpose || !organizer_name || !organizer_email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const booking: FacilityBooking = {
    id: generateBookingId(),
    facility_id: id,
    facility_name: facility.name,
    date,
    start_time,
    end_time,
    purpose,
    organizer_name,
    organizer_email,
    organizer_phone: organizer_phone || undefined,
    pax: pax || undefined,
    status: 'pending',
    created_at: new Date().toISOString(),
  }

  await saveBooking(booking)
  return NextResponse.json({ id: booking.id }, { status: 201 })
}
