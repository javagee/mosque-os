import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'

const isStripeConfigured =
  !!process.env.STRIPE_SECRET_KEY &&
  !process.env.STRIPE_SECRET_KEY.includes('REPLACE_ME')

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { quantity = 1 } = await req.json()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const campaign = await db.getCampaign(id)
  if (!campaign || !campaign.active) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  if (campaign.total_coupons && campaign.coupons_sold + quantity > campaign.total_coupons) {
    return NextResponse.json({ error: 'Not enough coupons available' }, { status: 400 })
  }

  if (!isStripeConfigured) {
    return NextResponse.json({ url: `${appUrl}/donate/success?demo=true&type=coupon` })
  }

  const currencySymbol = campaign.currency === 'sgd' ? 'S$' : campaign.currency.toUpperCase()
  const priceFormatted = `${currencySymbol}${(campaign.coupon_price / 100).toFixed(0)}`

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: campaign.currency,
          product_data: {
            name: `${campaign.name} — Fundraising Coupon`,
            description: `${priceFormatted} voucher redeemable at ${campaign.merchant_name}. All proceeds support the mosque.`,
          },
          unit_amount: campaign.coupon_price,
        },
        quantity,
      },
    ],
    metadata: {
      type: 'coupon_purchase',
      campaign_id: campaign.id,
      quantity: String(quantity),
    },
    success_url: `${appUrl}/donate/success?session_id={CHECKOUT_SESSION_ID}&type=coupon`,
    cancel_url: `${appUrl}/campaigns/${id}`,
  })

  return NextResponse.json({ url: session.url })
}
