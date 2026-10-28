import { NextRequest, NextResponse } from 'next/server'
import { getOrder, saveOrder } from '@/lib/order-store'
import { db } from '@/lib/db'
import type { CouponInsert } from '@/lib/db/types'

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amount / 100)
}

function generateToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let token = ''
  for (let i = 0; i < 12; i++) {
    if (i === 4 || i === 8) token += '-'
    token += chars[Math.floor(Math.random() * chars.length)]
  }
  return token
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  const { reference } = await params
  const order = await getOrder(reference)
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (order.status !== 'pending_verification') {
    return NextResponse.json({ error: 'Order is not awaiting verification' }, { status: 400 })
  }

  const updated = { ...order, status: 'verified' as const, verified_at: new Date().toISOString() }
  await saveOrder(updated)

  // Generate tokens and create coupons now that payment is confirmed
  const tokens: string[] = []
  for (let i = 0; i < order.quantity; i++) tokens.push(generateToken())

  try {
    const campaign = await db.getCampaign(order.campaign_id)
    if (campaign) {
      const inserts: CouponInsert[] = tokens.map((token, i) => ({
        token,
        serial_number: `${order.reference}-${String(i + 1).padStart(2, '0')}`,
        campaign_id: order.campaign_id,
        buyer_name: order.buyer_name,
        buyer_email: order.buyer_email,
        stripe_session_id: order.reference,
        status: 'active' as const,
      }))
      await db.createCoupons(inserts, campaign)
      await db.updateCampaignSoldCount(order.campaign_id, order.quantity)
    }
  } catch (e) {
    console.error('Failed to create coupons after verification:', e)
  }

  // Send voucher email to buyer
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'

  if (RESEND_API_KEY && !RESEND_API_KEY.includes('REPLACE_ME') && RESEND_API_KEY.length > 10) {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mosque-os-ai.vercel.app'
      const voucherLinks = tokens
        .map((t, i) => `<div style="margin:12px 0;padding:16px;background:#F0F7F3;border-radius:12px;border:1px solid #1A3D2B20;">
          <p style="margin:0 0 4px;font-size:12px;color:#666;">Coupon ${i + 1} of ${order.quantity}</p>
          <p style="margin:0;font-family:monospace;font-size:18px;font-weight:bold;color:#1A3D2B;letter-spacing:2px;">${t}</p>
          <p style="margin:6px 0 0;font-size:12px;color:#888;">Valid at: ${order.merchant_name}</p>
          <a href="${appUrl}/coupons/${t}" style="display:inline-block;margin-top:10px;padding:10px 20px;background:#1A3D2B;color:white;text-decoration:none;border-radius:8px;font-size:13px;font-weight:bold;">
            View coupon &amp; QR code →
          </a>
          <p style="margin:6px 0 0;font-size:11px;color:#aaa;">Show this QR at the merchant — they will scan it to redeem</p>
        </div>`)
        .join('')

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL ?? 'vouchers@imara.app',
          to: order.buyer_email,
          subject: `Your ${order.campaign_name} e-coupon from ${mosqueName}`,
          html: `
<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;">
  <div style="background:#1A3D2B;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
    <p style="color:#C9A84C;font-size:20px;font-weight:bold;margin:0 0 8px;">Imara · ${mosqueName}</p>
    <h1 style="color:white;margin:0;font-size:28px;">Your e-coupon is ready</h1>
    <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">Payment verified — show this at the outlet</p>
  </div>

  <p style="color:#333;font-size:15px;">Assalamu Alaikum ${order.buyer_name},</p>
  <p style="color:#555;font-size:14px;line-height:1.6;">
    Your payment has been verified. Here ${order.quantity > 1 ? 'are' : 'is'} your
    ${order.quantity} × <strong>${order.campaign_name}</strong> coupon${order.quantity > 1 ? 's' : ''}
    (${formatCurrency(order.unit_price, order.currency)} each).
    Show the code${order.quantity > 1 ? 's' : ''} at <strong>${order.merchant_name}</strong> to redeem.
  </p>

  ${voucherLinks}

  <div style="margin-top:20px;padding:16px;background:#FFF8EC;border-radius:12px;border-left:3px solid #C9A84C;">
    <p style="margin:0;font-size:13px;color:#666;line-height:1.6;">
      Order reference: <strong>${order.reference}</strong><br/>
      Questions? Reply to this email.
    </p>
  </div>

  <p style="margin-top:20px;font-size:12px;color:#aaa;text-align:center;">
    ${mosqueName} · Powered by Imara
  </p>
</div>`,
        }),
      })
    } catch (e) {
      console.error('Voucher email send failed:', e)
    }
  }

  return NextResponse.json({ success: true })
}
