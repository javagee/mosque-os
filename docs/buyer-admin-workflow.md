# Imara — Buyer → Admin → Buyer Voucher Workflow

**Last updated:** 28 October 2026  
**Platform:** mosque-os-ai.vercel.app  
**Purpose:** PayNow coupon purchase and verification flow

---

## Overview

This document describes the complete end-to-end workflow for a buyer purchasing a fundraising voucher (e-coupon) from the Imara platform, through admin payment verification, and final coupon delivery to the buyer.

---

## Full Flow

| Step | Who | What Happens | Page / Endpoint |
|------|-----|--------------|-----------------|
| 1 | Buyer | Selects campaign, enters name, email, and quantity | `/campaigns/[id]/checkout` |
| 2 | Buyer | Sees PayNow QR code, copies UEN + payment reference, pays via bank app | `/pay/[reference]` |
| 3 | Buyer | Clicks "I've completed payment" button | `/pay/[reference]` |
| 4 | System | Marks order as `pending_verification` · Emails admin notification · Emails buyer "payment received" acknowledgment | `POST /api/orders/[reference]/confirm` |
| 5 | Buyer | Sees success page with order reference (e.g. `IMA-XXXX`) prominently displayed and "Check order status →" link | `/donate/success?type=coupon&ref=IMA-XXXX` |
| 6 | Buyer | Can revisit order status anytime — shows 3-step timeline with current stage lit up and timestamps | `/orders/[reference]` |
| 7 | Admin | Receives email notification, logs into admin panel, sees amber "awaiting verification" panel on both Dashboard and Finance page | `/admin` or `/admin/finance` |
| 8 | Admin | Checks mosque bank statement to confirm PayNow transfer received, clicks **"Verify & Send E-Coupon"** button | Admin panel |
| 9 | System | Creates coupon tokens in database, emails voucher QR code(s) to buyer's email address | `POST /api/orders/[reference]/verify` |
| 10 | Buyer | Receives email with e-coupon QR code, presents QR code at merchant outlet | `/coupons/[token]` |
| 11 | Merchant | Logs in to merchant portal, scans or enters token, clicks Redeem — coupon marked redeemed | `/merchant/redeem` |
| 12 | Admin | Tracks all sales, redemptions, and settlement status in Finance dashboard | `/admin/finance` |

---

## Key Principles

- **Payment is trust-based (PayNow)** — no payment gateway. Admin manually verifies bank statement before releasing coupon.
- **E-coupon is only generated after admin verification** — prevents coupon issuance without confirmed payment.
- **Buyer is kept informed at every step** — acknowledgment email on submission, coupon email on verification, order status page available any time.
- **Admin is notified immediately** — email alert goes out the moment buyer submits payment claim.
- **Zero platform fees** — PayNow transfers go directly to mosque bank account.

---

## Order Status States

| Status | Meaning |
|--------|---------|
| `pending_payment` | Order created, buyer has not yet clicked "I've paid" |
| `pending_verification` | Buyer clicked "I've paid", admin has not yet verified bank |
| `verified` | Admin confirmed bank transfer, e-coupon emailed to buyer |

---

## Direct Donation Workflow (parallel flow)

The same verification pattern applies to direct PayNow donations:

| Step | Who | What Happens | Page / Endpoint |
|------|-----|--------------|-----------------|
| 1 | Donor | Fills in name, email, amount, category (Zakat/Sadaqah/Waqf/Infaq/General), type (one-time/monthly) | `/donate` |
| 2 | Donor | Sees PayNow QR and payment reference | `/pay/donation/[reference]` |
| 3 | Donor | Clicks "I've completed payment" | `/pay/donation/[reference]` |
| 4 | System | Marks donation `pending_verification`, notifies admin | `POST /api/donations/[reference]/confirm` |
| 5 | Admin | Sees purple "donations awaiting verification" panel, verifies bank | `/admin` |
| 6 | Admin | Clicks "Verify donation" | Admin panel |
| 7 | System | Calls `db.createDonor()` — donation recorded in Finance dashboard with category breakdown | `POST /api/donations/[reference]/verify` |

---

## Persona Quick Reference

| Persona | Entry Point | Credentials |
|---------|------------|-------------|
| 👤 Buyer | `/campaigns` or `/donate` | None required |
| 🏪 Merchant | `/merchant/login` | 4-digit PIN |
| 🛡 Admin | `/admin/login` | Username: `admin` |

---

*Powered by Imara — إِمَارَة · Mosque Management Platform*
