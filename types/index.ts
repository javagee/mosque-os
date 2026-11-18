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
    label: 'Infaq',
    arabic: 'إنفاق',
    description: 'Voluntary spending in the way of Allah',
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
  coupon_tokens?: string[]  // populated after admin verification
  created_at: string
  paid_at?: string         // when buyer clicked "I've paid"
  verified_at?: string     // when admin confirmed payment received
  merchant_settled?: boolean
  merchant_settled_at?: string
}

// ── Ramadan Sadaqah Board types ───────────────────────────────────────────────

export interface RamadanSponsor {
  id: string
  night: number
  year: number
  donor_name: string
  donor_email: string
  amount: number        // in cents
  message?: string
  anonymous: boolean
  status: 'pending' | 'confirmed'
  order_reference?: string
  created_at: string
}

export interface RamadanNightData {
  night: number         // 1–30
  target: number        // in cents
  raised: number        // in cents (sum of confirmed sponsors)
  sponsors: RamadanSponsor[]
  status: 'available' | 'partial' | 'sponsored'
}

export interface RamadanConfig {
  year: number
  default_target: number            // in cents, e.g. 10000 = S$100
  night_targets: Record<number, number>  // per-night overrides
  active: boolean
  hijri_month?: string              // e.g. "Ramadan 1446"
}

// ── Jemaah (Congregation) types ──────────────────────────────────────────────

export interface Jemaah {
  id: string        // JM-XXXXXX
  name: string
  email: string
  phone?: string
  created_at: string
}

export interface JemaahCheckIn {
  jemaah_id: string
  date: string      // YYYY-MM-DD
  checked_in_at: string
}

// ── Events ────────────────────────────────────────────────────────────────────

export interface MosqueEvent {
  id: string
  title: string
  description?: string
  date: string          // YYYY-MM-DD
  time: string          // HH:MM (24h)
  end_time?: string
  venue?: string
  capacity?: number
  fee: number           // cents, 0 = free
  registration_deadline?: string  // YYYY-MM-DD
  active: boolean
  created_at: string
}

export interface EventRegistration {
  id: string
  event_id: string
  event_title: string
  name: string
  email: string
  phone?: string
  pax: number
  status: 'confirmed' | 'cancelled'
  created_at: string
}

// ── Facility Booking ──────────────────────────────────────────────────────────

export interface Facility {
  id: string
  name: string
  description?: string
  capacity?: number
  active: boolean
  created_at: string
}

export interface FacilityBooking {
  id: string
  facility_id: string
  facility_name: string
  date: string          // YYYY-MM-DD
  start_time: string    // HH:MM
  end_time: string      // HH:MM
  purpose: string
  organizer_name: string
  organizer_email: string
  organizer_phone?: string
  pax?: number
  status: 'pending' | 'confirmed' | 'rejected'
  admin_notes?: string
  created_at: string
}

// ── Waqf Asset Registry ───────────────────────────────────────────────────────

export type WaqfAssetType = 'cash' | 'property' | 'sukuk' | 'other'
export type WaqfAssetStatus = 'active' | 'suspended' | 'terminated'

export interface WaqfAsset {
  id: string                    // WAQ-XXXXXX
  name: string
  type: WaqfAssetType
  waqf_mode?: 'income' | 'asset'  // income = Route A (returns distributed); asset = Route B (capital → registered asset)
  designation?: 'am' | 'khas'  // Am = general purpose; Khas = deed-restricted specific purpose (IAAS)
  description?: string
  shariah_cert_ref?: string
  registry_ref?: string         // waqf registry reference (any country)
  deed_ref?: string             // governing deed / instrument reference
  trustee_name?: string         // mutawalli / nazhir / appointed trustee name
  jurisdiction_code?: string    // e.g. SG, MY-JHR, ID-BWI, JO, Global
  currency: string              // ISO code: USD, GBP, SGD, JOD, SAR, AED, MYR…
  country?: string              // human-readable country / region label
  principal: number             // cents — locked, never disbursed
  returns_available: number     // cents — spendable returns
  returns_ytd: number           // cents
  returns_lifetime: number      // cents
  unit_price: number            // cents per share
  status: WaqfAssetStatus
  established_at: string        // YYYY-MM-DD
  created_at: string
}

