# Imara — Setup Guide

## 1. Copy env file and fill in your keys

```bash
cp .env.local.example .env.local
```

Fill in:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_MOSQUE_NAME` | Your mosque's name |
| `NEXT_PUBLIC_MOSQUE_LAT/LNG` | Google Maps coordinates |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Run: `stripe listen --forward-to localhost:3000/api/stripe/webhook` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `RESEND_API_KEY` | resend.com → API Keys |

## 2. Set up Supabase database

Run the SQL in `lib/supabase-schema.sql` in your Supabase SQL editor.

## 3. Run locally

```bash
npm run dev
```

Visit:
- `/` — Homepage (donations + prayer times + chatbot)
- `/donate` — Standalone donation page
- `/display` — Full-screen prayer times for mosque TV
- `/admin` — Donation dashboard

## 4. Deploy to Vercel

```bash
npx vercel
```

Add all env variables in Vercel Dashboard → Project → Settings → Environment Variables.

Then set your live Stripe webhook endpoint to:
`https://your-domain.vercel.app/api/stripe/webhook`

## 5. Apply for Stripe nonprofit rate

Apply at stripe.com/en-gb/nonprofits — reduces fees to 0.5% + 10p per transaction.
