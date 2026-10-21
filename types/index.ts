export type DonationCategory = 'zakat' | 'sadaqah' | 'waqf' | 'lillah' | 'general'

export type DonationType = 'one-time' | 'monthly'

export interface Donor {
  id: string
  name: string
  email: string
  amount: number
  currency: string
  category: DonationCategory
  type: DonationType
  stripe_session_id: string
  created_at: string
}

export interface PrayerTime {
  name: string
  arabic: string
  time: string
  iqamah?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export const DONATION_CATEGORIES: Record<DonationCategory, { label: string; arabic: string; description: string; color: string }> = {
  zakat: {
    label: 'Zakat',
    arabic: 'زكاة',
    description: 'Obligatory annual purification of wealth',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  sadaqah: {
    label: 'Sadaqah',
    arabic: 'صدقة',
    description: 'Voluntary charity for any good cause',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  waqf: {
    label: 'Waqf',
    arabic: 'وقف',
    description: 'Endowment for the mosque building & facilities',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  lillah: {
    label: "Lillah",
    arabic: 'لله',
    description: "Donation purely for the sake of Allah",
    color: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  general: {
    label: 'General Fund',
    arabic: 'عام',
    description: 'Support day-to-day mosque operations',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
  },
}

export const PRESET_AMOUNTS = [5, 10, 25, 50, 100, 250]

// ── Coupon / Campaign types ───────────────────────────────────────────────────

export type CouponStatus = 'active' | 'redeemed' | 'expired'

export interface Campaign {
  id: string
  name: string
  description?: string
  merchant_name: string
  coupon_price: number   // in smallest currency unit (cents/pence/cents SGD)
  currency: string
  total_coupons?: number
  coupons_sold: number
  redemption_start?: string
  redemption_end?: string
  image_url?: string
  terms?: string[]
  active: boolean
  created_at: string
}

// ── Order types (PayNow flow) ─────────────────────────────────────────────────

export type OrderStatus = 'pending_payment' | 'pending_verification' | 'verified' | 'cancelled'

export interface Order {
  reference: string
  campaign_id: string
  campaign_name: string
  merchant_name: string
  buyer_name: string
  buyer_email: string
  quantity: number
  unit_price: number      // in cents
  total: number           // in cents
  currency: string
  mosque_portion: number  // in cents (e.g. 50% of total)
  merchant_portion: number
  status: OrderStatus
  created_at: string
  paid_at?: string         // when buyer clicked "I've paid"
  verified_at?: string     // when admin confirmed payment received
  merchant_settled?: boolean
  merchant_settled_at?: string
}

export interface Coupon {
  id: string
  token: string
  serial_number: string
  campaign_id: string
  campaign?: Campaign
  buyer_name: string
  buyer_email: string
  stripe_session_id: string
  status: CouponStatus
  redeemed_at?: string
  redeemed_outlet?: string
  created_at: string
}
