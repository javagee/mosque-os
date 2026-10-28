import { NextRequest, NextResponse } from 'next/server'
import { getDonation, saveDonation } from '@/lib/donation-store'
import { getAdminNotificationEmail } from '@/lib/settings-store'

function sgd(cents: number) {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', minimumFractionDigits: 2 }).format(cents / 100)
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  const { reference } = await params
  const donation = await getDonation(reference)

  if (!donation) return NextResponse.json({ error: 'Donation not found' }, { status: 404 })
  if (donation.status !== 'pending_payment') {
    return NextResponse.json({ error: 'Donation already confirmed' }, { status: 400 })
  }

  const updated = { ...donation, status: 'pending_verification' as const, paid_at: new Date().toISOString() }
  await saveDonation(updated)

  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mosque-os-ai.vercel.app'
  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'
  const adminEmail = await getAdminNotificationEmail()

  if (RESEND_API_KEY && !RESEND_API_KEY.includes('REPLACE_ME') && RESEND_API_KEY.length > 10) {
    const from = process.env.RESEND_FROM_EMAIL ?? 'donations@imara.app'

    // Notify admin
    if (adminEmail) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from,
            to: adminEmail,
            subject: `[Imara] New donation — ${donation.reference} · ${sgd(donation.amount)}`,
            html: `
<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;">
  <div style="background:#1A3D2B;border-radius:16px;padding:20px 24px;margin-bottom:20px;">
    <p style="color:#C9A84C;font-size:16px;font-weight:bold;margin:0 0 4px;">Imara · ${mosqueName}</p>
    <h1 style="color:white;margin:0;font-size:22px;">New donation to verify</h1>
  </div>
  <p style="color:#333;font-size:15px;">A donor has submitted a PayNow donation. Please check your bank for the transfer and verify below.</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
    <tr><td style="padding:8px 0;color:#888;width:120px;">Reference</td><td style="padding:8px 0;font-family:monospace;font-weight:bold;font-size:16px;color:#1A3D2B;">${donation.reference}</td></tr>
    <tr><td style="padding:8px 0;color:#888;">Amount</td><td style="padding:8px 0;font-weight:bold;">${sgd(donation.amount)}</td></tr>
    <tr><td style="padding:8px 0;color:#888;">Donor</td><td style="padding:8px 0;">${donation.donor_name} (${donation.donor_email})</td></tr>
    <tr><td style="padding:8px 0;color:#888;">Category</td><td style="padding:8px 0;">${donation.category}</td></tr>
    <tr><td style="padding:8px 0;color:#888;">Type</td><td style="padding:8px 0;">${donation.type}</td></tr>
  </table>
  <a href="${appUrl}/admin" style="display:inline-block;background:#1A3D2B;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:14px;">
    Go to Admin Panel →
  </a>
</div>`,
          }),
        })
      } catch (e) {
        console.error('Admin donation notification failed:', e)
      }
    }

    // Acknowledge donor
    try {
      const donorAckRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to: donation.donor_email,
          subject: `Donation received — ${donation.reference}`,
          html: `
<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;">
  <div style="background:#1A3D2B;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
    <p style="color:#C9A84C;font-size:20px;font-weight:bold;margin:0 0 8px;">Imara · ${mosqueName}</p>
    <h1 style="color:white;margin:0;font-size:26px;">JazakAllah Khayran</h1>
    <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">Your donation is being verified</p>
  </div>
  <p style="color:#333;font-size:15px;">Assalamu Alaikum ${donation.donor_name},</p>
  <p style="color:#555;font-size:14px;line-height:1.6;">
    Your PayNow donation of <strong>${sgd(donation.amount)}</strong> to ${mosqueName} has been received and is being verified by the mosque team.
  </p>
  <div style="margin:20px 0;padding:16px;background:#FFF8EC;border-radius:12px;border-left:3px solid #C9A84C;">
    <p style="margin:0;font-size:14px;color:#666;line-height:1.8;">
      Reference: <strong style="color:#1A3D2B;">${donation.reference}</strong><br/>
      You will receive a confirmation email once the mosque team has verified your transfer.
    </p>
  </div>
  <p style="margin-top:20px;font-size:12px;color:#aaa;text-align:center;">${mosqueName} · Powered by Imara</p>
</div>`,
        }),
      })
      if (!donorAckRes.ok) {
        const errBody = await donorAckRes.text()
        console.error(`Donor ack email FAILED for ${donation.reference} → ${donation.donor_email} | HTTP ${donorAckRes.status} | ${errBody}`)
      } else {
        console.log(`Donor ack email sent for ${donation.reference} → ${donation.donor_email}`)
      }
    } catch (e) {
      console.error('Donor acknowledgment email failed:', e)
    }
  }

  return NextResponse.json({ success: true })
}
