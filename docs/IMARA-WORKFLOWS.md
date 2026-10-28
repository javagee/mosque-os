# Imara — Key Workflows

Complete end-to-end flow diagram for all personas.

---

## MASTER FLOW DIAGRAM

```
╔══════════════════════════════════════════════════════════════════════╗
║                        IMARA PLATFORM                                ║
║              Mosque · Merchant · Buyer · Admin                       ║
╚══════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────┐
│  STEP 1 — BUYER PURCHASES E-COUPON                                  │
└─────────────────────────────────────────────────────────────────────┘

  [Buyer] opens mosque-os-ai.vercel.app
      │
      ├─→ Nav: Campaigns
      │       /campaigns — browse active fundraising campaigns
      │
      ├─→ Select campaign (e.g. "Roti Prata Combo · Springleaf · S$8")
      │       /campaigns/[id] — description, price, availability
      │
      ├─→ "Buy Voucher" → checkout form
      │       /campaigns/[id]/checkout
      │       • Full name
      │       • Email address
      │       • Quantity
      │
      ├─→ POST /api/orders
      │       → generates Order Reference: IMA-XXXXXX
      │       → order status: pending_payment
      │
      ├─→ PayNow payment page
      │       /pay/[reference]
      │       • Static QR code (scan with banking app)
      │       • UEN: 6596805367
      │       • Reference: IMA-XXXXXX (use as payment reference)
      │       • Amount: S$XX
      │       • 30-minute countdown timer
      │
      ├─→ Buyer pays via banking app (PayNow transfer)
      │
      ├─→ Clicks "I've completed payment"
      │       POST /api/orders/[ref]/confirm
      │       → order status: pending_payment → pending_verification
      │
      ├─→ Success page  /donate/success?type=coupon&ref=IMA-XXXXXX
      │       • Reference shown prominently: IMA-XXXXXX
      │       • Green "Check order status →" button
      │       • "What happens next" steps explained
      │
      ├─→ 📧 EMAIL → Buyer  "Payment received — being verified"
      │       • Order reference IMA-XXXXXX
      │       • Amount, campaign, merchant
      │       • "Usually verified within a few hours"
      │
      └─→ 📧 EMAIL → Admin  "New PayNow payment to verify"
              • Full order details
              • Direct link to /admin panel


┌─────────────────────────────────────────────────────────────────────┐
│  STEP 2 — BUYER TRACKS ORDER (while waiting)                        │
└─────────────────────────────────────────────────────────────────────┘

  [Buyer] Nav → Track Order
      │
      ├─→ /orders
      │       • Enter Order Reference: IMA-XXXXXX
      │       • Enter Email used at checkout
      │       • "Check order status →"
      │
      └─→ /orders/[reference]
              • 3-step timeline:
                  ✓ Payment initiated
                  ● Awaiting bank verification  ← amber pulse (current)
                    Verified — e-coupon sent
              • Auto-refreshes every 30 seconds
              • "Refresh now" button
              • Amber panel: "Your payment is being verified"


┌─────────────────────────────────────────────────────────────────────┐
│  STEP 3 — ADMIN VERIFIES PAYMENT & SENDS E-COUPON                  │
└─────────────────────────────────────────────────────────────────────┘

  [Admin] receives email notification
      │
      ├─→ Logs in: /admin/login
      │       • Username: admin
      │       • Password: Imara@2026
      │
      ├─→ Dashboard /admin  OR  Finance page /admin/finance
      │       • Amber panel appears: "X coupon payment awaiting verification"
      │       • Order card shows:
      │           IMA-XXXXXX  [1 coupon]
      │           Buyer Name · buyer@email.com
      │           Campaign · Merchant · Paid DD Mon HH:MM
      │           S$XX   [Verify & Send E-Coupon]
      │
      ├─→ Admin checks mosque bank app
      │       • Confirm PayNow transfer matches reference + amount
      │
      ├─→ Clicks "Verify & Send E-Coupon"
      │       POST /api/orders/[ref]/verify
      │       → order status: pending_verification → verified
      │       → coupon tokens generated: XXXX-XXXX-XXXX (one per quantity)
      │       → coupons stored in Redis: coupon:{token}
      │
      └─→ 📧 EMAIL → Buyer  "Your e-coupon is ready"
              • Coupon token(s): XXXX-XXXX-XXXX
              • "View coupon & QR code →" button per token
                → links to /coupons/[token]
              • Valid at: [Merchant Name]


┌─────────────────────────────────────────────────────────────────────┐
│  STEP 4 — BUYER RECEIVES & SHOWS E-COUPON                          │
└─────────────────────────────────────────────────────────────────────┘

  [Buyer] opens email
      │
      ├─→ Taps "View coupon & QR code →"
      │       /coupons/[token]
      │       • Large QR code displayed on screen
      │       • Token: XXXX-XXXX-XXXX
      │       • Campaign name, merchant, value
      │
      ├─→ Order tracking page also updates
      │       /orders/[reference]
      │       • Step 3 "Verified — e-coupon sent" now lit green ✓
      │
      └─→ Buyer goes to merchant outlet
              • Shows QR code on phone screen


┌─────────────────────────────────────────────────────────────────────┐
│  STEP 5 — MERCHANT REDEEMS E-COUPON                                 │
└─────────────────────────────────────────────────────────────────────┘

  [Merchant] logs into Merchant Portal
      │
      ├─→ Demo bar → 🏪 Merchant  (bypasses login for demo)
      │   OR /merchant/login → PIN → select merchant name
      │
      ├─→ /merchant/redeem  "Redeem Voucher"
      │
      ├─→ OPTION A — QR Scan (Android Chrome/Edge)
      │       Clicks "Scan QR Code"
      │       → Camera opens, points at buyer's screen
      │       → QR detected → token auto-filled
      │
      ├─→ OPTION B — Manual token entry
      │       Types/pastes: XXXX-XXXX-XXXX
      │       Clicks "Look up"
      │
      ├─→ OPTION C — iPhone (native camera workaround)
      │       Opens iPhone Camera app
      │       → Points at QR code on buyer's screen
      │       → Taps "Open in Safari" banner
      │       → /merchant/redeem?token=XXXX opens, token auto-filled
      │
      ├─→ Coupon card displayed:
      │       ✓ VALID
      │       Campaign name · S$XX voucher value
      │       Serial: IMA-XXXXXX-01  |  Buyer: [Name]
      │
      ├─→ Enter outlet location (optional)
      │
      ├─→ Clicks "Confirm & Mark Redeemed"
      │       POST /api/coupons/[token]
      │       → coupon status: active → redeemed
      │       → added to coupons:redeemed set (settlement index)
      │       → success: "Voucher Redeemed! Please fulfil the meal/service."
      │
      └─→ 📧 EMAIL → Admin  "Coupon redeemed · [Merchant] · S$XX"
              • Coupon token, buyer name, campaign
              • Merchant name, outlet


┌─────────────────────────────────────────────────────────────────────┐
│  STEP 6 — MERCHANT HISTORY                                          │
└─────────────────────────────────────────────────────────────────────┘

  [Merchant] → /merchant/history
      │
      └─→ KPI cards:
              • Total Redeemed (count)
              • Pending Payout (S$XX — 50% of unredeemed merchant portion)
              • Total Earned (S$XX — all time)
              + List of redeemed coupons with dates


┌─────────────────────────────────────────────────────────────────────┐
│  STEP 7 — ADMIN SETTLEMENT                                          │
└─────────────────────────────────────────────────────────────────────┘

  [Admin] → /admin/finance → "Settle now →"
      │   OR → /admin/settlements (sidebar)
      │
      ├─→ Settlements page shows:
      │       Redeemed coupons grouped by merchant
      │       Per merchant:
      │           Total redeemed: X coupons
      │           Mosque portion: S$XX (50%)
      │           Merchant portion: S$XX (50%)
      │           [Mark settled]
      │
      ├─→ Admin transfers S$XX to merchant via PayNow manually
      │       (outside the system — bank transfer)
      │
      └─→ Clicks "Mark settled"
              POST /api/settlements
              → coupons marked: merchant_settled: true
              → timestamp recorded
              → coupons removed from pending settlement view


┌─────────────────────────────────────────────────────────────────────┐
│  IDENTIFIER REFERENCE                                               │
└─────────────────────────────────────────────────────────────────────┘

  IMA-XXXXXX      Order Reference
                  • Created when buyer places order
                  • Used by buyer to track at /orders
                  • Shown on PayNow page as payment reference
                  • Format: IMA- + 6 alphanumeric chars

  XXXX-XXXX-XXXX  Coupon Token
                  • Created when admin verifies payment
                  • Used by merchant to redeem at /merchant/redeem
                  • Encoded as QR at /coupons/[token]
                  • Format: 4-4-4 unambiguous alphanumeric (no 0/O, 1/I)

  IMA-XXXXXX-01   Coupon Serial Number
                  • Links coupon token back to its order
                  • Shown on coupon card in merchant portal
                  • Format: Order Reference + -01, -02 (per quantity)


┌─────────────────────────────────────────────────────────────────────┐
│  SPLIT & SETTLEMENT MATH                                            │
└─────────────────────────────────────────────────────────────────────┘

  Every coupon sale: Mosque 50% · Merchant 50%

  Example: S$8 coupon
      Mosque portion:   S$4  (fundraising proceeds)
      Merchant portion: S$4  (reimbursement for meal served)

  Settlement is triggered by REDEMPTION (service delivered),
  not by purchase. Unredeemed coupons are not settled.


┌─────────────────────────────────────────────────────────────────────┐
│  DEMO BAR — PERSONA SWITCHING                                       │
└─────────────────────────────────────────────────────────────────────┘

  Appears on ALL pages (top of every screen)

  👤 Buyer  → /campaigns  (start browsing as buyer)
  🏪 Merchant → /merchant/redeem  (bypasses PIN login)
  🛡 Admin   → /admin  (bypasses login page)

  Nav links below demo bar go to login pages (for real users).
```

---

## WHAT IS NOT YET AUTOMATED

| Item | Status | Notes |
|------|--------|-------|
| Bank transfer to merchant | Manual | Admin does PayNow transfer outside system, then clicks "Mark settled" |
| PayNow payment detection | Manual | Admin manually checks bank app and clicks "Verify" |
| Coupon expiry enforcement | Automatic | Checked at redemption time against `redemption_end` date |
| Email delivery | Automatic | Requires `RESEND_API_KEY` in Vercel env |