export interface WaqfShare {
  id: string                    // SHR-XXXXXX
  asset_id: string
  asset_name: string
  currency: string
  donor_name: string
  donor_email: string
  shares: number
  unit_price: number            // cents at time of purchase
  total: number                 // cents
  order_reference?: string      // IMA-XXXXXX PayNow order
  status: 'pending' | 'confirmed'
  created_at: string
}

export type WaqfTxType = 'contribution' | 'return_earned' | 'disbursement' | 'admin_fee' | 'asset_acquisition' | 'asset_registered'

export interface WaqfTransaction {
  id: string                    // WTX-XXXXXX
  asset_id: string
  type: WaqfTxType
  amount: number                // cents (positive = in, negative = out for disbursement)
  note?: string
  jurisdiction_code?: string    // from asset at time of transaction (partial audit trail)
  rule_note?: string            // approving authority / rule reference
  beneficiary_name?: string     // named beneficiary or recipient (Ghazali Route A)
  settlement_ref?: string       // custodian/bank external reference (required for IAAS settlement)
  asset_registry_ref?: string   // waqf asset registry reference (Ghazali Route B — asset acquisition)
  created_by?: string
  created_at: string
}

// ── Sadaqah Fund Journey ──────────────────────────────────────────────────────

export interface SadaqahFund {
  id: string              // SAF-XXXXXX
  name: string
  description?: string
  currency: string
  purpose_tag?: string    // optional label (e.g. "Food Aid", "Medical", "Education")
  balance: number         // cents — available to allocate
  received_total: number  // cents — lifetime receipts
  disbursed_total: number // cents — lifetime disbursements
  status: 'active' | 'closed'
  created_at: string
}

export type SadaqahAllocationStatus = 'pending' | 'approved' | 'claimed' | 'settled'

export interface SadaqahAllocation {
  id: string              // SAL-XXXXXX
  fund_id: string
  fund_name: string
  amount: number          // cents
  currency: string
  purpose: string
  beneficiary_name?: string
  beneficiary_id?: string // BNF-XXXXXX from registry
  status: SadaqahAllocationStatus
  claim_id?: string       // SDQ-XXXXXX when claim issued
  settlement_ref?: string
  approved_at?: string
  created_at: string
}

export type SadaqahClaimStatus = 'pending' | 'redeemed' | 'settled' | 'expired'

export interface SadaqahClaim {
  id: string              // SDQ-XXXXXX
  fund_id: string
  fund_name: string
  allocation_id: string
  beneficiary_name?: string
  amount: number
  currency: string
  purpose: string
  status: SadaqahClaimStatus
  issued_at: string
  redeemed_at?: string
  redeemed_by?: string
  invoice_ref?: string
  settlement_ref?: string
  settled_at?: string
}

// ── Waqf Claim QR Vouchers ────────────────────────────────────────────────────

export type WaqfClaimStatus = 'pending' | 'redeemed' | 'settled' | 'expired'

export interface WaqfClaim {
  id: string              // CLM-XXXXXX (also the token)
  asset_id: string
  asset_name: string
  tx_id: string           // linked WaqfTransaction (disbursement)
  beneficiary_name?: string
  amount: number          // cents — deducted from returns_available at issue time
  currency: string
  purpose: string
  jurisdiction_code?: string
  status: WaqfClaimStatus
  issued_at: string
  redeemed_at?: string
  redeemed_by?: string    // merchant outlet name
  invoice_ref?: string    // merchant invoice reference
  settlement_ref?: string // custodian/bank reference (admin adds after transfer)
  settled_at?: string
}

// ── Beneficiary / Asnaf Registry ─────────────────────────────────────────────

export type AsnafCategory =
  | 'fakir'          // destitute — no income, no assets
  | 'miskin'         // poor — insufficient income
  | 'amil'           // zakat collector / administrator
  | 'muallaf'        // new Muslim or whose heart is being won
  | 'riqab'          // freeing from bondage (historical)
  | 'gharimin'       // the indebted
  | 'fi_sabilillah'  // in the path of Allah — education, da'wah
  | 'ibnu_sabil'     // stranded traveller
  | 'general'        // non-asnaf — sadaqah/waqf income only, not zakat

export type BeneficiaryStatus = 'active' | 'inactive' | 'pending_review'

