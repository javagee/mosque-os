import { getSupabaseAdmin } from '@/lib/supabase'
import type { Campaign, Coupon, Donor } from '@/types'
import type { DbProvider, CouponInsert, DonorInsert, CouponCounts, CampaignInsertData } from './types'

export class SupabaseProvider implements DbProvider {
  private get db() {
    const sb = getSupabaseAdmin()
    if (!sb) throw new Error('Supabase not configured')
    return sb
  }

  async getCampaigns(): Promise<Campaign[]> {
    try {
      const { data } = await this.db
        .from('campaigns')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
      return (data as Campaign[]) ?? []
    } catch { return [] }
  }

  async getAllCampaigns(): Promise<Campaign[]> {
    try {
      const { data } = await this.db
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })
      return (data as Campaign[]) ?? []
    } catch { return [] }
  }

  async getCampaign(id: string): Promise<Campaign | null> {
    try {
      const { data } = await this.db.from('campaigns').select('*').eq('id', id).single()
      return (data as Campaign) ?? null
    } catch { return null }
  }

  async createCampaign(data: CampaignInsertData): Promise<Campaign> {
    const { data: created, error } = await this.db
      .from('campaigns')
      .insert({ ...data, coupons_sold: 0 })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return created as Campaign
  }

  async updateCampaign(id: string, updates: Partial<CampaignInsertData>): Promise<Campaign | null> {
    try {
      const { data } = await this.db
        .from('campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      return (data as Campaign) ?? null
    } catch { return null }
  }

  async updateCampaignSoldCount(id: string, increment: number): Promise<void> {
    const { data } = await this.db.from('campaigns').select('coupons_sold').eq('id', id).single()
    await this.db
      .from('campaigns')
      .update({ coupons_sold: (data?.coupons_sold ?? 0) + increment })
      .eq('id', id)
  }

  async getCouponByToken(token: string): Promise<Coupon | null> {
    try {
      const { data } = await this.db
        .from('coupons')
        .select('*, campaign:campaigns(*)')
        .eq('token', token)
        .single()
      return (data as Coupon) ?? null
    } catch { return null }
  }

  async createCoupons(coupons: CouponInsert[], _campaignSnapshot: Campaign): Promise<Coupon[]> {
    const { data } = await this.db.from('coupons').insert(coupons).select()
    return (data as Coupon[]) ?? []
  }

  async redeemCoupon(token: string, outlet: string | null): Promise<Coupon | null> {
    const now = new Date().toISOString()
    const { data } = await this.db
      .from('coupons')
      .update({ status: 'redeemed', redeemed_at: now, redeemed_outlet: outlet ?? null })
      .eq('token', token)
      .eq('status', 'active')
      .select()
      .single()
    return (data as Coupon) ?? null
  }

  async getCouponCountsByCampaign(campaignIds: string[]): Promise<Record<string, CouponCounts>> {
    if (campaignIds.length === 0) return {}
    try {
      const { data } = await this.db
        .from('coupons')
        .select('campaign_id, status')
        .in('campaign_id', campaignIds)

      const counts: Record<string, CouponCounts> = {}
      for (const row of data ?? []) {
        if (!counts[row.campaign_id]) counts[row.campaign_id] = { total: 0, redeemed: 0 }
        counts[row.campaign_id].total++
        if (row.status === 'redeemed') counts[row.campaign_id].redeemed++
      }
      return counts
    } catch { return {} }
  }

  async countCouponsForCampaign(campaignId: string): Promise<number> {
    const { count } = await this.db
      .from('coupons')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
    return count ?? 0
  }

  async getDonors(): Promise<Donor[]> {
    try {
      const { data } = await this.db
        .from('donors')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      return (data as Donor[]) ?? []
    } catch { return [] }
  }

  async createDonor(donor: DonorInsert): Promise<void> {
    await this.db.from('donors').insert({ ...donor, status: 'completed' })
  }

  async getRedeemedCoupons(): Promise<Coupon[]> {
    try {
      const { data } = await this.db
        .from('coupons')
        .select('*, campaign:campaigns(*)')
        .eq('status', 'redeemed')
        .order('redeemed_at', { ascending: false })
      return (data as Coupon[]) ?? []
    } catch { return [] }
  }

  async markCouponsSettled(tokens: string[]): Promise<void> {
    if (!tokens.length) return
    try {
      await this.db
        .from('coupons')
        .update({ merchant_settled: true, merchant_settled_at: new Date().toISOString() })
        .in('token', tokens)
    } catch { /* silently fail */ }
  }
}
