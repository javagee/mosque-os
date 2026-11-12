import type { MosqueEvent, EventRegistration } from '@/types'

async function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  const { Redis } = await import('@upstash/redis')
  return new Redis({ url, token })
}

const memEvents = new Map<string, MosqueEvent>()
const memRegs = new Map<string, EventRegistration>()

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function randId(prefix: string) {
  let s = prefix
  for (let i = 0; i < 6; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)]
  return s
}

export function generateEventId() { return randId('EVT-') }
export function generateRegistrationId() { return randId('REG-') }

export async function saveEvent(event: MosqueEvent): Promise<void> {
  const r = await getRedis()
  if (r) {
    await r.set(`event:${event.id}`, event)
    await r.sadd('events:all', event.id)
  } else {
    memEvents.set(event.id, event)
  }
}

export async function getEvent(id: string): Promise<MosqueEvent | null> {
  const r = await getRedis()
  if (r) return r.get<MosqueEvent>(`event:${id}`)
  return memEvents.get(id) ?? null
}

export async function getAllEvents(): Promise<MosqueEvent[]> {
  const r = await getRedis()
  if (r) {
    const ids = await r.smembers('events:all')
    if (!ids.length) return []
    const events = await Promise.all(ids.map(id => r.get<MosqueEvent>(`event:${id}`)))
    return events
      .filter((e): e is MosqueEvent => e !== null)
      .sort((a, b) => a.date.localeCompare(b.date))
  }
  return [...memEvents.values()].sort((a, b) => a.date.localeCompare(b.date))
}

export async function addRegistration(reg: EventRegistration): Promise<void> {
  const r = await getRedis()
  if (r) {
    await r.set(`registration:${reg.id}`, reg)
    await r.sadd('registrations:all', reg.id)
    await r.sadd(`event:${reg.event_id}:registrations`, reg.id)
  } else {
    memRegs.set(reg.id, reg)
  }
}

export async function getRegistration(id: string): Promise<EventRegistration | null> {
  const r = await getRedis()
  if (r) return r.get<EventRegistration>(`registration:${id}`)
  return memRegs.get(id) ?? null
}

export async function getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
  const r = await getRedis()
  if (r) {
    const ids = await r.smembers(`event:${eventId}:registrations`)
    if (!ids.length) return []
    const regs = await Promise.all(ids.map(id => r.get<EventRegistration>(`registration:${id}`)))
    return regs
      .filter((reg): reg is EventRegistration => reg !== null)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
  return [...memRegs.values()].filter(r => r.event_id === eventId)
}

export async function countConfirmedRegistrations(eventId: string): Promise<number> {
  const regs = await getEventRegistrations(eventId)
  return regs
    .filter(r => r.status === 'confirmed')
    .reduce((sum, r) => sum + r.pax, 0)
}
