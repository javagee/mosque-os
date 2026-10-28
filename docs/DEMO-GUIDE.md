# Imara Demo Guide
## Presentation for Hj Suhaimi (Vice Chairman) — 29 Oct 2026, 10:00am

**Live URL:** https://mosque-os-ai.vercel.app  
**Admin login:** username `admin` · password `Imara@2026`  
**Merchant PIN:** `1234`

---

## BEFORE YOU START

Open these tabs in advance:
1. https://mosque-os-ai.vercel.app (homepage)
2. Your email inbox (buyer confirmation emails will arrive here)
3. Mosque bank app (to show PayNow transfer — or skip for demo)

Seed fresh demo data (if needed):
```
curl -X POST https://mosque-os-ai.vercel.app/api/admin/seed-demo
```

---

## DEMO SCRIPT — 7 STEPS

---

### STEP 1 — Buyer purchases an e-coupon via PayNow

**Switch persona:** Demo bar → 👤 Buyer

**Say:** *"This is what a member of the public sees. They browse our fundraising campaigns..."*

1. Click **Campaigns** in nav
2. Select any campaign (e.g. "Roti Prata Combo · Springleaf · S$8")
3. Click **Buy Voucher**
4. Fill in checkout:
   - Name: `Ahmad Demo`
   - Email: *(your real email so you receive the notifications)*
   - Quantity: `1`
5. Click **Proceed to PayNow**

**Show the PayNow page:**
- Point out the **QR code** (scan with any bank app)
- Point out the **UEN: 6596805367**
- Point out the **order reference: IMA-XXXXXX** (tell buyer to use this as payment reference)
- Point out the **30-minute countdown**

6. Click **"I've completed payment"** *(no need to actually transfer money for demo)*

**Show the success page:**
- Reference shown prominently
- **"Check order status →"** button (green)
- Explain: *"Buyer can bookmark this to check back any time"*

**Say:** *"Simultaneously, the buyer gets an acknowledgment email, and our admin gets a notification to check the bank."*

---

### STEP 2 — Buyer tracks order status

**Still on buyer persona**

1. Click **Track Order** in nav
2. Enter the order reference shown on success page: `IMA-XXXXXX`
3. Enter the email used at checkout
4. Click **Check order status →**

**Show the status page:**
- 3-step timeline — Step 2 "Awaiting bank verification" is pulsing amber
- **"Auto-refreshing in 30s"** — page refreshes automatically
- **Say:** *"The buyer doesn't need to do anything — the page updates itself while they wait."*

---

### STEP 3 — Admin verifies payment & sends e-coupon

**Switch persona:** Demo bar → 🛡 Admin  
*(Goes straight to admin dashboard — no login needed for demo)*

**Show the dashboard:**
- KPI cards at top (Total Raised, Coupons Sold, etc.)
- **Amber panel:** "X coupon payment awaiting verification"

**Say:** *"The admin has also received an email notification. They log in and immediately see what needs attention."*

**Show the order card in the amber panel:**
- Reference, buyer name, email
- Campaign, merchant, amount paid, timestamp

1. Confirm the PayNow transfer matches *(explain: "In real life, admin checks bank app here")*
2. Click **"Verify & Send E-Coupon"** button

**Show the result:**
- Order card disappears from pending panel
- Dashboard KPIs update

**Say:** *"The moment admin clicks this, three things happen automatically: the order is marked verified, a unique coupon token is generated, and the e-coupon is immediately emailed to the buyer."*

---

### STEP 4 — Buyer receives e-coupon email

**Check the email inbox** *(the email entered at checkout)*

**Show the email:**
- Subject: "Your [Campaign Name] e-coupon from Al-Noor Mosque"
- Coupon token: `XXXX-XXXX-XXXX`
- **"View coupon & QR code →"** button

1. Click **"View coupon & QR code →"**

**Show /coupons/[token] page:**
- Large QR code on screen
- Token displayed below
- Campaign name, merchant, value

**Say:** *"The buyer shows this QR code at the merchant outlet. The merchant scans it to redeem."*

*(Optional: go back to the Track Order page and show Step 3 is now green ✓ "Verified — e-coupon sent")*

---

### STEP 5 — Merchant scans & redeems e-coupon

**Switch persona:** Demo bar → 🏪 Merchant  
*(Goes straight to merchant redeem page — no PIN needed for demo)*

**Show the merchant portal:**
- Dark green sidebar (matches admin look)
- "Redeem Voucher" heading

