import { NextResponse } from 'next/server'
import { getRamadanConfig, getAllRamadanNights } from '@/lib/ramadan-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const year = new Date().getFullYear()
  const [config, nights] = await Promise.all([
    getRamadanConfig(year),
    getAllRamadanNights(year),
  ])
  return NextResponse.json({ config, nights })
}
