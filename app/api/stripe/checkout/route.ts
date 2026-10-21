import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { DONATION_CATEGORIES, type DonationCategory, type DonationType } from '@/types'

const isStripeConfigured =
  !!process.env.STRIPE_SECRET_KEY &&
  !process.env.STRIPE_SECRET_KEY.includes('REPLACE_ME')

export async function POST(req: NextRequest) {
  const { amount, category, type } = await req.json() as {
    amount: number
    category: DonationCategory
    type: DonationType
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // Demo mode — bypass Stripe and go straight to success page
  if (!isStripeConfigured) {
    return NextResponse.json({ url: `${appUrl}/donate/success?demo=true` })
  }
  const cat = DONATION_CATEGORIES[category]
  const amountInPence = Math.round(amount * 100)

  if (type === 'monthly') {
    // Recurring — create a subscription via Stripe
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `${cat.label} — Monthly Giving`,
              description: cat.description,
              metadata: { category },
            },
            unit_amount: amountInPence,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      metadata: { category, type },
      success_url: `${appUrl}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/donate`,
    })
    return NextResponse.json({ url: session.url })
  }

  // One-time payment
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `${cat.label} Donation`,
            description: cat.description,
            metadata: { category },
          },
          unit_amount: amountInPence,
        },
        quantity: 1,
      },
    ],
    metadata: { category, type },
    success_url: `${appUrl}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/donate`,
  })

  return NextResponse.json({ url: session.url })
}
