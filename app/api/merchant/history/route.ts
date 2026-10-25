import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const auth = cookieStore.get('merchant_auth')
  if (!auth?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const coupons = await db.getRedeemedCoupons()

  // Filter by merchant name stored in cookie (if not "authenticated" legacy value)
  const merchantName = auth.value !== 'authenticated' ? auth.value : null
  const filtered = merchantName
    ? coupons.filter(c => c.campaign?.merchant_name === merchantName)
    : coupons

  return NextResponse.json(filtered)
}
