import { NextRequest, NextResponse } from 'next/server'
import { getBeneficiary, saveBeneficiary } from '@/lib/beneficiary-store'
import type { BeneficiaryStatus } from '@/types'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const b = await getBeneficiary(id)
  if (!b) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { status, notes, case_ref, jurisdiction_code } = await req.json()
  const updated = {
    ...b,
    ...(status !== undefined && { status: status as BeneficiaryStatus }),
    ...(notes !== undefined && { notes: notes?.trim() || undefined }),
    ...(case_ref !== undefined && { case_ref: case_ref?.trim() || undefined }),
    ...(jurisdiction_code !== undefined && { jurisdiction_code: jurisdiction_code?.trim() || undefined }),
    updated_at: new Date().toISOString(),
  }
  await saveBeneficiary(updated)
  return NextResponse.json(updated)
}
