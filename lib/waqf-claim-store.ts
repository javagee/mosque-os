import type { WaqfClaim } from '@/types'

async function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  const { Redis } = await import('@upstash/redis')
  return new Redis({ url, token })
}

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function generateClaimId() {
  let id = 'CLM-'
  for (let i = 0; i < 6; i++) id += CHARS[Math.floor(Math.random() * CHARS.length)]
  return id
}

const memStore = new Map<string, WaqfClaim>()
const memByAsset = new Map<string, string[]>()

export async function saveWaqfClaim(claim: WaqfClaim): Promise<void> {
  const r = await getRedis()
  if (r) {
    await r.set(`waqf:claim:${claim.id}`, claim)
    await r.sadd('waqf:claims:all', claim.id)
    await r.lpush(`waqf:asset:${claim.asset_id}:claims`, claim.id)
  } else {
    memStore.set(claim.id, claim)
    if (!memByAsset.has(claim.asset_id)) memByAsset.set(claim.asset_id, [])
    if (!memByAsset.get(claim.asset_id)!.includes(claim.id)) {
      memByAsset.get(claim.asset_id)!.unshift(claim.id)
    }
  }
}

export async function getWaqfClaim(id: string): Promise<WaqfClaim | null> {
  const r = await getRedis()
  if (r) return r.get<WaqfClaim>(`waqf:claim:${id}`)
  return memStore.get(id) ?? null
}

export async function getAssetClaims(assetId: string): Promise<WaqfClaim[]> {
  const r = await getRedis()
  if (r) {
    const ids = await r.lrange(`waqf:asset:${assetId}:claims`, 0, 49)
    if (!ids.length) return []
    const items = await Promise.all(ids.map(id => r.get<WaqfClaim>(`waqf:claim:${id}`)))
    return items.filter((c): c is WaqfClaim => c !== null)
  }
  const ids = memByAsset.get(assetId) ?? []
  return ids.map(id => memStore.get(id)).filter((c): c is WaqfClaim => c !== null)
}
