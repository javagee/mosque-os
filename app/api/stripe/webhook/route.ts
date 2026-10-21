import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { Resend } from 'resend'
import type Stripe from 'stripe'

const getResend = () => new Resend(process.env.RESEND_API_KEY ?? 'RESEND_NOT_SET')

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.metadata?.type === 'coupon_purchase') {
      await handleCouponPurchase(session)
    } else {
      await handleDonation(session)
    }
  }

  return NextResponse.json({ received: true })
}

async function handleDonation(session: Stripe.Checkout.Session) {
  const name = session.customer_details?.name ?? 'Anonymous'
  const email = session.customer_details?.email ?? ''
  const category = session.metadata?.category ?? 'general'
  const type = session.metadata?.type ?? 'one-time'
  const amount = session.amount_total ?? 0

  await db.createDonor({
    name,
    email,
    amount,
    currency: session.currency ?? 'gbp',
    category,
    type,
    stripe_session_id: session.id,
    stripe_customer_id: session.customer as string | null,
    stripe_subscription_id: session.subscription as string | null,
  })

  if (email) {
    const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'the mosque'
    const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1)
    await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'donations@imara.app',
      to: email,
      subject: `JazakAllah Khayran — your ${categoryLabel} donation`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;color:#111827;">
          <div style="background:#1A3D2B;padding:24px;border-radius:12px;text-align:center;margin-bottom:24px;">
            <h1 style="color:white;font-size:24px;margin:0;">Imara</h1>
            <p style="color:#C9A84C;margin:4px 0 0;font-size:14px;">Developing, building and flourishing</p>
          </div>
          <p>Assalamu Alaikum ${name},</p>
          <p>JazakAllah Khayran for your generous ${categoryLabel} donation of <strong>£${(amount / 100).toFixed(2)}</strong> to ${mosqueName}.</p>
          <p>May Allah accept your contribution and reward you abundantly.</p>
          <div style="background:#E8F0EC;border-radius:8px;padding:16px;margin:24px 0;">
            <p style="margin:0;font-size:14px;color:#1A3D2B;font-style:italic;text-align:center;">
              "The example of those who spend their wealth in the way of Allah is like a seed that grows seven ears, each bearing a hundred seeds." — Quran 2:261
            </p>
          </div>
          <p style="font-size:14px;color:#6B7280;">Your donation receipt is available in your Stripe account.</p>
          <p>Wassalamu Alaikum wa Rahmatullahi wa Barakatuh</p>
        </div>
      `,
    })
  }
}

async function handleCouponPurchase(session: Stripe.Checkout.Session) {
  const campaignId = session.metadata?.campaign_id
  const quantity = parseInt(session.metadata?.quantity ?? '1', 10)
  const buyerName = session.customer_details?.name ?? 'Anonymous'
  const buyerEmail = session.customer_details?.email ?? ''
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (!campaignId) return

  const campaign = await db.getCampaign(campaignId)
  if (!campaign) return

  const baseCount = await db.countCouponsForCampaign(campaignId)

  const couponsToCreate = Array.from({ length: quantity }, (_, i) => ({
    token: crypto.randomUUID(),
    campaign_id: campaignId,
    buyer_name: buyerName,
    buyer_email: buyerEmail,
    stripe_session_id: session.id,
    serial_number: String(baseCount + i + 1).padStart(5, '0'),
    status: 'active' as const,
  }))

  const insertedCoupons = await db.createCoupons(couponsToCreate, campaign)
  await db.updateCampaignSoldCount(campaignId, quantity)

  if (buyerEmail && insertedCoupons.length) {
    const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'the mosque'
    const couponLinks = insertedCoupons
      .map(
        (c) => `<li style="margin-bottom:8px;">
          <a href="${appUrl}/coupons/${c.token}" style="color:#1A3D2B;font-weight:bold;">
            Coupon S/N: ${c.serial_number}
          </a>
        </li>`
      )
      .join('')

    const expiryNote = campaign.redemption_end
      ? `<p style="font-size:14px;color:#6B7280;">Valid until: <strong>${new Date(campaign.redemption_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></p>`
      : ''

    await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'donations@imara.app',
      to: buyerEmail,
      subject: `Your ${campaign.name} coupon(s) — JazakAllah Khayran`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;color:#111827;">
          <div style="background:#1A3D2B;padding:24px;border-radius:12px;text-align:center;margin-bottom:24px;">
            <h1 style="color:white;font-size:24px;margin:0;">Imara</h1>
            <p style="color:#C9A84C;margin:4px 0 0;font-size:14px;">Developing, building and flourishing</p>
          </div>
          <p>Assalamu Alaikum ${buyerName},</p>
          <p>JazakAllah Khayran for supporting ${mosqueName} through the <strong>${campaign.name}</strong>. Your digital coupon${quantity > 1 ? 's are' : ' is'} ready:</p>
          <ul style="padding-left:20px;margin:16px 0;">${couponLinks}</ul>
          ${expiryNote}
          <p style="font-size:14px;color:#6B7280;">Show your coupon QR code at any participating ${campaign.merchant_name} outlet to redeem your meal. Uncollected coupons benefit ${mosqueName} directly.</p>
          <p>Wassalamu Alaikum wa Rahmatullahi wa Barakatuh</p>
        </div>
      `,
    })
  }
}
