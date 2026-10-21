import type { Order } from '@/types'

async function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  const { Redis } = await import('@upstash/redis')
  return new Redis({ url, token })
}

// In-memory fallback for local dev (Supabase mode)
const mem = new Map<string, Order>()

export async function saveOrder(order: Order): Promise<void> {
  const r = await getRedis()
  if (r) {
    await r.set(`order:${order.reference}`, order)
    await r.sadd('orders:all', order.reference)
    if (order.status === 'pending_verification') {
      await r.sadd('orders:pending_verification', order.reference)
    }
    if (order.status === 'verified' || order.status === 'cancelled') {
      await r.srem('orders:pending_verification', order.reference)
    }
  } else {
    mem.set(order.reference, order)
  }
}

export async function getOrder(reference: string): Promise<Order | null> {
  const r = await getRedis()
  if (r) {
    return await r.get<Order>(`order:${reference}`)
  }
  return mem.get(reference) ?? null
}

export async function getPendingOrders(): Promise<Order[]> {
  const r = await getRedis()
  if (r) {
    const refs = await r.smembers('orders:pending_verification')
    if (!refs.length) return []
    const orders = await Promise.all(refs.map(ref => r.get<Order>(`order:${ref}`)))
    return orders
      .filter((o): o is Order => o !== null)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
  return [...mem.values()]
    .filter(o => o.status === 'pending_verification')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export async function getAllOrders(): Promise<Order[]> {
  const r = await getRedis()
  if (r) {
    const refs = await r.smembers('orders:all')
    if (!refs.length) return []
    const orders = await Promise.all(refs.map(ref => r.get<Order>(`order:${ref}`)))
    return orders
      .filter((o): o is Order => o !== null)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
  return [...mem.values()].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}
