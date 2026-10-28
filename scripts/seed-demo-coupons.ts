/**
 * Seeds Upstash Redis with pre-redeemed demo coupons for Thursday's demo.
 * Creates 3 redeemed coupons across 3 merchants so the merchant history page
 * shows real data without needing to go through the full payment flow.
 *
 * Run with: npx tsx scripts/seed-demo-coupons.ts
 * Requires UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in .env.local
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { randomUUID } from 'crypto'

config({ path: resolve(process.cwd(), '.env.local') })

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

if (!REDIS_URL || !REDIS_TOKEN) {
  console.error('❌  Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env.local')
  process.exit(1)
}

async function redis(command: unknown[]) {
  const res = await fetch(REDIS_URL!, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  })
  const json = await res.json() as { result: unknown; error?: string }
  if (json.error) throw new Error(`Redis error: ${json.error}`)
  return json.result
}

async function getCampaign(id: string) {
  const raw = await redis(['GET', `campaign:${id}`]) as string | null
  if (!raw) throw new Error(`Campaign ${id} not found — run seed-upstash.ts first`)
  return JSON.parse(raw)
}

const demoEntries = [
  {
    campaignId: 'camp-001',
    orderRef: 'IMA-DEM001',
    buyer: { name: 'Hafiz Bin Rahman', email: 'hafiz@example.com' },
    redeemedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    campaignId: 'camp-002',
    orderRef: 'IMA-DEM002',
    buyer: { name: 'Siti Noor Aisyah', email: 'siti@example.com' },
    redeemedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
  {
    campaignId: 'camp-005',
    orderRef: 'IMA-DEM003',
    buyer: { name: 'Muhammad Farhan', email: 'farhan@example.com' },
    redeemedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
  },
]

async function seed() {
  console.log('🌱 Seeding demo redeemed coupons...\n')

  for (const entry of demoEntries) {
    const campaign = await getCampaign(entry.campaignId)
    const token = randomUUID()
    const id = randomUUID()
    const serialNumber = `${entry.orderRef}-01`
    const now = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // "purchased" 5 days ago

    const coupon = {
      id,
      token,
      serial_number: serialNumber,
      campaign_id: campaign.id,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        merchant_name: campaign.merchant_name,
        coupon_price: campaign.coupon_price,
        currency: campaign.currency,
        active: campaign.active,
        coupons_sold: campaign.coupons_sold,
        created_at: campaign.created_at,
      },
      buyer_name: entry.buyer.name,
      buyer_email: entry.buyer.email,
      stripe_session_id: '',
      status: 'redeemed',
      redeemed_at: entry.redeemedAt,
      redeemed_outlet: campaign.merchant_name,
      created_at: now,
      merchant_settled: false,
    }

    // Store the coupon
    await redis(['SET', `coupon:${token}`, JSON.stringify(coupon)])

    // Add to campaign token list
    await redis(['RPUSH', `campaign:${campaign.id}:coupon_tokens`, token])

    // Mark as redeemed — increment counter + add to global redeemed set
    await redis(['INCR', `campaign:${campaign.id}:coupons_redeemed`])
    await redis(['SADD', 'coupons:redeemed', token])

    // Bump coupons_sold on the campaign JSON
    const updated = { ...campaign, coupons_sold: (campaign.coupons_sold || 0) + 1 }
    await redis(['SET', `campaign:${campaign.id}`, JSON.stringify(updated)])

    console.log(`✓  ${campaign.name} (${campaign.merchant_name})`)
    console.log(`   buyer: ${entry.buyer.name}  token: ${token.slice(0, 8)}…`)
    console.log(`   redeemed: ${new Date(entry.redeemedAt).toLocaleString('en-SG')}`)
    console.log()
  }

  console.log('✅ Done — merchant history page will show 3 redeemed coupons across 3 merchants.')
  console.log('   Arnold\'s: 1  ·  Nasi Lemak Wangi: 1  ·  Springleaf Prata Place: 1')
}

seed().catch((e) => { console.error(e); process.exit(1) })
