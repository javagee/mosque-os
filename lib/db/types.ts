import type { Campaign, Coupon, Donor } from '@/types'

export interface CouponInsert {
  token: string
  serial_number: string
  campaign_id: string
  buyer_name: string
  buyer_email: string
  stripe_session_id: string
  status: 'active'
}

export interface DonorInsert {
  name: string
  email: string
  amount: number
  currency: string
  category: string
  type: string
  stripe_session_id: string
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
}

export interface CouponCounts {
  total: number
  redeemed: number
}

export interface DbProvider {
  // Campaigns
  getCampaigns(): Promise<Campaign[]>
  getCampaign(id: string): Promise<Campaign | null>
  updateCampaignSoldCount(id: string, increment: number): Promise<void>

  // Coupons
  getCouponByToken(token: string): Promise<Coupon | null>
  createCoupons(coupons: CouponInsert[], campaignSnapshot: Campaign): Promise<Coupon[]>
  redeemCoupon(token: string, outlet: string | null): Promise<Coupon | null>
  getCouponCountsByCampaign(campaignIds: string[]): Promise<Record<string, CouponCounts>>
  countCouponsForCampaign(campaignId: string): Promise<number>

  // Donors
  getDonors(): Promise<Donor[]>
  createDonor(donor: DonorInsert): Promise<void>
}
