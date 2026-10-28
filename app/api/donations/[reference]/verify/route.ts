import { NextRequest, NextResponse } from 'next/server'
import { getDonation, saveDonation } from '@/lib/donation-store'
import { db } from '@/lib/db'
import type { DonorInsert } from '@/lib/db/types'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  const { reference } = await params
  const donation = await getDonation(reference)

  if (!donation) return NextResponse.json({ error: 'Donation not found' }, { status: 404 })
  if (donation.status !== 'pending_verification') {
    return NextResponse.json({ error: 'Donation not awaiting verification' }, { status: 400 })
  }

  // Record in the main donor DB so it appears in admin and finance dashboards
  const donorInsert: DonorInsert = {
    name: donation.donor_name,
    email: donation.donor_email,
    amount: donation.amount,
    currency: donation.currency,
    category: donation.category,
    type: donation.type,
    stripe_session_id: donation.reference,
  }
  await db.createDonor(donorInsert)

  const updated = { ...donation, status: 'verified' as const, verified_at: new Date().toISOString() }
  await saveDonation(updated)

  return NextResponse.json({ success: true })
}
