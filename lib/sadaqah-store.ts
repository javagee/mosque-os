import type { SadaqahFund, SadaqahAllocation, SadaqahClaim, SadaqahAllocationStatus, SadaqahClaimStatus } from '@/types'

async function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  const { Redis } = await import('@upstash/redis')
  return new Redis({ url, token })
}

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function genId(prefix: string) {
  let id = prefix
  for (let i = 0; i < 6; i++) id += CHARS[Math.floor(Math.random() * CHARS.length)]
  return id
}
export const generateFundId       = () => genId('SAF-')
export const generateAllocationId = () => genId('SAL-')
export const generateSadaqahClaimId = () => genId('SDQ-')

// ── in-memory fallback ────────────────────────────────────────────────────────
const memFunds = new Map<string, SadaqahFund>()
const memAllocs = new Map<string, SadaqahAllocation>()
const memClaims = new Map<string, SadaqahClaim>()
const memFundAllocs = new Map<string, string[]>()

// ── Funds ─────────────────────────────────────────────────────────────────────

export async function saveSadaqahFund(f: SadaqahFund): Promise<void> {
  const r = await getRedis()
  if (r) { await r.set(`sadaqah:fund:${f.id}`, f); await r.sadd('sadaqah:funds:all', f.id) }
  else memFunds.set(f.id, f)
}

export async function getSadaqahFund(id: string): Promise<SadaqahFund | null> {
  const r = await getRedis()
  if (r) return r.get<SadaqahFund>(`sadaqah:fund:${id}`)
  return memFunds.get(id) ?? null
}

export async function getAllSadaqahFunds(): Promise<SadaqahFund[]> {
  const r = await getRedis()
  if (r) {
    const ids = await r.smembers('sadaqah:funds:all')
    if (!ids.length) return []
    const items = await Promise.all(ids.map(id => r.get<SadaqahFund>(`sadaqah:fund:${id}`)))
    return items.filter((f): f is SadaqahFund => f !== null)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
  return [...memFunds.values()].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

// ── Allocations ───────────────────────────────────────────────────────────────

export async function saveSadaqahAllocation(a: SadaqahAllocation): Promise<void> {
  const r = await getRedis()
  if (r) {
    await r.set(`sadaqah:alloc:${a.id}`, a)
    await r.sadd('sadaqah:allocs:all', a.id)
    await r.lpush(`sadaqah:fund:${a.fund_id}:allocs`, a.id)
  } else {
    memAllocs.set(a.id, a)
    if (!memFundAllocs.has(a.fund_id)) memFundAllocs.set(a.fund_id, [])
    if (!memFundAllocs.get(a.fund_id)!.includes(a.id)) memFundAllocs.get(a.fund_id)!.unshift(a.id)
  }
}

export async function getSadaqahAllocation(id: string): Promise<SadaqahAllocation | null> {
  const r = await getRedis()
  if (r) return r.get<SadaqahAllocation>(`sadaqah:alloc:${id}`)
  return memAllocs.get(id) ?? null
}

export async function getAllSadaqahAllocations(): Promise<SadaqahAllocation[]> {
  const r = await getRedis()
  if (r) {
    const ids = await r.smembers('sadaqah:allocs:all')
    if (!ids.length) return []
    const items = await Promise.all(ids.map(id => r.get<SadaqahAllocation>(`sadaqah:alloc:${id}`)))
    return items.filter((a): a is SadaqahAllocation => a !== null)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
  return [...memAllocs.values()].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export async function getFundAllocations(fundId: string): Promise<SadaqahAllocation[]> {
  const r = await getRedis()
  if (r) {
    const ids = await r.lrange(`sadaqah:fund:${fundId}:allocs`, 0, 49)
    if (!ids.length) return []
    const items = await Promise.all(ids.map(id => r.get<SadaqahAllocation>(`sadaqah:alloc:${id}`)))
    return items.filter((a): a is SadaqahAllocation => a !== null)
  }
  const ids = memFundAllocs.get(fundId) ?? []
  return ids.map(id => memAllocs.get(id)).filter((a): a is SadaqahAllocation => a !== null)
}

// ── Claims ────────────────────────────────────────────────────────────────────

export async function saveSadaqahClaim(c: SadaqahClaim): Promise<void> {
  const r = await getRedis()
  if (r) { await r.set(`sadaqah:claim:${c.id}`, c); await r.sadd('sadaqah:claims:all', c.id) }
  else memClaims.set(c.id, c)
}

export async function getSadaqahClaim(id: string): Promise<SadaqahClaim | null> {
  const r = await getRedis()
  if (r) return r.get<SadaqahClaim>(`sadaqah:claim:${id}`)
  return memClaims.get(id) ?? null
}

// ── Seed ──────────────────────────────────────────────────────────────────────

export async function seedSadaqahData(): Promise<boolean> {
  const existing = await getAllSadaqahFunds()
  if (existing.length > 0) return false

  const now = new Date().toISOString()

  const funds: SadaqahFund[] = [
    { id: generateFundId(), name: 'General Sadaqah Fund', description: 'Voluntary charitable giving for general community welfare and emergency assistance.', currency: 'SGD', purpose_tag: 'General', balance: 450000, received_total: 620000, disbursed_total: 170000, status: 'active', created_at: now },
    { id: generateFundId(), name: 'Palestine Relief Fund', description: 'Dedicated sadaqah for families and communities in Palestine and the broader Arab world.', currency: 'USD', purpose_tag: 'Humanitarian', balance: 185000, received_total: 320000, disbursed_total: 135000, status: 'active', created_at: now },
    { id: generateFundId(), name: 'Food Aid Programme', description: 'Monthly food basket distribution to underprivileged families in the community.', currency: 'SGD', purpose_tag: 'Food Aid', balance: 72000, received_total: 150000, disbursed_total: 78000, status: 'active', created_at: now },
  ]
  await Promise.all(funds.map(saveSadaqahFund))

  // Sample allocations
  const allocs: SadaqahAllocation[] = [
    { id: generateAllocationId(), fund_id: funds[0].id, fund_name: funds[0].name, amount: 15000, currency: 'SGD', purpose: 'Emergency food assistance for Ahmad bin Yusuf family (3 children)', beneficiary_name: 'Ahmad bin Yusuf', status: 'pending' as SadaqahAllocationStatus, created_at: now },
    { id: generateAllocationId(), fund_id: funds[0].id, fund_name: funds[0].name, amount: 25000, currency: 'SGD', purpose: 'Medical expense support for Maryam bte Hassan', beneficiary_name: 'Maryam bte Hassan', status: 'approved' as SadaqahAllocationStatus, approved_at: now, created_at: now },
    { id: generateAllocationId(), fund_id: funds[2].id, fund_name: funds[2].name, amount: 18000, currency: 'SGD', purpose: 'Monthly food basket — Bilal household (February)', beneficiary_name: 'Bilal Al-Rashidi', status: 'approved' as SadaqahAllocationStatus, approved_at: now, created_at: now },
  ]
  await Promise.all(allocs.map(saveSadaqahAllocation))

  return true
}
