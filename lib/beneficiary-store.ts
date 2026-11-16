import type { Beneficiary, AsnafCategory } from '@/types'

async function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  const { Redis } = await import('@upstash/redis')
  return new Redis({ url, token })
}

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function genId() {
  let id = 'BNF-'
  for (let i = 0; i < 6; i++) id += CHARS[Math.floor(Math.random() * CHARS.length)]
  return id
}

const memStore = new Map<string, Beneficiary>()

export async function saveBeneficiary(b: Beneficiary): Promise<void> {
  const r = await getRedis()
  if (r) {
    await r.set(`beneficiary:${b.id}`, b)
    await r.sadd('beneficiaries:all', b.id)
  } else {
    memStore.set(b.id, b)
  }
}

export async function getBeneficiary(id: string): Promise<Beneficiary | null> {
  const r = await getRedis()
  if (r) return r.get<Beneficiary>(`beneficiary:${id}`)
  return memStore.get(id) ?? null
}

export async function getAllBeneficiaries(): Promise<Beneficiary[]> {
  const r = await getRedis()
  if (r) {
    const ids = await r.smembers('beneficiaries:all')
    if (!ids.length) return []
    const items = await Promise.all(ids.map(id => r.get<Beneficiary>(`beneficiary:${id}`)))
    return items
      .filter((b): b is Beneficiary => b !== null)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
  return [...memStore.values()].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export async function createBeneficiary(data: Omit<Beneficiary, 'id' | 'created_at'>): Promise<Beneficiary> {
  const b: Beneficiary = { ...data, id: genId(), created_at: new Date().toISOString() }
  await saveBeneficiary(b)
  return b
}

export async function seedBeneficiaries(): Promise<boolean> {
  const existing = await getAllBeneficiaries()
  if (existing.length > 0) return false

  const now = new Date().toISOString()
  const seed: Omit<Beneficiary, 'id' | 'created_at'>[] = [
    { name: 'Ahmad bin Yusuf',       asnaf_category: 'fakir',         zakat_eligible: true,  ic_ref: '1234', jurisdiction_code: 'SG',     case_ref: 'SG-2024-001', status: 'active',         notes: 'Single father, no income. Referred by mosque social committee.' },
    { name: 'Maryam bte Hassan',     asnaf_category: 'miskin',        zakat_eligible: true,  ic_ref: '5678', jurisdiction_code: 'SG',     case_ref: 'SG-2024-002', status: 'active',         notes: 'Part-time cleaner, two school-age children.' },
    { name: 'Bilal Al-Rashidi',      asnaf_category: 'gharimin',      zakat_eligible: true,  ic_ref: '9012', jurisdiction_code: 'MY-JHR', case_ref: 'MY-2024-005', status: 'active',         notes: 'Medical debt after hospitalisation. Repayment plan in place.' },
    { name: 'Zainab Ibrahim',        asnaf_category: 'muallaf',       zakat_eligible: true,  ic_ref: '3456', jurisdiction_code: 'SG',     case_ref: 'SG-2024-003', status: 'active',         notes: 'Converted 8 months ago. No family support network.' },
    { name: 'Community Youth Prog.', asnaf_category: 'fi_sabilillah', zakat_eligible: true,  jurisdiction_code: 'SG',     case_ref: 'SG-2024-010', status: 'active',         notes: 'Islamic education and skills programme for 15-25 age group.' },
    { name: 'Fatimah Al-Noor',       asnaf_category: 'ibnu_sabil',    zakat_eligible: true,  ic_ref: '7890', jurisdiction_code: 'JO',     case_ref: 'JO-2024-001', status: 'pending_review', notes: 'Displaced family, registered with JAWF. Awaiting case verification.' },
    { name: 'Al-Quds Aid Network',   asnaf_category: 'general',       zakat_eligible: false, jurisdiction_code: 'JO',     case_ref: 'JO-2024-002', status: 'active',         notes: 'Sadaqah and waqf income eligible. Not eligible for zakat distribution.' },
  ]

  for (const s of seed) {
    await saveBeneficiary({ ...s, id: genId(), created_at: now })
  }
  return true
}
