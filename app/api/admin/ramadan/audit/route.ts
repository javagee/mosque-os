import { NextRequest, NextResponse } from 'next/server'
import { getAuditEvents } from '@/lib/ramadan-store'

export const dynamic = 'force-dynamic'

function isAuthed(req: NextRequest) {
  return !!req.cookies.get('admin_auth')?.value
}

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const year = new Date().getFullYear()
  const events = await getAuditEvents(year)
  return NextResponse.json(events.slice().reverse()) // newest first
}
