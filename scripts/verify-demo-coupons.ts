/**
 * Verifies demo redeemed coupons in Upstash and optionally clears duplicates.
 * Run with: npx tsx scripts/verify-demo-coupons.ts
 */
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!

if (!REDIS_URL || !REDIS_TOKEN) {
  console.error('❌  Missing Upstash credentials in .env.local')
  process.exit(1)
}

async function redis(command: unknown[]) {
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  })
  const json = await res.json() as { result: unknown; error?: string }
  if (json.error) throw new Error(`Redis error: ${json.error}`)
  return json.result
}

async function main() {
  const tokens = await redis(['SMEMBERS', 'coupons:redeemed']) as string[]
  console.log(`\ncoupons:redeemed: ${tokens.length} token(s)\n`)

  const coupons = await Promise.all(
    tokens.map(async (t) => {
      const raw = await redis(['GET', `coupon:${t}`]) as string | null
      if (!raw) return null
      return { token: t, ...JSON.parse(raw) }
    })
  )

  const valid = coupons.filter(Boolean) as Array<Record<string, unknown> & { token: string }>
  valid.sort((a, b) => String(a.redeemed_at).localeCompare(String(b.redeemed_at)))

  // Group by merchant
  const byMerchant: Record<string, typeof valid> = {}
  for (const c of valid) {
    const m = (c.campaign as { merchant_name: string })?.merchant_name ?? 'unknown'
    byMerchant[m] = byMerchant[m] ?? []
    byMerchant[m].push(c)
  }

  let hasDuplicates = false
  for (const [merchant, entries] of Object.entries(byMerchant)) {
    const flag = entries.length > 1 ? ' ⚠  DUPLICATE' : ''
    console.log(`${merchant} (${entries.length} coupon${entries.length > 1 ? 's' : ''})${flag}`)
    for (const c of entries) {
      console.log(`   token: ${c.token.slice(0, 8)}…  buyer: ${c.buyer_name}  redeemed: ${String(c.redeemed_at).slice(0, 10)}  settled: ${c.merchant_settled}`)
    }
    if (entries.length > 1) hasDuplicates = true
  }

  if (hasDuplicates) {
    console.log('\n⚠  Duplicates found — removing extras (keeping 1 per merchant)...\n')
    for (const entries of Object.values(byMerchant)) {
      if (entries.length <= 1) continue
      // Keep the last one (most recent redeemed_at), remove the others
      const toRemove = entries.slice(0, -1)
      for (const c of toRemove) {
        await redis(['SREM', 'coupons:redeemed', c.token])
        await redis(['DEL', `coupon:${c.token}`])
        await redis(['LREM', `campaign:${c.campaign_id}:coupon_tokens`, 1, c.token])
        console.log(`   removed duplicate ${c.token.slice(0, 8)}… (${(c.campaign as {merchant_name: string})?.merchant_name})`)
      }
    }
    // Fix coupons_redeemed counters
    const affectedIds = [...new Set(Object.values(byMerchant).flatMap(e => e.map(c => String(c.campaign_id))))]
    for (const id of affectedIds) {
      const entries = byMerchant[Object.keys(byMerchant).find(m => byMerchant[m].some(c => c.campaign_id === id))!]
      const keepCount = 1
      await redis(['SET', `campaign:${id}:coupons_redeemed`, keepCount])
      console.log(`   reset campaign:${id}:coupons_redeemed to ${keepCount}`)
    }
    console.log('\n✅ Cleaned up — re-running verification...\n')
    // Re-verify
    const finalTokens = await redis(['SMEMBERS', 'coupons:redeemed']) as string[]
    console.log(`coupons:redeemed: ${finalTokens.length} token(s)`)
    for (const t of finalTokens) {
      const raw = await redis(['GET', `coupon:${t}`]) as string | null
      if (!raw) continue
      const c = JSON.parse(raw)
      console.log(`  ✓  ${c.campaign?.merchant_name}  |  ${c.buyer_name}  |  ${c.redeemed_at?.slice(0, 10)}  |  settled: ${c.merchant_settled}`)
    }
  } else {
    console.log('\n✅ No duplicates — data looks good.')
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
