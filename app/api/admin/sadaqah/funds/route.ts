import { NextRequest, NextResponse } from 'next/server'
import { getAllSadaqahFunds, saveSadaqahFund, generateFundId, seedSadaqahData } from '@/lib/sadaqah-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(await getAllSadaqahFunds())
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (body.action === 'seed') {
    const seeded = await seedSadaqahData()
    return NextResponse.json({ seeded })
  }

  const { name, description, currency, purpose_tag } = body
  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const fund = {
    id: generateFundId(),
    name: name.trim(),
    description: description?.trim() || undefined,
    currency: currency || 'SGD',
    purpose_tag: purpose_tag?.trim() || undefined,
    balance: 0,
    received_total: 0,
    disbursed_total: 0,
    status: 'active' as const,
    created_at: new Date().toISOString(),
  }
  await saveSadaqahFund(fund)
  return NextResponse.json(fund)
}
