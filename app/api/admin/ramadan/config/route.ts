import { NextRequest, NextResponse } from 'next/server'
import { getRamadanConfig, saveRamadanConfig } from '@/lib/ramadan-store'
import type { RamadanConfig } from '@/types'

export const dynamic = 'force-dynamic'

function isAuthed(req: NextRequest) {
  return !!req.cookies.get('admin_auth')?.value
}

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const year = new Date().getFullYear()
  const config = await getRamadanConfig(year)
  return NextResponse.json(config)
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json() as Partial<RamadanConfig>
  const year = body.year ?? new Date().getFullYear()
  const existing = await getRamadanConfig(year)
  const updated: RamadanConfig = {
    ...existing,
    ...body,
    year,
  }
  await saveRamadanConfig(updated)
  return NextResponse.json(updated)
}
