import { NextRequest, NextResponse } from 'next/server'
import { getOrder, saveOrder } from '@/lib/order-store'
import { getAdminNotificationEmail } from '@/lib/settings-store'

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
  const order = await getOrder(reference)

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (order.status !== 'pending_payment') {
    return NextResponse.json({ error: 'Order already confirmed' }, { status: 400 })
  }

  const updated = { ...order, status: 'pending_verification' as const, paid_at: new Date().toISOString() }
  await saveOrder(updated)

  const BREVO_API_KEY = process.env.BREVO_API_KEY
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mosque-os-ai.vercel.app'
  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'
  const adminEmail = await getAdminNotificationEmail()

  if (BREVO_API_KEY && !BREVO_API_KEY.includes('REPLACE_ME') && BREVO_API_KEY.length > 10) {
    const sender = { name: mosqueName, email: process.env.BREVO_FROM_EMAIL ?? 'saraghazsk@gmail.com' }

    // Notify admin to verify the payment in the bank
    if (adminEmail) {
      try {
        await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender,
            to: [{ email: adminEmail }],
            subject: `[Imara] New PayNow payment — ${order.reference} · ${formatCurrency(order.total, order.currency)}`,
            htmlContent: `
<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;">
  <div style="background:#1A3D2B;border-radius:16px;padding:20px 24px;margin-bottom:20px;">
    <p style="color:#C9A84C;font-size:16px;font-weight:bold;margin:0 0 4px;">Imara · ${mosqueName}</p>
    <h1 style="color:white;margin:0;font-size:22px;">New payment to verify</h1>
  </div>

  <p style="color:#333;font-size:15px;">A buyer has submitted a PayNow payment. Please check your bank app for the transfer and verify below.</p>

  <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
    <tr><td style="padding:8px 0;color:#888;width:140px;">Reference</td><td style="padding:8px 0;font-family:monospace;font-weight:bold;font-size:16px;color:#1A3D2B;">${order.reference}</td></tr>
    <tr><td style="padding:8px 0;color:#888;">Amount</td><td style="padding:8px 0;font-weight:bold;">${formatCurrency(order.total, order.currency)}</td></tr>
    <tr><td style="padding:8px 0;color:#888;">Buyer</td><td style="padding:8px 0;">${order.buyer_name} (${order.buyer_email})</td></tr>
    <tr><td style="padding:8px 0;color:#888;">Campaign</td><td style="padding:8px 0;">${order.campaign_name} × ${order.quantity}</td></tr>
    <tr><td style="padding:8px 0;color:#888;">Merchant</td><td style="padding:8px 0;">${order.merchant_name}</td></tr>
    <tr><td style="padding:8px 0;color:#888;">Mosque portion</td><td style="padding:8px 0;">${formatCurrency(order.mosque_portion, order.currency)}</td></tr>
    <tr><td style="padding:8px 0;color:#888;">Merchant portion</td><td style="padding:8px 0;">${formatCurrency(order.merchant_portion, order.currency)}</td></tr>
  </table>

  <a href="${appUrl}/admin" style="display:inline-block;background:#1A3D2B;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:14px;">
    Go to Admin Panel →
  </a>

  <p style="margin-top:16px;font-size:12px;color:#aaa;">
    Once you confirm the PayNow transfer matches <strong>${order.reference}</strong>, click "Verify payment" in the admin panel. The buyer's e-coupon will be sent automatically.
  </p>
</div>`,
          }),
        })
      } catch (e) {
        console.error('Admin notification email failed:', e)
      }
    }

    // Acknowledge to buyer that payment is received and under review
    try {
      const buyerRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender,
          to: [{ email: order.buyer_email }],
          subject: `Payment received — ${order.campaign_name} (${order.reference})`,
          htmlContent: `
<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;">
  <div style="background:#1A3D2B;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
    <p style="color:#C9A84C;font-size:20px;font-weight:bold;margin:0 0 8px;">Imara · ${mosqueName}</p>
    <h1 style="color:white;margin:0;font-size:26px;">JazakAllah Khayran</h1>
    <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">We've received your payment</p>
  </div>

  <p style="color:#333;font-size:15px;">Assalamu Alaikum ${order.buyer_name},</p>
  <p style="color:#555;font-size:14px;line-height:1.6;">
    Thank you for purchasing <strong>${order.quantity} × ${order.campaign_name}</strong> (${formatCurrency(order.unit_price, order.currency)} each).
    Your PayNow payment of <strong>${formatCurrency(order.total, order.currency)}</strong> has been received and is being verified by the mosque team.
  </p>

  <div style="margin:20px 0;padding:16px;background:#FFF8EC;border-radius:12px;border-left:3px solid #C9A84C;">
    <p style="margin:0;font-size:14px;color:#666;line-height:1.8;">
      Order reference: <strong style="color:#1A3D2B;">${order.reference}</strong><br/>
      Once verified (usually within a few hours), your e-coupon will be sent to this email automatically.<br/>
      Questions? Reply to this email.
    </p>
  </div>

  <p style="margin-top:20px;font-size:12px;color:#aaa;text-align:center;">
    ${mosqueName} · Powered by Imara
  </p>
</div>`,
        }),
      })
      if (!buyerRes.ok) {
        const errBody = await buyerRes.text()
        console.error(`Buyer ack email FAILED for ${order.reference} → ${order.buyer_email} | HTTP ${buyerRes.status} | ${errBody}`)
      }
    } catch (e) {
      console.error('Buyer acknowledgment email failed:', e)
    }
  }

  return NextResponse.json({ success: true })
}
