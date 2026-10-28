# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Imara** (إِمَارَة — "developing, building and flourishing") is an open-source mosque management platform for Singapore mosques. Core features: prayer times display, fundraising voucher campaigns with PayNow payment, Islamic direct donations (Stripe optional), AI chatbot, merchant redemption portal, and admin/settlement back-office.

**Production:** `mosque-os-ai.vercel.app`  
**Deploy:** `git push` to `main` — Vercel auto-deploys via GitHub integration. Never use `vercel --prod`.  
**Vercel CLI** is for troubleshooting only (`vercel logs`, `vercel env`).

## Commands

```bash
npm run dev        # dev server at localhost:3000
npm run build      # production build — always run before pushing to catch errors
npx tsc --noEmit   # type-check only (no emit)
npm run lint       # ESLint

# Local services (dev only)
npx supabase start                  # start local Supabase (Postgres)
npx supabase stop                   # stop local Supabase
npx tsx scripts/seed-upstash.ts     # seed 8 campaigns into Upstash Redis

# PayNow testing
# Webhook forwarding (Stripe alternative path, optional)
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

No test suite exists.

## Architecture

Next.js 16.4.2 App Router. Tailwind CSS v4. shadcn/ui in `components/ui/`.

### Data Provider Abstraction — the central pattern

`lib/db/index.ts` exports a single `db` singleton implementing `DbProvider` (`lib/db/types.ts`). Provider is selected at startup from `DATA_PROVIDER` env var:

| `DATA_PROVIDER` | Provider | Backing store |
|---|---|---|
| `upstash` | `UpstashProvider` | Upstash Redis (Vercel production) |
| `supabase` | `SupabaseProvider` | Postgres via Supabase (local dev) |
| *(fallback)* | `DemoProvider` | In-memory hardcoded data, resets on restart |

**Never import a provider directly.** All pages and routes use `import { db } from '@/lib/db'`.

`DbProvider` interface covers: campaigns (CRUD), coupons (create/redeem/query), donors, settlement (`getRedeemedCoupons`, `markCouponsSettled`).

**Upstash key schema:**
```
campaign:{id}                    → Campaign JSON
campaigns:active                 → Set of active campaign IDs
coupon:{token}                   → Coupon JSON (with embedded campaign snapshot)
campaign:{id}:coupon_tokens      → List of all token strings for a campaign
campaign:{id}:coupons_redeemed   → INCR integer counter
coupons:redeemed                 → Set of all redeemed coupon tokens (settlement index)
donor:{id}                       → Donor JSON
donors:all                       → List of donor IDs (newest first)
order:{reference}                → Order JSON
orders:all                       → Set of all order references
orders:pending_verification      → Set of references awaiting admin bank check
```

### Order Store (`lib/order-store.ts`)

Separate from `DbProvider`. Stores PayNow `Order` objects. Uses Upstash Redis when credentials present, otherwise an in-memory `Map` (local dev with `DATA_PROVIDER=supabase`). Orders are never stored in Supabase.

### PayNow Voucher Flow — primary payment path

Singapore static QR, zero gateway fees, trust-based confirmation:

```
/campaigns/[id]/checkout  (name + email + quantity)
        ↓ POST /api/orders
/pay/[reference]          (static PayNow QR, 15-min countdown, copy-to-clipboard UEN + ref)
        ↓ buyer pays bank app, clicks "I've completed payment"
POST /api/orders/[reference]/confirm
  → order: pending_payment → pending_verification
  → db.createCoupons() stores voucher tokens in DB (scannable at /merchant/redeem)
  → db.updateCampaignSoldCount()
  → Resend email with voucher tokens to buyer
        ↓ admin checks bank, clicks "Verify payment" in /admin
POST /api/orders/[reference]/verify
  → order: pending_verification → verified
