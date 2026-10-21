/**
 * Seeds Upstash Redis with all 8 campaigns.
 * Run with: npx tsx scripts/seed-upstash.ts
 * Requires UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in .env.local
 */

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

if (!REDIS_URL || !REDIS_TOKEN) {
  console.error('❌  Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env.local')
  process.exit(1)
}

async function redis(command: unknown[]) {
  const res = await fetch(`${REDIS_URL}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  })
  const json = await res.json() as { result: unknown }
  return json.result
}

const campaigns = [
  {
    id: 'camp-001',
    name: 'Spring Chicken Meal',
    merchant_name: "Arnold's",
    description: "Arnold's famous crispy spring chicken meal with sides — proceeds go directly to the mosque renovation fund.",
    coupon_price: 1800,
    currency: 'sgd',
    total_coupons: 100,
    coupons_sold: 0,
    image_url: '/images/arnolds-spring-chicken.png',
    active: true,
    redemption_end: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'camp-002',
    name: 'Family Rice Set',
    merchant_name: 'Nasi Lemak Wangi',
    description: 'Fragrant coconut rice with sambal, crispy anchovies, and your choice of protein — perfect for the whole family.',
    coupon_price: 1200,
    currency: 'sgd',
    total_coupons: 150,
    coupons_sold: 0,
    image_url: '/images/nasi-lemak-family-set.jpg',
    active: true,
    redemption_end: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'camp-003',
    name: 'Murtabak Special',
    merchant_name: 'Zam Zam Restaurant',
    description: 'Classic stuffed savoury pancake with spiced minced meat and egg, served with curry sauce.',
    coupon_price: 1500,
    currency: 'sgd',
    total_coupons: 80,
    coupons_sold: 0,
    image_url: '/images/murtabak-samosa.jpg',
    active: true,
    redemption_end: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'camp-004',
    name: 'Chicken Briyani Set',
    merchant_name: 'Bismillah Briyani',
    description: 'Aromatic long-grain basmati rice cooked with tender chicken and whole spices.',
    coupon_price: 2000,
    currency: 'sgd',
    total_coupons: 60,
    coupons_sold: 0,
    image_url: '/images/briyani-set.jpg',
    active: true,
    redemption_end: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'camp-005',
    name: 'Roti Prata Combo',
    merchant_name: 'Springleaf Prata Place',
    description: 'Classic crispy roti prata with dhal and fish curry — perfect for breakfast or supper. Includes 2 prata + 1 drink.',
    coupon_price: 800,
    currency: 'sgd',
    total_coupons: 120,
    coupons_sold: 0,
    image_url: '/images/roti-prata.jpg',
    active: true,
    redemption_end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'camp-006',
    name: 'Teh Tarik & Snack Set',
    merchant_name: 'Kopitiam Corner',
    description: 'Traditional pulled milk tea with a light snack platter. Freshly made to order at the kopitiam.',
    coupon_price: 600,
    currency: 'sgd',
    total_coupons: 150,
    coupons_sold: 0,
    image_url: '/images/teh-tarik-set.jpg',
    active: true,
    redemption_end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'camp-007',
    name: 'Grilled Lamb Chop',
    merchant_name: 'Al-Barakah Grill',
    description: 'Juicy marinated lamb chop grilled to perfection, served with fragrant basmati rice and garden salad.',
    coupon_price: 2800,
    currency: 'sgd',
    total_coupons: 50,
    coupons_sold: 0,
    image_url: '/images/lamb-chop.jpg',
    active: true,
    redemption_end: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'camp-008',
    name: 'Pasta Halal Platter',
    merchant_name: 'Bella Cucina Halal',
    description: 'Hearty halal pasta in your choice of aglio olio or creamy mushroom sauce. Served with garlic bread.',
    coupon_price: 1800,
    currency: 'sgd',
    total_coupons: 70,
    coupons_sold: 0,
    image_url: '/images/pasta-halal.jpg',
    active: true,
    redemption_end: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

async function seed() {
  console.log('🌱 Seeding Upstash Redis with campaigns...\n')

  // Clear existing campaign data
  const existingIds = await redis(['SMEMBERS', 'campaigns:active']) as string[]
  if (existingIds?.length) {
    for (const id of existingIds) {
      await redis(['DEL', `campaign:${id}`])
    }
    await redis(['DEL', 'campaigns:active'])
    console.log(`🗑  Cleared ${existingIds.length} existing campaigns`)
  }

  for (const campaign of campaigns) {
    const now = new Date().toISOString()
    const full = { ...campaign, created_at: now, updated_at: now }

    await redis(['SET', `campaign:${campaign.id}`, JSON.stringify(full)])
    await redis(['SADD', 'campaigns:active', campaign.id])
    console.log(`✓  ${campaign.name} (${campaign.merchant_name}) — SGD $${campaign.coupon_price / 100}`)
  }

  console.log(`\n✅ Seeded ${campaigns.length} campaigns into Upstash Redis`)
  console.log('   Deploy to Vercel or restart dev server to see them.')
}

seed().catch((e) => { console.error(e); process.exit(1) })
