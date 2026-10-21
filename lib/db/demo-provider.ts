import type { Campaign, Coupon, Donor } from '@/types'
import type { DbProvider, CouponInsert, DonorInsert, CouponCounts } from './types'

const DEMO_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-001',
    name: 'Spring Chicken Meal',
    merchant_name: "Arnold's",
    description: "Arnold's famous crispy spring chicken meal with sides — proceeds go directly to the mosque renovation fund.",
    coupon_price: 1800, currency: 'sgd', total_coupons: 100, coupons_sold: 23,
    image_url: '/images/arnolds-spring-chicken.png', active: true,
    redemption_end: new Date(Date.now() + 180 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'camp-002',
    name: 'Family Rice Set',
    merchant_name: 'Nasi Lemak Wangi',
    description: 'Fragrant coconut rice with sambal, crispy anchovies, and your choice of protein.',
    coupon_price: 1200, currency: 'sgd', total_coupons: 150, coupons_sold: 41,
    image_url: '/images/nasi-lemak-family-set.jpg', active: true,
    redemption_end: new Date(Date.now() + 180 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'camp-003',
    name: 'Murtabak Special',
    merchant_name: 'Zam Zam Restaurant',
    description: 'Classic stuffed savoury pancake with spiced minced meat and egg, served with curry sauce.',
    coupon_price: 1500, currency: 'sgd', total_coupons: 80, coupons_sold: 12,
    image_url: '/images/murtabak-samosa.jpg', active: true,
    redemption_end: new Date(Date.now() + 180 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'camp-004',
    name: 'Chicken Briyani Set',
    merchant_name: 'Bismillah Briyani',
    description: 'Aromatic long-grain basmati rice cooked with tender chicken and whole spices.',
    coupon_price: 2000, currency: 'sgd', total_coupons: 60, coupons_sold: 8,
    image_url: '/images/briyani-set.jpg', active: true,
    redemption_end: new Date(Date.now() + 180 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'camp-005',
    name: 'Roti Prata Combo',
    merchant_name: 'Springleaf Prata Place',
    description: 'Classic crispy roti prata with dhal and fish curry. Includes 2 prata + 1 drink.',
    coupon_price: 800, currency: 'sgd', total_coupons: 120, coupons_sold: 35,
    image_url: '/images/roti-prata.jpg', active: true,
    redemption_end: new Date(Date.now() + 90 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'camp-006',
    name: 'Teh Tarik & Snack Set',
    merchant_name: 'Kopitiam Corner',
    description: 'Traditional pulled milk tea with a light snack platter. Freshly made to order.',
    coupon_price: 600, currency: 'sgd', total_coupons: 150, coupons_sold: 67,
    image_url: '/images/teh-tarik-set.jpg', active: true,
    redemption_end: new Date(Date.now() + 90 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'camp-007',
    name: 'Grilled Lamb Chop',
    merchant_name: 'Al-Barakah Grill',
    description: 'Juicy marinated lamb chop grilled to perfection, served with basmati rice and salad.',
    coupon_price: 2800, currency: 'sgd', total_coupons: 50, coupons_sold: 5,
    image_url: '/images/lamb-chop.jpg', active: true,
    redemption_end: new Date(Date.now() + 60 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'camp-008',
    name: 'Pasta Halal Platter',
    merchant_name: 'Bella Cucina Halal',
    description: 'Hearty halal pasta in aglio olio or creamy mushroom sauce. Served with garlic bread.',
    coupon_price: 1800, currency: 'sgd', total_coupons: 70, coupons_sold: 19,
    image_url: '/images/pasta-halal.jpg', active: true,
    redemption_end: new Date(Date.now() + 60 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
  },
]

export class DemoProvider implements DbProvider {
  async getCampaigns(): Promise<Campaign[]> { return DEMO_CAMPAIGNS }
  async getCampaign(id: string): Promise<Campaign | null> {
    return DEMO_CAMPAIGNS.find((c) => c.id === id) ?? null
  }
  async updateCampaignSoldCount(): Promise<void> {}
  async getCouponByToken(): Promise<Coupon | null> { return null }
  async createCoupons(): Promise<Coupon[]> { return [] }
  async redeemCoupon(): Promise<Coupon | null> { return null }
  async getCouponCountsByCampaign(campaignIds: string[]): Promise<Record<string, CouponCounts>> {
    return Object.fromEntries(campaignIds.map((id) => [id, { active: 0, redeemed: 0 }]))
  }
  async countCouponsForCampaign(): Promise<number> { return 0 }
  async getDonors(): Promise<Donor[]> { return [] }
  async createDonor(): Promise<void> {}
}
