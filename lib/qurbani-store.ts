import type { QurbaniCampaign, QurbaniOrder, QurbaniPartner, QurbaniSettlement, Order } from '@/types'
import { saveOrder } from '@/lib/order-store'

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
export const generateSettlementId = () => genId('QST-')

const memCampaigns = new Map<string, QurbaniCampaign>()
const memOrders = new Map<string, QurbaniOrder>()
const memPartners = new Map<string, QurbaniPartner>()
const memSettlements = new Map<string, QurbaniSettlement>()
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

export async function saveQurbaniSettlement(s: QurbaniSettlement): Promise<void> {
  const r = await getRedis()
  if (r) {
    await r.set(`qurbani:settlement:${s.id}`, s)
    await r.sadd('qurbani:settlements:all', s.id)
    await r.sadd(`qurbani:campaign:${s.campaign_id}:settlements`, s.id)
  } else {
    memSettlements.set(s.id, s)
  }
}

export async function getAllQurbaniSettlements(): Promise<QurbaniSettlement[]> {
  const r = await getRedis()
  if (r) {
    const ids = await r.smembers('qurbani:settlements:all')
    if (!ids.length) return []
    const items = await Promise.all(ids.map(id => r.get<QurbaniSettlement>(`qurbani:settlement:${id}`)))
    return items.filter((s): s is QurbaniSettlement => s !== null)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
  return [...memSettlements.values()].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export async function getCampaignSettlements(campaignId: string): Promise<QurbaniSettlement[]> {
  const all = await getAllQurbaniSettlements()
  return all.filter(s => s.campaign_id === campaignId)
}

const RCHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function genRef() {
  let r = 'IMA-'
  for (let i = 0; i < 6; i++) r += RCHARS[Math.floor(Math.random() * RCHARS.length)]
  return r
}

export async function seedDemoData(): Promise<boolean> {
  const existing = await getAllCampaigns()
  if (existing.length > 0) return false

  const campaign: QurbaniCampaign = {
    id: generateCampaignId(), year: 2027, hijri_year: '1448H',
    eid_date: '2027-06-16', fulfilment_deadline: '2027-06-18', currency: 'USD',
    animals: [
      { type: 'sheep', label: 'Sheep / Goat', arabic: 'خروف / ماعز', pax: 1, price: 25000, capacity: 50 },
      { type: 'cow_share', label: 'Cow Share (1/7)', arabic: 'سُبُع البقر', pax: 1, price: 50000, capacity: 70 },
      { type: 'cow_full', label: 'Full Cow (7 shares)', arabic: 'بقرة كاملة', pax: 7, price: 350000, capacity: 10 },
    ],
    active: true, created_at: new Date().toISOString(),
  }
  await saveCampaign(campaign)

  await Promise.all([
    savePartner({ id: generatePartnerId(), name: 'Jordan Halal Cooperative', country: 'Jordan', halal_cert_number: 'JAWF-2027-0142', capacity_per_day: 100, animal_types: ['sheep', 'goat', 'cow_share', 'cow_full'], active: true, created_at: new Date().toISOString() }),
    savePartner({ id: generatePartnerId(), name: 'Al-Iman Abattoir', country: 'Singapore', halal_cert_number: 'MUIS-H-2027-0088', capacity_per_day: 50, animal_types: ['sheep', 'goat'], active: true, created_at: new Date().toISOString() }),
  ])

  const demos: Array<{ donor: string; email: string; type: 'sheep' | 'cow_share'; status: QurbaniOrder['status']; niyyah: QurbaniOrder['niyyah']; extra?: Partial<QurbaniOrder> }> = [
    { donor: 'Ahmad Al-Rashidi', email: 'ahmad@example.com', type: 'sheep', status: 'confirmed', niyyah: 'self' },
    { donor: 'Siti Nurbaya', email: 'siti@example.com', type: 'cow_share', status: 'confirmed', niyyah: 'family', extra: { niyyah_name: 'Al-Rashidi Family' } },
    { donor: 'Omar Khalid', email: 'omar@example.com', type: 'sheep', status: 'slaughtered', niyyah: 'self', extra: { slaughter_date: '2027-06-16', slaughter_location: 'Jordan Halal Cooperative, Amman', halal_cert_ref: 'JAWF-2027-0142' } },
    { donor: 'Yusuf Abdullah', email: 'yusuf@example.com', type: 'cow_share', status: 'pending_payment', niyyah: 'deceased', extra: { niyyah_name: 'Abdullah bin Yusuf (rahimahullah)' } },
  ]
  for (const d of demos) {
    const animal = campaign.animals.find(a => a.type === d.type)!
    const ref = genRef()
    const payNowOrder: Order = {
      reference: ref, campaign_id: `qurbani:${campaign.id}`, campaign_name: `Qurbani ${campaign.year} — ${animal.label}`,
      merchant_name: 'Qurbani Programme', buyer_name: d.donor, buyer_email: d.email,
      quantity: 1, unit_price: animal.price, total: animal.price, currency: campaign.currency,
      mosque_portion: animal.price, merchant_portion: 0,
      status: d.status === 'pending_payment' ? 'pending_payment' : 'verified',
      created_at: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
    }
    await saveOrder(payNowOrder)
    await saveQurbaniOrder({ id: generateOrderId(), campaign_id: campaign.id, animal_type: d.type, animal_label: animal.label, niyyah: d.niyyah, donor_name: d.donor, donor_email: d.email, amount: animal.price, currency: campaign.currency, order_reference: ref, status: d.status, created_at: payNowOrder.created_at, ...d.extra })
  }
  return true
}
