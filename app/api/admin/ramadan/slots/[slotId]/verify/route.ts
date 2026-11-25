import { NextRequest, NextResponse } from 'next/server'
import { getRamadanSlot } from '@/lib/ramadan-store'

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

  // Delegate to the shared order verify endpoint which handles slot update + email
  if (slot.order_reference) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const res = await fetch(`${appUrl}/api/orders/${slot.order_reference}/verify`, {
      method: 'POST',
      headers: { Cookie: req.headers.get('Cookie') ?? '' },
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return NextResponse.json({ error: data.error ?? 'Verification failed' }, { status: res.status })
    }
    return NextResponse.json({ success: true, order_reference: slot.order_reference })
  }

  // Fallback: no order ref, just mark slot directly (edge case)
  const { verifySlot } = await import('@/lib/ramadan-store')
  const verified = await verifySlot(year, slotId)
  if (!verified) return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  return NextResponse.json(verified)
}
