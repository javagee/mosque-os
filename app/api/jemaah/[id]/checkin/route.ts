import { NextRequest, NextResponse } from 'next/server'
import { getJemaah, recordCheckIn, hasCheckedIn } from '@/lib/jemaah-store'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const member = await getJemaah(id)
  if (!member) return NextResponse.json({ error: 'member not found' }, { status: 404 })

  const today = new Date().toISOString().slice(0, 10)
  const already = await hasCheckedIn(id, today)
  if (already) return NextResponse.json({ already: true, member })

  await recordCheckIn(id, today)
  return NextResponse.json({ already: false, member })
}
