import { Redis } from '@upstash/redis'
import type { Campaign, Coupon, Donor } from '@/types'
import type { DbProvider, CouponInsert, DonorInsert, CouponCounts } from './types'

function getRedis() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
}

// ── Key schema ────────────────────────────────────────────────────────────────
// campaign:{id}                     → Campaign JSON
// campaigns:active                  → Set of active campaign IDs
// coupon:{token}                    → Coupon JSON (includes campaign snapshot)
// campaign:{id}:coupon_tokens       → List of all coupon tokens
// campaign:{id}:coupons_redeemed    → INCR counter
// donor:{id}                        → Donor JSON
// donors:all                        → List of donor IDs (newest first)

export class UpstashProvider implements DbProvider {
  async getCampaigns(): Promise<Campaign[]> {
    const redis = getRedis()
    const ids = await redis.smembers('campaigns:active')
    if (!ids.length) return []
    const campaigns = await Promise.all(ids.map((id) => redis.get<Campaign>(`campaign:${id}`)))
    return campaigns
      .filter((c): c is Campaign => c !== null)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  async getCampaign(id: string): Promise<Campaign | null> {
    const redis = getRedis()
    return redis.get<Campaign>(`campaign:${id}`)
  }

  async updateCampaignSoldCount(id: string, increment: number): Promise<void> {
    const redis = getRedis()
    const campaign = await redis.get<Campaign>(`campaign:${id}`)
    if (!campaign) return
    campaign.coupons_sold = (campaign.coupons_sold ?? 0) + increment
    await redis.set(`campaign:${id}`, campaign)
  }

  async getCouponByToken(token: string): Promise<Coupon | null> {
    const redis = getRedis()
    return redis.get<Coupon>(`coupon:${token}`)
  }

  async createCoupons(coupons: CouponInsert[], campaignSnapshot: Campaign): Promise<Coupon[]> {
    const redis = getRedis()
    const now = new Date().toISOString()
    const created: Coupon[] = coupons.map((c) => ({
      ...c,
      id: crypto.randomUUID(),
      campaign_id: c.campaign_id,
      campaign: campaignSnapshot,
      created_at: now,
    }))

    await Promise.all(
      created.map((coupon) =>
        Promise.all([
          redis.set(`coupon:${coupon.token}`, coupon),
          redis.lpush(`campaign:${coupon.campaign_id}:coupon_tokens`, coupon.token),
        ])
      )
    )

    return created
  }

  async redeemCoupon(token: string, outlet: string | null): Promise<Coupon | null> {
    const redis = getRedis()
    const script = `
      local raw = redis.call('GET', KEYS[1])
      if raw == false then return nil end
      local c = cjson.decode(raw)
      if c['status'] ~= 'active' then return false end
      c['status'] = 'redeemed'
      c['redeemed_at'] = ARGV[1]
      if ARGV[2] ~= '' then c['redeemed_outlet'] = ARGV[2] end
      redis.call('SET', KEYS[1], cjson.encode(c))
      redis.call('INCR', 'campaign:' .. c['campaign_id'] .. ':coupons_redeemed')
      redis.call('SADD', 'coupons:redeemed', c['token'])
      return cjson.encode(c)
    `
    const result = await redis.eval(script, [`coupon:${token}`], [new Date().toISOString(), outlet ?? ''])
    if (!result) return null
    return typeof result === 'string' ? JSON.parse(result) : null
  }

  async getRedeemedCoupons(): Promise<Coupon[]> {
    const redis = getRedis()
    const tokens = await redis.smembers('coupons:redeemed')
    if (!tokens.length) return []
    const coupons = await Promise.all(tokens.map(t => redis.get<Coupon>(`coupon:${t}`)))
    return coupons
      .filter((c): c is Coupon => c !== null)
      .sort((a, b) => new Date(b.redeemed_at ?? b.created_at).getTime() - new Date(a.redeemed_at ?? a.created_at).getTime())
  }

  async markCouponsSettled(tokens: string[]): Promise<void> {
    const redis = getRedis()
    const now = new Date().toISOString()
    await Promise.all(tokens.map(async token => {
      const coupon = await redis.get<Coupon>(`coupon:${token}`)
      if (coupon) await redis.set(`coupon:${token}`, { ...coupon, merchant_settled: true, merchant_settled_at: now })
    }))
  }

  async getCouponCountsByCampaign(campaignIds: string[]): Promise<Record<string, CouponCounts>> {
    const redis = getRedis()
    const counts: Record<string, CouponCounts> = {}
    await Promise.all(
      campaignIds.map(async (id) => {
        const [total, redeemed] = await Promise.all([
          redis.llen(`campaign:${id}:coupon_tokens`),
          redis.get<number>(`campaign:${id}:coupons_redeemed`).then((v) => v ?? 0),
        ])
        counts[id] = { total, redeemed }
      })
    )
    return counts
  }

  async countCouponsForCampaign(campaignId: string): Promise<number> {
    const redis = getRedis()
    return redis.llen(`campaign:${campaignId}:coupon_tokens`)
  }

  async getDonors(): Promise<Donor[]> {
    const redis = getRedis()
    const ids = await redis.lrange('donors:all', 0, 99)
    if (!ids.length) return []
    const donors = await Promise.all(ids.map((id) => redis.get<Donor>(`donor:${id}`)))
    return donors.filter((d): d is Donor => d !== null)
  }

  async createDonor(donor: DonorInsert): Promise<void> {
    const redis = getRedis()
    const id = crypto.randomUUID()
    const record: Donor = {
      id,
      ...donor,
      category: donor.category as Donor['category'],
      type: donor.type as Donor['type'],
      created_at: new Date().toISOString(),
    }
    await Promise.all([
      redis.set(`donor:${id}`, record),
      redis.lpush('donors:all', id),
    ])
  }
}
