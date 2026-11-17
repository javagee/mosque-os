import { NextRequest, NextResponse } from 'next/server'
import { getSadaqahAllocation, saveSadaqahAllocation } from '@/lib/sadaqah-store'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const alloc = await getSadaqahAllocation(id)
  if (!alloc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (alloc.status !== 'pending') return NextResponse.json({ error: `Cannot approve — status is ${alloc.status}` }, { status: 409 })

  const updated = { ...alloc, status: 'approved' as const, approved_at: new Date().toISOString() }
  await saveSadaqahAllocation(updated)
  return NextResponse.json(updated)
}
