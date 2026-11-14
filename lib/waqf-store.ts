import type { WaqfAsset, WaqfShare, WaqfTransaction } from '@/types'

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

export const generateWaqfId = () => genId('WAQ-')
export const generateShareId = () => genId('SHR-')
export const generateTxId = () => genId('WTX-')

const memAssets = new Map<string, WaqfAsset>()
const memShares = new Map<string, WaqfShare>()
const memTxs = new Map<string, WaqfTransaction>()
const memAssetShares = new Map<string, Set<string>>()
const memAssetTxs = new Map<string, string[]>()

export async function saveWaqfAsset(asset: WaqfAsset): Promise<void> {
  const r = await getRedis()
  if (r) {
    await r.set(`waqf:asset:${asset.id}`, asset)
    await r.sadd('waqf:assets:all', asset.id)
  } else {
    memAssets.set(asset.id, asset)
  }
}

export async function getWaqfAsset(id: string): Promise<WaqfAsset | null> {
  const r = await getRedis()
  if (r) return r.get<WaqfAsset>(`waqf:asset:${id}`)
  return memAssets.get(id) ?? null
}

export async function getAllWaqfAssets(): Promise<WaqfAsset[]> {
  const r = await getRedis()
  if (r) {
    const ids = await r.smembers('waqf:assets:all')
    if (!ids.length) return []
    const assets = await Promise.all(ids.map(id => r.get<WaqfAsset>(`waqf:asset:${id}`)))
    return assets
      .filter((a): a is WaqfAsset => a !== null)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
  return [...memAssets.values()].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export async function saveWaqfShare(share: WaqfShare): Promise<void> {
  const r = await getRedis()
  if (r) {
    await r.set(`waqf:share:${share.id}`, share)
    await r.sadd('waqf:shares:all', share.id)
    await r.sadd(`waqf:asset:${share.asset_id}:shares`, share.id)
  } else {
    memShares.set(share.id, share)
    if (!memAssetShares.has(share.asset_id)) memAssetShares.set(share.asset_id, new Set())
    memAssetShares.get(share.asset_id)!.add(share.id)
  }
}

export async function getWaqfShare(id: string): Promise<WaqfShare | null> {
  const r = await getRedis()
  if (r) return r.get<WaqfShare>(`waqf:share:${id}`)
  return memShares.get(id) ?? null
}

export async function getAssetShares(assetId: string): Promise<WaqfShare[]> {
  const r = await getRedis()
  if (r) {
    const ids = await r.smembers(`waqf:asset:${assetId}:shares`)
    if (!ids.length) return []
    const shares = await Promise.all(ids.map(id => r.get<WaqfShare>(`waqf:share:${id}`)))
    return shares
      .filter((s): s is WaqfShare => s !== null)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
  const ids = [...(memAssetShares.get(assetId) ?? [])]
  return ids.map(id => memShares.get(id)).filter((s): s is WaqfShare => s !== null)
}

export async function saveWaqfTx(tx: WaqfTransaction): Promise<void> {
  const r = await getRedis()
  if (r) {
    await r.set(`waqf:tx:${tx.id}`, tx)
    await r.lpush(`waqf:asset:${tx.asset_id}:transactions`, tx.id)
  } else {
    memTxs.set(tx.id, tx)
    if (!memAssetTxs.has(tx.asset_id)) memAssetTxs.set(tx.asset_id, [])
    memAssetTxs.get(tx.asset_id)!.unshift(tx.id)
  }
}

export async function getAssetTransactions(assetId: string): Promise<WaqfTransaction[]> {
  const r = await getRedis()
  if (r) {
    const ids = await r.lrange(`waqf:asset:${assetId}:transactions`, 0, 19)
    if (!ids.length) return []
    const txs = await Promise.all(ids.map(id => r.get<WaqfTransaction>(`waqf:tx:${id}`)))
    return txs.filter((t): t is WaqfTransaction => t !== null)
  }
  const ids = memAssetTxs.get(assetId) ?? []
  return ids.slice(0, 20).map(id => memTxs.get(id)).filter((t): t is WaqfTransaction => t !== null)
}

export async function seedDemoData(): Promise<boolean> {
  const existing = await getAllWaqfAssets()
  if (existing.length > 0) return false

  const now = new Date().toISOString()
  const assets: WaqfAsset[] = [
    {
      id: generateWaqfId(), name: 'Global Education Waqf', type: 'cash', currency: 'USD', country: 'Global',
      description: 'Perpetual endowment supporting Islamic education scholarships worldwide for children of the ummah.',
      established_at: '2024-01-15', unit_price: 10000, principal: 2500000, returns_available: 125000,
      returns_ytd: 125000, returns_lifetime: 625000, status: 'active', created_at: now,
    },
    {
      id: generateWaqfId(), name: 'Mosque Infrastructure Waqf', type: 'cash', currency: 'USD', country: 'Global',
      description: 'Endowment for mosque construction, maintenance, and expansion to serve Muslim communities across the globe.',
      established_at: '2023-06-01', unit_price: 50000, principal: 10000000, returns_available: 500000,
      returns_ytd: 500000, returns_lifetime: 2000000, status: 'active', created_at: now,
    },
    {
      id: generateWaqfId(), name: 'Al-Quds Relief Waqf', type: 'cash', currency: 'JOD', country: 'Jordan',
      description: 'Endowment dedicated to supporting families and communities in need across the Arab world.',
      registry_ref: 'JAWF-2024-012', established_at: '2024-03-01', unit_price: 5000, principal: 1000000,
      returns_available: 45000, returns_ytd: 45000, returns_lifetime: 120000, status: 'active', created_at: now,
    },
  ]
  await Promise.all(assets.map(saveWaqfAsset))

  const donorSets = [
    [{ name: 'Ahmad Al-Rashidi', email: 'ahmad@example.com', shares: 5 }, { name: 'Fatimah Binte Hassan', email: 'fatimah@example.com', shares: 3 }, { name: 'Omar Abdullah', email: 'omar@example.com', shares: 2 }],
    [{ name: 'Khalid Al-Mansouri', email: 'khalid@example.com', shares: 2 }, { name: 'Zainab Ibrahim', email: 'zainab@example.com', shares: 1 }],
    [{ name: 'Yusuf Al-Hamdan', email: 'yusuf@example.com', shares: 4 }, { name: 'Maryam Nasser', email: 'maryam@example.com', shares: 2 }],
  ]
  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i]
    for (const d of donorSets[i]) {
      const share: WaqfShare = {
        id: generateShareId(), asset_id: asset.id, asset_name: asset.name, currency: asset.currency,
        donor_name: d.name, donor_email: d.email, shares: d.shares,
        unit_price: asset.unit_price, total: asset.unit_price * d.shares,
        status: 'confirmed', created_at: now,
      }
      await Promise.all([
        saveWaqfShare(share),
        saveWaqfTx({ id: generateTxId(), asset_id: asset.id, type: 'contribution', amount: share.total, note: `${d.shares} share${d.shares > 1 ? 's' : ''} from ${d.name}`, created_at: now }),
      ])
    }
    await saveWaqfTx({ id: generateTxId(), asset_id: asset.id, type: 'return_earned', amount: asset.returns_ytd, note: 'Annual returns credited', created_at: now })
  }
  return true
}