export interface Beneficiary {
  id: string                    // BNF-XXXXXX
  name: string
  ic_ref?: string               // last 4 of IC/passport only (privacy)
  phone?: string
  email?: string
  asnaf_category: AsnafCategory
  zakat_eligible: boolean       // true for all asnaf except 'general'
  jurisdiction_code?: string    // SG, MY-JHR, ID-BWI, etc.
  case_ref?: string             // internal case/file reference
  notes?: string
  status: BeneficiaryStatus
  created_at: string
  updated_at?: string
}

export const ASNAF_META: Record<AsnafCategory, { label: string; arabic: string; zakat: boolean; color: string }> = {
  fakir:         { label: 'Fakir',         arabic: 'فقير',       zakat: true,  color: 'bg-red-100 text-red-700' },
  miskin:        { label: 'Miskin',        arabic: 'مسكين',      zakat: true,  color: 'bg-orange-100 text-orange-700' },
  amil:          { label: 'Amil',          arabic: 'عامل',       zakat: true,  color: 'bg-blue-100 text-blue-700' },
  muallaf:       { label: 'Muallaf',       arabic: 'مؤلفة',      zakat: true,  color: 'bg-teal-100 text-teal-700' },
  riqab:         { label: 'Riqab',         arabic: 'رقاب',       zakat: true,  color: 'bg-slate-100 text-slate-600' },
  gharimin:      { label: 'Gharimin',      arabic: 'غارمين',     zakat: true,  color: 'bg-amber-100 text-amber-700' },
  fi_sabilillah: { label: 'Fi Sabilillah', arabic: 'في سبيل الله', zakat: true, color: 'bg-green-100 text-green-700' },
  ibnu_sabil:    { label: 'Ibnu Sabil',    arabic: 'ابن السبيل', zakat: true,  color: 'bg-indigo-100 text-indigo-700' },
  general:       { label: 'General',       arabic: 'عام',        zakat: false, color: 'bg-gray-100 text-gray-600' },
}

// ── Qurbani (Udhiyah) ─────────────────────────────────────────────────────────

export type QurbaniAnimalType = 'sheep' | 'goat' | 'cow_share' | 'cow_full' | 'buffalo_share' | 'buffalo_full'
export type QurbaniNiyyah = 'self' | 'deceased' | 'family' | 'general'
export type QurbaniOrderStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'partner_allocated'
  | 'animal_verified'
  | 'evidence_uploaded'
  | 'slaughter_approved'
  | 'slaughtered'
  | 'meat_processed'
  | 'distribution_dispatched'
  | 'distributed'
  | 'certificate_issued'
  | 'financially_settled'
  | 'closed'
  | 'cancelled'

export interface QurbaniAnimalConfig {
  type: QurbaniAnimalType
  label: string
  arabic: string
  pax: number
  price: number           // cents
  capacity?: number
}

export interface QurbaniCampaign {
  id: string              // QRB-XXXXXX
  year: number
  hijri_year?: string
  eid_date: string        // YYYY-MM-DD
  fulfilment_deadline: string
  currency: string
  animals: QurbaniAnimalConfig[]
  active: boolean
  created_at: string
}

export interface QurbaniOrder {
  id: string              // QOR-XXXXXX
  campaign_id: string
  animal_type: QurbaniAnimalType
  animal_label: string
  niyyah: QurbaniNiyyah
  niyyah_name?: string
  donor_name: string
  donor_email: string
  donor_phone?: string
  amount: number          // cents
  currency: string
  order_reference: string // IMA-XXXXXX
  status: QurbaniOrderStatus
  slaughter_date?: string
  slaughter_location?: string
  halal_cert_ref?: string
  fulfilment_note?: string
  partner_id?: string
  partner_name?: string
  animal_id?: string
  scheduled_slaughter_datetime?: string
  slaughter_evidence_url?: string
  meat_weight_kg?: number
  distribution_evidence_url?: string
  certificate_url?: string
  financial_settlement_ref?: string
  created_at: string
}

export interface QurbaniPartner {
  id: string              // QPT-XXXXXX
  name: string
  country?: string
  address?: string
  halal_cert_number?: string
  capacity_per_day: number
  animal_types: QurbaniAnimalType[]
  active: boolean
  created_at: string
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
  merchant_settled?: boolean
  merchant_settled_at?: string
}
