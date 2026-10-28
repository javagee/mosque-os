import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminNotificationEmail } from '@/lib/settings-store'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const coupon = await db.getCouponByToken(token)
  if (!coupon) return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
  return NextResponse.json(coupon)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const { outlet } = await req.json().catch(() => ({ outlet: null }))

  const coupon = await db.getCouponByToken(token)
  if (!coupon) return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })

  if (coupon.status === 'redeemed') {
    return NextResponse.json({ error: 'Already redeemed', coupon }, { status: 409 })
  }

  const now = new Date()
  if (coupon.campaign?.redemption_end && now > new Date(coupon.campaign.redemption_end)) {
    return NextResponse.json({ error: 'Coupon has expired' }, { status: 410 })
  }
  if (coupon.campaign?.redemption_start && now < new Date(coupon.campaign.redemption_start)) {
    return NextResponse.json({ error: 'Coupon redemption period has not started yet' }, { status: 400 })
  }

  const updated = await db.redeemCoupon(token, outlet ?? null)
  if (!updated) {
    return NextResponse.json({ error: 'Redemption failed — coupon may have already been used' }, { status: 409 })
  }

  // Notify admin that a coupon was redeemed
  const BREVO_API_KEY = process.env.BREVO_API_KEY
  if (BREVO_API_KEY && !BREVO_API_KEY.includes('REPLACE_ME') && BREVO_API_KEY.length > 10) {
    const adminEmail = await getAdminNotificationEmail()
    if (adminEmail) {
      const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'
      const sender = { name: mosqueName, email: process.env.BREVO_FROM_EMAIL ?? 'saraghazsk@gmail.com' }
      const campaign = coupon.campaign
      const value = campaign
        ? new Intl.NumberFormat('en-SG', { style: 'currency', currency: campaign.currency.toUpperCase(), minimumFractionDigits: 0 }).format(campaign.coupon_price / 100)
        : '—'
      fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender,
          to: [{ email: adminEmail }],
          subject: `[Imara] Coupon redeemed · ${campaign?.merchant_name ?? 'Merchant'} · ${value}`,
          htmlContent: `
<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;">
  <div style="background:#1A3D2B;border-radius:16px;padding:20px 24px;margin-bottom:20px;">
    <p style="color:#C9A84C;font-size:16px;font-weight:bold;margin:0 0 4px;">Imara · ${mosqueName}</p>
    <h1 style="color:white;margin:0;font-size:22px;">Coupon redeemed</h1>
  </div>
  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <tr><td style="padding:8px 0;color:#888;width:140px;">Coupon token</td><td style="padding:8px 0;font-family:monospace;font-weight:bold;color:#1A3D2B;">${token}</td></tr>
    <tr><td style="padding:8px 0;color:#888;">Campaign</td><td style="padding:8px 0;">${campaign?.name ?? '—'}</td></tr>
    <tr><td style="padding:8px 0;color:#888;">Value</td><td style="padding:8px 0;font-weight:bold;">${value}</td></tr>
    <tr><td style="padding:8px 0;color:#888;">Merchant</td><td style="padding:8px 0;">${campaign?.merchant_name ?? '—'}</td></tr>
    ${outlet ? `<tr><td style="padding:8px 0;color:#888;">Outlet</td><td style="padding:8px 0;">${outlet}</td></tr>` : ''}
    <tr><td style="padding:8px 0;color:#888;">Buyer</td><td style="padding:8px 0;">${coupon.buyer_name} (${coupon.buyer_email})</td></tr>
    <tr><td style="padding:8px 0;color:#888;">Redeemed at</td><td style="padding:8px 0;">${new Date().toLocaleString('en-SG', { timeZone: 'Asia/Singapore', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td></tr>
  </table>
  <p style="margin-top:16px;font-size:12px;color:#aaa;">This coupon is now eligible for settlement. Go to /admin/settlements to process merchant payout.</p>
</div>`,
        }),
      }).catch(e => console.error('Admin redemption notification failed:', e))
    }
  }

  return NextResponse.json({ success: true, coupon: updated })
}
