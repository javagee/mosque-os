import { NextRequest, NextResponse } from 'next/server'
import { getSadaqahClaim, saveSadaqahClaim } from '@/lib/sadaqah-store'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const claim = await getSadaqahClaim(token.toUpperCase())
  if (!claim) return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
  if (claim.status !== 'pending') return NextResponse.json({ error: `Claim is already ${claim.status}` }, { status: 409 })

  const { redeemed_by, invoice_ref } = await req.json()
  if (!redeemed_by?.trim()) return NextResponse.json({ error: 'Outlet / merchant name required' }, { status: 400 })

  const updated = { ...claim, status: 'redeemed' as const, redeemed_at: new Date().toISOString(), redeemed_by: redeemed_by.trim(), invoice_ref: invoice_ref?.trim() || undefined }
  await saveSadaqahClaim(updated)
  return NextResponse.json(updated)
}
