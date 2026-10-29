import { NextRequest, NextResponse } from 'next/server'
import { getOrder } from '@/lib/order-store'

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amount / 100)
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  const { reference } = await params
  let order = await getOrder(reference)
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (order.status !== 'verified') {
    return NextResponse.json({ error: 'Order is not yet verified — verify payment first' }, { status: 400 })
  }
  if (!order.coupon_tokens || order.coupon_tokens.length === 0) {
    // Fallback: scan campaign token list to recover tokens for pre-fix orders (e.g. IMA-AC5NKD)
    try {
      const { Redis } = await import('@upstash/redis')
      const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! })
      const campaignTokens = await redis.lrange<string>(`campaign:${order.campaign_id}:coupon_tokens`, 0, -1)
      const recovered: string[] = []
      for (const t of campaignTokens) {
        const coupon = await redis.get<{ stripe_session_id?: string }>(`coupon:${t}`)
        if (coupon?.stripe_session_id === reference) recovered.push(t)
      }
      if (recovered.length > 0) {
        const { saveOrder } = await import('@/lib/order-store')
        await saveOrder({ ...order, coupon_tokens: recovered })
        order = { ...order, coupon_tokens: recovered }
      }
    } catch { /* Redis unavailable — fall through to error */ }

    if (!order.coupon_tokens || order.coupon_tokens.length === 0) {
      return NextResponse.json({ error: 'No coupon tokens found on this order. This order may have been verified before token tracking was added. Contact support.' }, { status: 404 })
    }
  }

  const BREVO_API_KEY = process.env.BREVO_API_KEY
  if (!BREVO_API_KEY || BREVO_API_KEY.includes('REPLACE_ME') || BREVO_API_KEY.length <= 10) {
    return NextResponse.json({ error: 'Email not configured' }, { status: 500 })
  }

  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mosque-os-ai.vercel.app'
  const sender = { name: mosqueName, email: process.env.BREVO_FROM_EMAIL ?? 'saraghazsk@gmail.com' }
  const tokens = order.coupon_tokens

  const voucherLinks = tokens
    .map((t, i) => `<div style="margin:12px 0;padding:16px;background:#F0F7F3;border-radius:12px;border:1px solid #1A3D2B20;">
      <p style="margin:0 0 4px;font-size:12px;color:#666;">Coupon ${i + 1} of ${tokens.length}</p>
      <p style="margin:0;font-family:monospace;font-size:18px;font-weight:bold;color:#1A3D2B;letter-spacing:2px;">${t}</p>
      <p style="margin:6px 0 0;font-size:12px;color:#888;">Valid at: ${order.merchant_name}</p>
      <a href="${appUrl}/coupons/${t}" style="display:inline-block;margin-top:10px;padding:10px 20px;background:#1A3D2B;color:white;text-decoration:none;border-radius:8px;font-size:13px;font-weight:bold;">
        View coupon &amp; QR code →
      </a>
      <p style="margin:6px 0 0;font-size:11px;color:#aaa;">Show this QR at the merchant — they will scan it to redeem</p>
    </div>`)
    .join('')

  const emailRes = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender,
      to: [{ email: order.buyer_email }],
      subject: `[Resent] Your ${order.campaign_name} e-coupon from ${mosqueName}`,
      htmlContent: `
<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;">
  <div style="background:#1A3D2B;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
    <p style="color:#C9A84C;font-size:20px;font-weight:bold;margin:0 0 8px;">Imara · ${mosqueName}</p>
    <h1 style="color:white;margin:0;font-size:28px;">Your e-coupon is ready</h1>
    <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">Resent by admin — payment already verified</p>
  </div>

  <p style="color:#333;font-size:15px;">Assalamu Alaikum ${order.buyer_name},</p>
  <p style="color:#555;font-size:14px;line-height:1.6;">
    Here ${tokens.length > 1 ? 'are' : 'is'} your
    ${tokens.length} × <strong>${order.campaign_name}</strong> coupon${tokens.length > 1 ? 's' : ''}
    (${formatCurrency(order.unit_price, order.currency)} each).
    Show the code${tokens.length > 1 ? 's' : ''} at <strong>${order.merchant_name}</strong> to redeem.
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

  if (!emailRes.ok) {
    const errBody = await emailRes.text()
    console.error(`Resend coupon FAILED for ${reference} → ${order.buyer_email} | HTTP ${emailRes.status} | ${errBody}`)
    return NextResponse.json({ error: `Email delivery failed: ${errBody}` }, { status: 502 })
  }

  console.log(`Coupon resent for ${reference} → ${order.buyer_email}`)
  return NextResponse.json({ success: true, to: order.buyer_email, coupons: tokens.length })
}
