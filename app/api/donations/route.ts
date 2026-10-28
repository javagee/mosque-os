import { NextRequest, NextResponse } from 'next/server'
import { saveDonation, type PendingDonation } from '@/lib/donation-store'

function generateReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let ref = 'DON-'
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)]
  return ref
}

export async function POST(req: NextRequest) {
  const { donor_name, donor_email, amount, category, type } = await req.json()

  if (!donor_name || !donor_email || !amount || !category || !type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (amount < 1) {
    return NextResponse.json({ error: 'Minimum donation is S$1' }, { status: 400 })
  }

  const donation: PendingDonation = {
    reference: generateReference(),
    donor_name: donor_name.trim(),
    donor_email: donor_email.trim().toLowerCase(),
    amount: Math.round(amount * 100),   // store in cents
    currency: 'SGD',
    category,
    type,
    status: 'pending_payment',
    created_at: new Date().toISOString(),
  }

  await saveDonation(donation)

  return NextResponse.json({ reference: donation.reference })
}
