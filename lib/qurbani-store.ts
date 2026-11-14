import type { QurbaniCampaign, QurbaniOrder, QurbaniPartner } from '@/types'

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

export const generateCampaignId = () => genId('QRB-')
export const generateOrderId = () => genId('QOR-')
export const generatePartnerId = () => genId('QPT-')

const memCampaigns = new Map<string, QurbaniCampaign>()
const memOrders = new Map<string, QurbaniOrder>()
const memPartners = new Map<string, QurbaniPartner>()
const memCampaignOrders = new Map<string, Set<string>>()

export async function saveCampaign(c: QurbaniCampaign): Promise<void> {
  const r = await getRedis()
  if (r) {
    await r.set(`qurbani:campaign:${c.id}`, c)
    await r.sadd('qurbani:campaigns:all', c.id)
  } else {
    memCampaigns.set(c.id, c)
  }
}

export async function getCampaign(id: string): Promise<QurbaniCampaign | null> {
  const r = await getRedis()
  if (r) return r.get<QurbaniCampaign>(`qurbani:campaign:${id}`)
  return memCampaigns.get(id) ?? null
}

export async function getAllCampaigns(): Promise<QurbaniCampaign[]> {
  const r = await getRedis()
  if (r) {
    const ids = await r.smembers('qurbani:campaigns:all')
    if (!ids.length) return []
    const items = await Promise.all(ids.map(id => r.get<QurbaniCampaign>(`qurbani:campaign:${id}`)))
    return items.filter((c): c is QurbaniCampaign => c !== null)
      .sort((a, b) => b.year - a.year)
  }
  return [...memCampaigns.values()].sort((a, b) => b.year - a.year)
}

export async function getActiveCampaign(): Promise<QurbaniCampaign | null> {
  const all = await getAllCampaigns()
  return all.find(c => c.active) ?? null
}

export async function saveQurbaniOrder(o: QurbaniOrder): Promise<void> {
  const r = await getRedis()
  if (r) {
    await r.set(`qurbani:order:${o.id}`, o)
    await r.sadd('qurbani:orders:all', o.id)
    await r.sadd(`qurbani:campaign:${o.campaign_id}:orders`, o.id)
  } else {
    memOrders.set(o.id, o)
    if (!memCampaignOrders.has(o.campaign_id)) memCampaignOrders.set(o.campaign_id, new Set())
    memCampaignOrders.get(o.campaign_id)!.add(o.id)
  }
}

export async function getQurbaniOrder(id: string): Promise<QurbaniOrder | null> {
  const r = await getRedis()
  if (r) return r.get<QurbaniOrder>(`qurbani:order:${id}`)
  return memOrders.get(id) ?? null
}

export async function getCampaignOrders(campaignId: string): Promise<QurbaniOrder[]> {
  const r = await getRedis()
  if (r) {
    const ids = await r.smembers(`qurbani:campaign:${campaignId}:orders`)
    if (!ids.length) return []
    const items = await Promise.all(ids.map(id => r.get<QurbaniOrder>(`qurbani:order:${id}`)))
    return items.filter((o): o is QurbaniOrder => o !== null)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
  const ids = [...(memCampaignOrders.get(campaignId) ?? [])]
  return ids.map(id => memOrders.get(id)).filter((o): o is QurbaniOrder => o !== null)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export async function getAllQurbaniOrders(): Promise<QurbaniOrder[]> {
  const r = await getRedis()
  if (r) {
    const ids = await r.smembers('qurbani:orders:all')
    if (!ids.length) return []
    const items = await Promise.all(ids.map(id => r.get<QurbaniOrder>(`qurbani:order:${id}`)))
    return items.filter((o): o is QurbaniOrder => o !== null)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
  return [...memOrders.values()].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export async function savePartner(p: QurbaniPartner): Promise<void> {
  const r = await getRedis()
  if (r) {
    await r.set(`qurbani:partner:${p.id}`, p)
    await r.sadd('qurbani:partners:all', p.id)
  } else {
    memPartners.set(p.id, p)
  }
}

export async function getPartner(id: string): Promise<QurbaniPartner | null> {
  const r = await getRedis()
  if (r) return r.get<QurbaniPartner>(`qurbani:partner:${id}`)
  return memPartners.get(id) ?? null
}

export async function getAllPartners(): Promise<QurbaniPartner[]> {
  const r = await getRedis()
  if (r) {
    const ids = await r.smembers('qurbani:partners:all')
    if (!ids.length) return []
    const items = await Promise.all(ids.map(id => r.get<QurbaniPartner>(`qurbani:partner:${id}`)))
    return items.filter((p): p is QurbaniPartner => p !== null)
  }
  return [...memPartners.values()]
}