**Option A — QR Scan (if on Android Chrome):**
1. Click **"Scan QR Code"**
2. Allow camera access
3. Point camera at the QR code on buyer's screen (or from the email)
4. Token auto-fills

**Option B — Manual entry (works on all devices):**
1. Type/paste the token: `XXXX-XXXX-XXXX`
2. Click **Look up**

**Show the coupon card:**
- Green "✓ VALID" status bar
- Campaign name, S$XX value
- Serial number, buyer name

3. *(Optional)* Enter outlet: `Main outlet`
4. Click **"Confirm & Mark Redeemed"**

**Show the success screen:**
- "Voucher Redeemed!"
- "Please fulfil the meal / service for the customer now."

**Say:** *"The moment the merchant redeems, the admin receives an email notification, and the coupon is recorded for settlement."*

---

### STEP 6 — Admin receives redemption notification

**Check the email inbox** *(admin notification email)*

**Show the email:**
- Subject: "[Imara] Coupon redeemed · [Merchant] · S$XX"
- Token, campaign, merchant, buyer name, redemption time
- Link to /admin/settlements

**Say:** *"Admin is notified every time a voucher is redeemed. This builds an audit trail for settlement."*

---

### STEP 7 — Admin settles with merchant

**Switch persona:** Demo bar → 🛡 Admin

**Navigate:** Sidebar → **Settlement**  
OR Finance page → **"Settle now →"** link

**Show the settlements page:**
- Redeemed coupons grouped by merchant
- Per merchant:
  - Number of coupons redeemed
  - Mosque portion (50%): S$XX kept by mosque
  - Merchant portion (50%): S$XX to pay merchant

**Say:** *"The system automatically calculates how much to pay each merchant. Admin does a PayNow transfer to the merchant, then clicks Mark Settled."*

1. Click **"Mark settled"**

**Show the result:**
- Merchant cleared from pending settlements
- Settlement recorded with timestamp

**Say:** *"And that's the complete loop — from the buyer's purchase all the way to the merchant being reimbursed."*

---

## SUPPLEMENTARY PAGES TO SHOW

### Finance & Donations Dashboard
- Sidebar → **Finance & Donations**
- Weekly revenue chart
- Campaign performance table
- Pending orders amber panel

### Campaigns Management
- Sidebar → **Campaigns**
- List of all active campaigns
- Edit campaign details, set redemption dates

### Settings
- Sidebar → **Settings**
- Mosque name, admin email, notification preferences

### Prayer Times (public)
- Nav → **Prayer Times**
- Auto-calculated based on mosque coordinates
- Kiosk display mode at `/display` (for mosque TV screen)

### Donation (direct)
- Nav → **Donate**
- Separate from coupon purchases
- Categories: Zakat, Sadaqah, Waqf, Infaq, General Fund
- Also via PayNow, zero fees

---

## KEY MESSAGES FOR THE PRESENTATION

| Message | Evidence to show |
|---------|-----------------|
| Zero platform fees | PayNow page — no gateway charge, full amount to mosque |
| End-to-end automation | Emails fire automatically at every step |
| Real-time tracking | /orders status page auto-refreshes |
| Audit trail | Every transaction timestamped, stored in Redis |
| Multi-persona | Demo bar switches between buyer / merchant / admin instantly |
| Mobile-ready | Works on phone browser; QR scan on Android, native camera on iPhone |
| 50/50 split automatic | Settlement page shows exact amounts, no manual calculation |

---

## IF SOMETHING GOES WRONG

| Problem | Fix |
|---------|-----|
| Pending orders panel not showing | Run: `curl -X POST https://mosque-os-ai.vercel.app/api/admin/seed-demo` |
| Emails not arriving | Check spam folder; Resend key is set — allow 1–2 min |
| Merchant login fails | Use demo bar (🏪 Merchant) to bypass PIN entirely |
| QR scan not working | Use manual token entry instead; or iPhone native Camera app |
| Page shows error | Check Vercel logs: `vercel logs mosque-os-ai.vercel.app` |

---

## CREDENTIALS SUMMARY

| Access | Details |
|--------|---------|
| Admin login | username: `admin` · password: `Imara@2026` |
| Merchant PIN | `1234` |
| Demo bypass | Demo bar at top of every page |
| PayNow UEN | `6596805367` |
| Admin email | `mdghazali.ahmad@gmail.com` |
| Live URL | `https://mosque-os-ai.vercel.app` |
