import { NextRequest, NextResponse } from 'next/server'
import { getRamadanSlot, verifySlot } from '@/lib/ramadan-store'

export const dynamic = 'force-dynamic'

function isAuthed(req: NextRequest) {
  return !!req.cookies.get('admin_auth')?.value
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slotId: string }> }) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { slotId } = await params
  const year = new Date().getFullYear()

  const slot = await getRamadanSlot(year, slotId)
  if (!slot) return NextResponse.json({ error: 'Slot not found' }, { status: 404 })
  if (slot.status !== 'CLAIMED_PENDING') {
    return NextResponse.json({ error: `Cannot verify slot with status ${slot.status}` }, { status: 409 })
  }

  const verified = await verifySlot(year, slotId)
  if (!verified) return NextResponse.json({ error: 'Verification failed' }, { status: 500 })

  return NextResponse.json(verified)
}
