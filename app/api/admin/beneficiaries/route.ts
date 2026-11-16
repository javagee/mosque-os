import { NextRequest, NextResponse } from 'next/server'
import { getAllBeneficiaries, createBeneficiary, seedBeneficiaries } from '@/lib/beneficiary-store'
import { ASNAF_META } from '@/types'
import type { AsnafCategory } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const all = await getAllBeneficiaries()
  return NextResponse.json(all)
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  // seed action
  if (body.action === 'seed') {
    const seeded = await seedBeneficiaries()
    return NextResponse.json({ seeded })
  }

  const { name, asnaf_category, ic_ref, phone, email, jurisdiction_code, case_ref, notes } = body
  if (!name?.trim() || !asnaf_category) {
    return NextResponse.json({ error: 'name and asnaf_category are required' }, { status: 400 })
  }
  if (!ASNAF_META[asnaf_category as AsnafCategory]) {
    return NextResponse.json({ error: 'Invalid asnaf_category' }, { status: 400 })
  }

  const b = await createBeneficiary({
    name: name.trim(),
    asnaf_category: asnaf_category as AsnafCategory,
    zakat_eligible: ASNAF_META[asnaf_category as AsnafCategory].zakat,
    ic_ref: ic_ref?.trim() || undefined,
    phone: phone?.trim() || undefined,
    email: email?.trim() || undefined,
    jurisdiction_code: jurisdiction_code?.trim() || undefined,
    case_ref: case_ref?.trim() || undefined,
    notes: notes?.trim() || undefined,
    status: 'active',
  })
  return NextResponse.json(b)
}
