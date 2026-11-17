import { NextRequest, NextResponse } from 'next/server'
import { getQurbaniOrder } from '@/lib/qurbani-store'

export const dynamic = 'force-dynamic'

function fmt(amount: number, currency: string) {
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount / 100) }
  catch { return `${currency} ${(amount / 100).toFixed(0)}` }
}

const STATUS_LABEL: Record<string, { subject: string; headline: string; body: string; arabic: string }> = {
  slaughtered: {
    subject: 'Your Qurbani has been performed',
    headline: 'Qurbani Performed ✓',
    body: 'Your Qurbani animal has been slaughtered according to Islamic rites. The meat distribution is in progress.',
    arabic: 'تَمَّ الذَّبْح',
  },
  distributed: {
    subject: 'Your Qurbani is complete — meat has been distributed',
    headline: 'Qurbani Complete ✓',
    body: 'Your Qurbani is complete. The meat has been distributed to the beneficiaries in accordance with your niyyah. May Allah accept your sacrifice.',
    arabic: 'تَمَّ التَّوْزِيع',
  },
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getQurbaniOrder(id)
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const BREVO_API_KEY = process.env.BREVO_API_KEY
  if (!BREVO_API_KEY || BREVO_API_KEY.length < 10) {
    return NextResponse.json({ error: 'Email not configured' }, { status: 503 })
  }

  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Imara'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mosque-os-ai.vercel.app'
  const fromEmail = process.env.BREVO_FROM_EMAIL ?? 'noreply@mosque-os-ai.vercel.app'

  const tpl = STATUS_LABEL[order.status] ?? {
    subject: `Qurbani order update — ${order.order_reference}`,
    headline: `Order Status: ${order.status}`,
    body: `Your Qurbani order ${order.order_reference} has been updated to: ${order.status}.`,
    arabic: '',
  }

  const niyyahLine = order.niyyah === 'deceased'
    ? `Niyyah: On behalf of the late <strong>${order.niyyah_name}</strong> — may Allah grant them His mercy.`
    : order.niyyah_name
      ? `Niyyah: <strong>${order.niyyah_name}</strong>`
      : `Niyyah: ${order.niyyah}`

  const html = `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
  <div style="background:#1A3D2B;border-radius:16px;padding:28px 24px;text-align:center;margin-bottom:24px;">
    <p style="color:#C9A84C;font-size:13px;font-weight:bold;margin:0 0 6px;letter-spacing:1px;">${mosqueName}</p>
    <h1 style="color:white;margin:0;font-size:26px;">${tpl.headline}</h1>
    ${tpl.arabic ? `<p style="color:rgba(255,255,255,0.5);margin:8px 0 0;font-size:18px;">${tpl.arabic}</p>` : ''}
  </div>

  <p style="color:#333;font-size:15px;margin:0 0 8px;">Assalamu Alaikum <strong>${order.donor_name}</strong>,</p>
  <p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 20px;">${tpl.body}</p>

  <div style="background:#F0F4F3;border-radius:12px;padding:20px;margin-bottom:20px;">
    <table style="width:100%;font-size:13px;color:#444;border-collapse:collapse;">
      <tr><td style="padding:4px 0;color:#888;width:120px;">Order Reference</td><td style="font-family:monospace;font-weight:bold;color:#1A3D2B;">${order.order_reference}</td></tr>
      <tr><td style="padding:4px 0;color:#888;">Animal</td><td>${order.animal_label}</td></tr>
      <tr><td style="padding:4px 0;color:#888;">Amount Paid</td><td style="font-weight:bold;">${fmt(order.amount, order.currency)}</td></tr>
      <tr><td style="padding:4px 0;color:#888;">Niyyah</td><td>${niyyahLine}</td></tr>
      ${order.slaughter_date ? `<tr><td style="padding:4px 0;color:#888;">Slaughter Date</td><td>${order.slaughter_date}</td></tr>` : ''}
      ${order.slaughter_location ? `<tr><td style="padding:4px 0;color:#888;">Location</td><td>${order.slaughter_location}</td></tr>` : ''}
      ${order.halal_cert_ref ? `<tr><td style="padding:4px 0;color:#888;">Halal Cert</td><td style="font-family:monospace;">${order.halal_cert_ref}</td></tr>` : ''}
    </table>
  </div>

  ${order.fulfilment_note ? `<p style="color:#555;font-size:13px;line-height:1.6;border-left:3px solid #C9A84C;padding-left:12px;margin:0 0 20px;">${order.fulfilment_note}</p>` : ''}

  <p style="color:#888;font-size:12px;line-height:1.6;margin:0 0 20px;">
    Jazakallah Khayran for your contribution. May Allah (SWT) accept your Qurbani and reward you and your family abundantly.
  </p>

  <div style="text-align:center;margin:24px 0;">
    <a href="${appUrl}/orders" style="display:inline-block;padding:12px 28px;background:#1A3D2B;color:white;text-decoration:none;border-radius:10px;font-size:14px;font-weight:bold;">
      View Order Status →
    </a>
  </div>

  <p style="color:#ccc;font-size:11px;text-align:center;margin:0;">
    ${mosqueName} · ${appUrl}
  </p>
</div>`

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: { name: mosqueName, email: fromEmail },
      to: [{ email: order.donor_email, name: order.donor_name }],
      subject: `${tpl.subject} — ${order.order_reference}`,
      htmlContent: html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: 'Brevo error', detail: err }, { status: 502 })
  }

  return NextResponse.json({ sent: true, to: order.donor_email, status: order.status })
}
