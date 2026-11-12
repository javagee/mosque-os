import { NextResponse } from 'next/server'
import { getBooking, saveBooking } from '@/lib/facility-store'

export const dynamic = 'force-dynamic'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const booking = await getBooking(id)
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { status, admin_notes } = await req.json()
  if (!['confirmed', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'status must be confirmed or rejected' }, { status: 400 })
  }
  const updated = { ...booking, status, admin_notes: admin_notes || booking.admin_notes }
  await saveBooking(updated)
  return NextResponse.json(updated)
}
