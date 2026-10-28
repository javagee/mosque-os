/**
 * Seeds Upstash with a full realistic October 2026 demo dataset:
 *   - 27 verified PayNow orders across all 8 campaigns (spread over 4 weeks)
 *   - 286 coupons (active + redeemed, some settled)
 *   - 12 direct donations (mix of categories and types)
 *
 * Safe to run multiple times — clears previous orders/coupons/donors first.
 * Does NOT touch campaign definitions.
 *
 * Run: npx tsx scripts/seed-full-demo.ts
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import { randomUUID } from 'crypto'

config({ path: resolve(process.cwd(), '.env.local') })

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!

if (!REDIS_URL || !REDIS_TOKEN) {
  console.error('❌  Missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN in .env.local')
  process.exit(1)
}

async function r(command: unknown[]) {
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  })
  const json = await res.json() as { result: unknown; error?: string }
  if (json.error) throw new Error(`Redis: ${json.error}`)
  return json.result
}

// ── Campaign lookup ────────────────────────────────────────────────────────────
const CAMPAIGNS: Record<string, { name: string; merchant: string; price: number }> = {
  'camp-001': { name: 'Spring Chicken Meal',   merchant: "Arnold's",               price: 1800 },
  'camp-002': { name: 'Family Rice Set',        merchant: 'Nasi Lemak Wangi',       price: 1200 },
  'camp-003': { name: 'Murtabak Special',       merchant: 'Zam Zam Restaurant',     price: 1500 },
  'camp-004': { name: 'Chicken Briyani Set',    merchant: 'Bismillah Briyani',      price: 2000 },
  'camp-005': { name: 'Roti Prata Combo',       merchant: 'Springleaf Prata Place', price:  800 },
  'camp-006': { name: 'Teh Tarik & Snack Set',  merchant: 'Kopitiam Corner',        price:  600 },
  'camp-007': { name: 'Grilled Lamb Chop',      merchant: 'Al-Barakah Grill',       price: 2800 },
  'camp-008': { name: 'Pasta Halal Platter',    merchant: 'Bella Cucina Halal',     price: 1800 },
}

// ── Orders: 27 orders spread across 4 weeks ───────────────────────────────────
// redeemPct = what fraction of coupons in this order get redeemed
// settlePct = of redeemed, what fraction get merchant_settled
const ORDERS = [
  // Week 1: Oct 5–11
  { ref: 'IMA-DM0001', cid: 'camp-001', qty:  5, buyer: 'Hafiz Bin Rahman',      email: 'hafiz@demo.sg',    date: '2026-10-07', redeemPct: 1.0, settlePct: 1.0 },
  { ref: 'IMA-DM0002', cid: 'camp-002', qty:  8, buyer: 'Siti Noor Aisyah',      email: 'siti@demo.sg',     date: '2026-10-06', redeemPct: 1.0, settlePct: 1.0 },
  { ref: 'IMA-DM0003', cid: 'camp-005', qty:  8, buyer: 'Muhammad Farhan',       email: 'farhan@demo.sg',   date: '2026-10-08', redeemPct: 0.88, settlePct: 1.0 },
  { ref: 'IMA-DM0004', cid: 'camp-006', qty: 10, buyer: 'Nurul Huda Bte Aziz',  email: 'nurul@demo.sg',    date: '2026-10-09', redeemPct: 0.90, settlePct: 1.0 },
  // Week 2: Oct 12–18
  { ref: 'IMA-DM0005', cid: 'camp-001', qty:  8, buyer: 'Ahmad Bin Yusof',       email: 'ahmad@demo.sg',    date: '2026-10-14', redeemPct: 0.88, settlePct: 0.86 },
  { ref: 'IMA-DM0006', cid: 'camp-002', qty: 12, buyer: 'Fatimah Bte Rahman',    email: 'fatimah@demo.sg',  date: '2026-10-13', redeemPct: 0.75, settlePct: 0.89 },
  { ref: 'IMA-DM0007', cid: 'camp-003', qty: 10, buyer: 'Ridhwan Bin Ismail',    email: 'ridhwan@demo.sg',  date: '2026-10-15', redeemPct: 0.80, settlePct: 0.88 },
  { ref: 'IMA-DM0008', cid: 'camp-004', qty:  7, buyer: 'Zainab Bte Hamid',      email: 'zainab@demo.sg',   date: '2026-10-16', redeemPct: 0.71, settlePct: 0.80 },
  { ref: 'IMA-DM0009', cid: 'camp-005', qty: 12, buyer: 'Hafiz Bin Rahman',      email: 'hafiz@demo.sg',    date: '2026-10-14', redeemPct: 0.75, settlePct: 0.89 },
  { ref: 'IMA-DM0010', cid: 'camp-006', qty: 15, buyer: 'Siti Noor Aisyah',      email: 'siti@demo.sg',     date: '2026-10-15', redeemPct: 0.73, settlePct: 0.82 },
  { ref: 'IMA-DM0011', cid: 'camp-008', qty:  8, buyer: 'Sulaiman Bin Omar',     email: 'sulaiman@demo.sg', date: '2026-10-16', redeemPct: 0.75, settlePct: 0.83 },
  // Week 3: Oct 19–25
  { ref: 'IMA-DM0012', cid: 'camp-001', qty: 10, buyer: 'Mariam Bte Salleh',     email: 'mariam@demo.sg',   date: '2026-10-21', redeemPct: 0.60, settlePct: 0.50 },
  { ref: 'IMA-DM0013', cid: 'camp-002', qty: 15, buyer: 'Idris Bin Yusoff',      email: 'idris@demo.sg',    date: '2026-10-22', redeemPct: 0.60, settlePct: 0.56 },
  { ref: 'IMA-DM0014', cid: 'camp-003', qty: 10, buyer: 'Ahmad Bin Yusof',       email: 'ahmad@demo.sg',    date: '2026-10-20', redeemPct: 0.60, settlePct: 0.50 },
  { ref: 'IMA-DM0015', cid: 'camp-004', qty:  8, buyer: 'Nurul Huda Bte Aziz',  email: 'nurul@demo.sg',    date: '2026-10-23', redeemPct: 0.63, settlePct: 0.60 },
  { ref: 'IMA-DM0016', cid: 'camp-005', qty: 15, buyer: 'Fatimah Bte Rahman',    email: 'fatimah@demo.sg',  date: '2026-10-21', redeemPct: 0.60, settlePct: 0.56 },
  { ref: 'IMA-DM0017', cid: 'camp-006', qty: 20, buyer: 'Muhammad Farhan',       email: 'farhan@demo.sg',   date: '2026-10-22', redeemPct: 0.60, settlePct: 0.50 },
  { ref: 'IMA-DM0018', cid: 'camp-007', qty:  8, buyer: 'Zainab Bte Hamid',      email: 'zainab@demo.sg',   date: '2026-10-23', redeemPct: 0.63, settlePct: 0.60 },
  { ref: 'IMA-DM0019', cid: 'camp-008', qty: 10, buyer: 'Ridhwan Bin Ismail',    email: 'ridhwan@demo.sg',  date: '2026-10-22', redeemPct: 0.60, settlePct: 0.50 },
  // Week 4: Oct 26–28 (current — mostly unredeemed)
  { ref: 'IMA-DM0020', cid: 'camp-001', qty:  9, buyer: 'Rohani Bte Basri',      email: 'rohani@demo.sg',   date: '2026-10-27', redeemPct: 0.22, settlePct: 0 },
  { ref: 'IMA-DM0021', cid: 'camp-002', qty: 10, buyer: 'Hafiz Bin Rahman',      email: 'hafiz@demo.sg',    date: '2026-10-28', redeemPct: 0.20, settlePct: 0 },
  { ref: 'IMA-DM0022', cid: 'camp-003', qty:  7, buyer: 'Siti Noor Aisyah',      email: 'siti@demo.sg',     date: '2026-10-26', redeemPct: 0.29, settlePct: 0 },
  { ref: 'IMA-DM0023', cid: 'camp-004', qty:  7, buyer: 'Sulaiman Bin Omar',     email: 'sulaiman@demo.sg', date: '2026-10-27', redeemPct: 0.29, settlePct: 0 },
  { ref: 'IMA-DM0024', cid: 'camp-005', qty: 17, buyer: 'Idris Bin Yusoff',      email: 'idris@demo.sg',    date: '2026-10-27', redeemPct: 0.24, settlePct: 0 },
  { ref: 'IMA-DM0025', cid: 'camp-006', qty: 20, buyer: 'Ahmad Bin Yusof',       email: 'ahmad@demo.sg',    date: '2026-10-28', redeemPct: 0.20, settlePct: 0 },
  { ref: 'IMA-DM0026', cid: 'camp-007', qty:  7, buyer: 'Mariam Bte Salleh',     email: 'mariam@demo.sg',   date: '2026-10-27', redeemPct: 0.29, settlePct: 0 },
  { ref: 'IMA-DM0027', cid: 'camp-008', qty: 10, buyer: 'Fatimah Bte Rahman',    email: 'fatimah@demo.sg',  date: '2026-10-28', redeemPct: 0.20, settlePct: 0 },
]

// ── Direct donations ───────────────────────────────────────────────────────────
const DONORS = [
  { name: 'Ahmad Bin Yusof',       email: 'ahmad@demo.sg',      amount: 50000, currency: 'sgd', category: 'waqf',    type: 'one-time', date: '2026-10-03' },
  { name: 'Fatimah Bte Rahman',    email: 'fatimah@demo.sg',    amount: 30000, currency: 'sgd', category: 'sadaqah', type: 'monthly',  date: '2026-10-04' },
  { name: 'Mohammed Ridhwan',      email: 'ridhwan@demo.sg',    amount: 25000, currency: 'sgd', category: 'general', type: 'one-time', date: '2026-10-08' },
  { name: 'Noor Aisha Bte Hamid',  email: 'nooraisha@demo.sg',  amount: 20000, currency: 'sgd', category: 'zakat',   type: 'one-time', date: '2026-10-10' },
  { name: 'Sulaiman Bin Omar',     email: 'sulaiman@demo.sg',   amount: 20000, currency: 'sgd', category: 'zakat',   type: 'one-time', date: '2026-10-12' },
  { name: 'Zainab Bte Ismail',     email: 'zainab@demo.sg',     amount: 15000, currency: 'sgd', category: 'lillah',  type: 'one-time', date: '2026-10-15' },
  { name: 'Hassan Bin Malik',      email: 'hassan@demo.sg',     amount: 10000, currency: 'sgd', category: 'general', type: 'monthly',  date: '2026-10-18' },
  { name: 'Mariam Bte Salleh',     email: 'mariam@demo.sg',     amount: 10000, currency: 'sgd', category: 'sadaqah', type: 'one-time', date: '2026-10-20' },
  { name: 'Idris Bin Yusoff',      email: 'idris@demo.sg',      amount:  8000, currency: 'sgd', category: 'general', type: 'one-time', date: '2026-10-22' },
  { name: 'Rohani Bte Basri',      email: 'rohani@demo.sg',     amount: 10000, currency: 'sgd', category: 'general', type: 'monthly',  date: '2026-10-24' },
  { name: 'Hafizuddin Bin Said',   email: 'hafizuddin@demo.sg', amount:  5000, currency: 'sgd', category: 'sadaqah', type: 'one-time', date: '2026-10-25' },
  { name: 'Zulaikha Bte Ahmad',    email: 'zulaikha@demo.sg',   amount:  5000, currency: 'sgd', category: 'general', type: 'one-time', date: '2026-10-27' },
]

function makeToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let t = ''
  for (let i = 0; i < 12; i++) {
    if (i === 4 || i === 8) t += '-'
    t += chars[Math.floor(Math.random() * chars.length)]
  }
  return t
}

async function clearPrevious() {
  console.log('🧹 Clearing previous orders / coupons / donors...')

  // Donors
  const donorIds = await r(['LRANGE', 'donors:all', 0, 999]) as string[]
  for (const id of donorIds) await r(['DEL', `donor:${id}`])
  await r(['DEL', 'donors:all'])

  // Orders
  const orderRefs = await r(['SMEMBERS', 'orders:all']) as string[]
  for (const ref of orderRefs) await r(['DEL', `order:${ref}`])
  await r(['DEL', 'orders:all'])
  await r(['DEL', 'orders:pending_verification'])

  // Coupons — iterate each campaign's token list
  for (const cid of Object.keys(CAMPAIGNS)) {
    const tokens = await r(['LRANGE', `campaign:${cid}:coupon_tokens`, 0, 9999]) as string[]
    for (const t of tokens) await r(['DEL', `coupon:${t}`])
    await r(['DEL', `campaign:${cid}:coupon_tokens`])
    await r(['DEL', `campaign:${cid}:coupons_redeemed`])
    // Reset coupons_sold on the campaign JSON
    const raw = await r(['GET', `campaign:${cid}`]) as string | null
    if (raw) {
      const c = JSON.parse(raw)
      await r(['SET', `campaign:${cid}`, JSON.stringify({ ...c, coupons_sold: 0 })])
    }
  }
  await r(['DEL', 'coupons:redeemed'])

  console.log('   Done.\n')
}

async function seedOrders() {
  console.log('📦 Seeding orders + coupons...\n')

  const soldByCampaign: Record<string, number> = {}
  let totalCoupons = 0
  let totalRedeemed = 0
  let totalSettled = 0

  for (const o of ORDERS) {
    const camp = CAMPAIGNS[o.cid]
    const total = camp.price * o.qty
    const mosquePortion = Math.floor(total * 0.5)
    const merchantPortion = total - mosquePortion

    const paidAt = new Date(o.date + 'T10:00:00+08:00').toISOString()
    const verifiedAt = new Date(o.date + 'T14:00:00+08:00').toISOString()
    const order = {
      reference: o.ref,
      campaign_id: o.cid,
      campaign_name: camp.name,
      merchant_name: camp.merchant,
      buyer_name: o.buyer,
      buyer_email: o.email,
      quantity: o.qty,
      unit_price: camp.price,
      total,
      currency: 'sgd',
      mosque_portion: mosquePortion,
      merchant_portion: merchantPortion,
      status: 'verified',
      created_at: new Date(o.date + 'T09:00:00+08:00').toISOString(),
      paid_at: paidAt,
      verified_at: verifiedAt,
    }

    await r(['SET', `order:${o.ref}`, JSON.stringify(order)])
    await r(['SADD', 'orders:all', o.ref])

    // Create coupons
    const redeemCount = Math.floor(o.qty * o.redeemPct)
    const settleCount = Math.floor(redeemCount * o.settlePct)

    for (let i = 0; i < o.qty; i++) {
      const token = makeToken()
      const serial = `${o.ref}-${String(i + 1).padStart(2, '0')}`
      const isRedeemed = i < redeemCount
      const isSettled = i < settleCount

      const redeemedAt = isRedeemed
        ? new Date(new Date(o.date).getTime() + (2 + i) * 24 * 60 * 60 * 1000).toISOString()
        : undefined

      const coupon = {
        id: randomUUID(),
        token,
        serial_number: serial,
        campaign_id: o.cid,
        campaign: {
          id: o.cid,
          name: camp.name,
          merchant_name: camp.merchant,
          coupon_price: camp.price,
          currency: 'sgd',
          active: true,
          coupons_sold: 0,
          created_at: new Date('2026-10-01').toISOString(),
        },
        buyer_name: o.buyer,
        buyer_email: o.email,
        stripe_session_id: o.ref,
        status: isRedeemed ? 'redeemed' : 'active',
        created_at: verifiedAt,
        ...(isRedeemed && { redeemed_at: redeemedAt, redeemed_outlet: camp.merchant }),
        merchant_settled: isSettled,
        ...(isSettled && { merchant_settled_at: new Date(new Date(o.date).getTime() + 5 * 24 * 60 * 60 * 1000).toISOString() }),
      }

      await r(['SET', `coupon:${token}`, JSON.stringify(coupon)])
      await r(['RPUSH', `campaign:${o.cid}:coupon_tokens`, token])

      if (isRedeemed) {
        await r(['INCR', `campaign:${o.cid}:coupons_redeemed`])
        await r(['SADD', 'coupons:redeemed', token])
        totalRedeemed++
        if (isSettled) totalSettled++
      }
    }

    soldByCampaign[o.cid] = (soldByCampaign[o.cid] ?? 0) + o.qty
    totalCoupons += o.qty

    const revenue = `S$${(total / 100).toFixed(0)}`
    const redeemLabel = `${redeemCount}/${o.qty} redeemed`
    console.log(`   ${o.ref}  ${camp.merchant.padEnd(26)} qty=${o.qty}  ${revenue.padEnd(8)} ${redeemLabel}`)
  }

  // Update coupons_sold on each campaign JSON
  for (const [cid, sold] of Object.entries(soldByCampaign)) {
    const raw = await r(['GET', `campaign:${cid}`]) as string | null
    if (raw) {
      const c = JSON.parse(raw)
      await r(['SET', `campaign:${cid}`, JSON.stringify({ ...c, coupons_sold: sold })])
    }
  }

  console.log(`\n   Total coupons: ${totalCoupons}  redeemed: ${totalRedeemed}  settled: ${totalSettled}`)
}

async function seedDonors() {
  console.log('\n💚 Seeding direct donations...\n')
  let total = 0
  for (const d of DONORS) {
    const id = randomUUID()
    const donor = {
      id,
      name: d.name,
      email: d.email,
      amount: d.amount,
      currency: d.currency,
      category: d.category,
      type: d.type,
      stripe_session_id: `demo_${id.slice(0, 8)}`,
      created_at: new Date(d.date + 'T12:00:00+08:00').toISOString(),
    }
    await r(['SET', `donor:${id}`, JSON.stringify(donor)])
    await r(['RPUSH', 'donors:all', id])
    total += d.amount
    console.log(`   ${d.name.padEnd(28)} S$${(d.amount / 100).toFixed(0).padStart(5)}  ${d.category}  ${d.type}`)
  }
  console.log(`\n   Total donations: S$${(total / 100).toFixed(0)}`)
}

async function summary() {
  // Re-read live data for summary
  const coupons = await r(['SMEMBERS', 'coupons:redeemed']) as string[]
  const donors = await r(['LRANGE', 'donors:all', 0, 999]) as string[]
  const orders = await r(['SMEMBERS', 'orders:all']) as string[]

  let donorTotal = 0
  for (const id of donors) {
    const raw = await r(['GET', `donor:${id}`]) as string | null
    if (raw) donorTotal += JSON.parse(raw).amount
  }

  let couponRevenue = 0
  for (const ref of orders) {
    const raw = await r(['GET', `order:${ref}`]) as string | null
    if (raw) couponRevenue += JSON.parse(raw).total
  }

  const pendingSettlementCoupons: string[] = []
  for (const token of coupons) {
    const raw = await r(['GET', `coupon:${token}`]) as string | null
    if (raw) {
      const c = JSON.parse(raw)
      if (!c.merchant_settled) pendingSettlementCoupons.push(token)
    }
  }

  let pendingAmount = 0
  for (const token of pendingSettlementCoupons) {
    const raw = await r(['GET', `coupon:${token}`]) as string | null
    if (raw) {
      const c = JSON.parse(raw)
      pendingAmount += Math.ceil(c.campaign?.coupon_price ?? 0) / 2
    }
  }

  console.log('\n' + '─'.repeat(55))
  console.log('📊 DEMO DATA SUMMARY')
  console.log('─'.repeat(55))
  console.log(`   Direct donations:      S$${(donorTotal / 100).toFixed(0).padStart(6)}  (${donors.length} donors)`)
  console.log(`   Coupon sales:          S$${(couponRevenue / 100).toFixed(0).padStart(6)}  (${orders.length} orders)`)
  console.log(`   Total fundraising:     S$${((donorTotal + couponRevenue) / 100).toFixed(0).padStart(6)}`)
  console.log(`   Coupons redeemed:      ${coupons.length}`)
  console.log(`   Pending settlement:    S$${(pendingAmount / 100).toFixed(0).padStart(6)}  (${pendingSettlementCoupons.length} coupons)`)
  console.log('─'.repeat(55))
  console.log('\n✅ Demo data ready — visit /admin to verify\n')
}

async function main() {
  console.log('🌱 Imara full demo seed — October 2026\n')
  await clearPrevious()
  await seedOrders()
  await seedDonors()
  await summary()
}

main().catch(e => { console.error(e); process.exit(1) })