```

Env vars needed: `PAYNOW_UEN` (mosque UEN), `PAYNOW_QR_URL` (URL to static QR image).  
Split is hardcoded 50/50: `mosque_portion = Math.floor(total * 0.5)`.

### Settlement Flow

Settlement is based on **redeemed coupons** (service delivered), not orders (purchase made):

1. Customer redeems at merchant via `/merchant/redeem` → `db.redeemCoupon()` Lua script atomically sets status, increments counter, adds token to `coupons:redeemed` Set
2. `/admin/settlements` calls `db.getRedeemedCoupons()`, groups by `coupon.campaign.merchant_name`
3. Admin transfers S$X to merchant via PayNow, clicks "Mark settled"
4. `POST /api/settlements` → `db.markCouponsSettled(tokens)` sets `merchant_settled: true` + timestamp on each coupon

### AI Chat Priority Chain (`app/api/chat/route.ts`)

Ollama (local, `OLLAMA_ENABLED=true`) → Gemini (`GEMINI_API_KEY`, `gemini-2.5-flash` SSE) → Claude (`ANTHROPIC_API_KEY`, `claude-sonnet-4-6`) → Demo (canned response).

All three providers return a `ReadableStream` with `Content-Type: text/plain`. `ChatWidget.tsx` reads chunks and appends to the last message in state. Typing dots shown immediately by inserting `{ role: 'assistant', content: '' }` before the fetch resolves.

### Stripe (optional alternative payment path)

`lib/stripe.ts` exports a Proxy-based singleton — never throws at module load time even when `STRIPE_SECRET_KEY` is absent. `DonationForm` → `POST /api/stripe/checkout` → Stripe hosted page → `POST /api/stripe/webhook` (creates DB record, sends email). Coupon purchases via Stripe use `session.metadata.type = 'coupon_purchase'`.

### Pages Quick Reference

| Route | Key behaviour |
|---|---|
| `/` | Homepage: prayer widget, donation form, floating ChatWidget |
| `/display` | Full-screen kiosk for mosque TV; nav overlay top-right |
| `/campaigns` | Grid/list toggle (grid default); `CampaignsList` client component |
| `/campaigns/[id]` | Campaign detail + `CampaignPurchaseForm` (routes to checkout) |
| `/campaigns/[id]/checkout` | Buyer form; `POST /api/orders` → redirect to `/pay/[reference]` |
| `/pay/[reference]` | PayNow QR page; `PayNowPayment` client component with countdown |
| `/donate/success` | Post-payment confirmation; `?type=coupon&demo=true` param variants |
| `/coupons/[token]` | Voucher QR display for buyer |
| `/merchant/redeem` | Merchant portal: token lookup + redeem button |
| `/admin` | Donations overview + amber panel for pending PayNow verifications |
| `/admin/settlements` | Settlement report grouped by merchant; "Mark settled" per merchant |

### Important Patterns

**`export const dynamic = 'force-dynamic'`** — required on every server page that reads DB or env vars at request time. Omitting it causes stale static renders.

**`lib/supabase.ts`** — `getSupabase()` and `getSupabaseAdmin()` both return `null` when env vars are absent. Every caller must null-check before use.

**Coupon serial numbers** use format `{ORDER_REFERENCE}-{nn}` (e.g., `IMA-X7K2P9-01`).

**`force-dynamic` + Upstash** — the `getRedis()` helper in `UpstashProvider` creates a new Redis client per call (stateless, safe for serverless). Don't cache it as a module-level singleton.

**Settlement vs orders** — settlement reads `coupons:redeemed` (actual service delivered). Never use the orders store for settlement calculations.

## Environment Variables

| Variable | Purpose | Required for |
|---|---|---|
| `NEXT_PUBLIC_MOSQUE_NAME/LAT/LNG/CITY` | Identity + prayer times | Always |
| `NEXT_PUBLIC_APP_URL` | Email links, chat system prompt | Always |
| `DATA_PROVIDER` | `supabase` or `upstash` | Always |
| `UPSTASH_REDIS_REST_URL/TOKEN` | Upstash DB | Production (Vercel) |
| `NEXT_PUBLIC_SUPABASE_URL` + anon/service keys | Supabase DB | Local dev |
| `PAYNOW_UEN` | Mosque UEN for PayNow display | Payment |
| `PAYNOW_QR_URL` | Static PayNow QR image URL | Payment display |
| `GEMINI_API_KEY` | Gemini chat (Vercel, no Ollama) | AI chat |
| `OLLAMA_ENABLED/URL/MODEL` | Local Ollama LLM | AI chat (local) |
| `ANTHROPIC_API_KEY` | Claude API fallback | AI chat |
| `RESEND_API_KEY` + `RESEND_FROM_EMAIL` | Voucher email delivery | Email |
| `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` | Stripe donations | Stripe path only |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client | Stripe path only |
