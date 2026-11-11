import { NextRequest, NextResponse } from 'next/server'
import { getJemaah } from '@/lib/jemaah-store'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const member = await getJemaah(id)
  if (!member) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(member)
}
