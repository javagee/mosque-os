// Pending donation store — mirrors order-store pattern.
// A PendingDonation lives here until admin verifies; then db.createDonor() is called.
// Key schema:
//   donation:{reference}          → PendingDonation JSON
//   donations:pending_verification → Set of references awaiting admin bank check

export interface PendingDonation {
  reference: string       // DON-XXXXXX
  donor_name: string
  donor_email: string
  amount: number          // cents
  currency: string
  category: string
  type: string            // 'one-time' | 'monthly'
  status: 'pending_payment' | 'pending_verification' | 'verified'
  created_at: string
  paid_at?: string
  verified_at?: string
}

async function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  const { Redis } = await import('@upstash/redis')
  return new Redis({ url, token })
}

const mem = new Map<string, PendingDonation>()

export async function saveDonation(d: PendingDonation): Promise<void> {
  const r = await getRedis()
  if (r) {
    await r.set(`donation:${d.reference}`, d)
    if (d.status === 'pending_verification') {
      await r.sadd('donations:pending_verification', d.reference)
    }
    if (d.status === 'verified') {
      await r.srem('donations:pending_verification', d.reference)
    }
  } else {
    mem.set(d.reference, d)
  }
}

export async function getDonation(reference: string): Promise<PendingDonation | null> {
  const r = await getRedis()
  if (r) return r.get<PendingDonation>(`donation:${reference}`)
  return mem.get(reference) ?? null
}

export async function getPendingDonations(): Promise<PendingDonation[]> {
  const r = await getRedis()
  if (r) {
    const refs = await r.smembers('donations:pending_verification')
    if (!refs.length) return []
    const items = await Promise.all(refs.map(ref => r.get<PendingDonation>(`donation:${ref}`)))
    return items
      .filter((d): d is PendingDonation => d !== null)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
  return [...mem.values()]
    .filter(d => d.status === 'pending_verification')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}
