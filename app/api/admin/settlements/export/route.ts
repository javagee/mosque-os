import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

function esc(v: string | number | undefined | null) {
  const s = String(v ?? '')
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET() {
  const coupons = await db.getRedeemedCoupons()

  const headers = [
    'Serial Number',
    'Token',
    'Campaign',
    'Merchant',
    'Buyer Name',
    'Buyer Email',
    'Voucher Value (SGD)',
    'Merchant Share (SGD)',
    'Mosque Share (SGD)',
    'Redeemed At',
    'Settlement Status',
    'Settled At',
  ]

  const rows = coupons.map(c => {
    const price = c.campaign?.coupon_price ?? 0
    const merchantShare = Math.floor(price / 2) / 100
    const mosqueShare = (price - Math.floor(price / 2)) / 100
    return [
      c.serial_number,
      c.token,
      c.campaign?.name ?? '',
      c.campaign?.merchant_name ?? '',
      c.buyer_name,
      c.buyer_email,
      (price / 100).toFixed(2),
      merchantShare.toFixed(2),
      mosqueShare.toFixed(2),
      c.redeemed_at ? new Date(c.redeemed_at).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' }) : '',
      c.merchant_settled ? 'Settled' : 'Pending',
      c.merchant_settled_at ? new Date(c.merchant_settled_at).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' }) : '',
    ].map(esc).join(',')
  })

  const csv = [headers.join(','), ...rows].join('\r\n')
  const date = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="settlements-${date}.csv"`,
    },
  })
}
