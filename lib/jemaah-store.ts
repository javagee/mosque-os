import type { Jemaah, JemaahCheckIn } from '@/types'

async function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  const { Redis } = await import('@upstash/redis')
  return new Redis({ url, token })
}

const memMembers = new Map<string, Jemaah>()
const memCheckIns = new Map<string, Set<string>>() // date → Set of jemaah_ids

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateJemaahId(): string {
  let id = 'JM-'
  for (let i = 0; i < 6; i++) id += CHARS[Math.floor(Math.random() * CHARS.length)]
  return id
}

export async function saveJemaah(member: Jemaah): Promise<void> {
  const r = await getRedis()
  if (r) {
    await r.set(`jemaah:${member.id}`, member)
    await r.sadd('jemaah:all', member.id)
    await r.set(`jemaah:email:${member.email.toLowerCase()}`, member.id)
  } else {
    memMembers.set(member.id, member)
  }
}

export async function getJemaah(id: string): Promise<Jemaah | null> {
  const r = await getRedis()
  if (r) return r.get<Jemaah>(`jemaah:${id}`)
  return memMembers.get(id) ?? null
}

export async function getJemaahByEmail(email: string): Promise<Jemaah | null> {
  const r = await getRedis()
  if (r) {
    const id = await r.get<string>(`jemaah:email:${email.toLowerCase()}`)
    if (!id) return null
    return r.get<Jemaah>(`jemaah:${id}`)
  }
  return [...memMembers.values()].find(m => m.email.toLowerCase() === email.toLowerCase()) ?? null
}

export async function getAllJemaah(): Promise<Jemaah[]> {
  const r = await getRedis()
  if (r) {
    const ids = await r.smembers('jemaah:all')
    if (!ids.length) return []
    const members = await Promise.all(ids.map(id => r.get<Jemaah>(`jemaah:${id}`)))
    return members
      .filter((m): m is Jemaah => m !== null)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
  return [...memMembers.values()].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export async function recordCheckIn(jemaahId: string, date: string): Promise<void> {
  const r = await getRedis()
  if (r) {
    await r.sadd(`jemaah:checkin:${date}`, jemaahId)
  } else {
    if (!memCheckIns.has(date)) memCheckIns.set(date, new Set())
    memCheckIns.get(date)!.add(jemaahId)
  }
}

export async function getCheckIns(date: string): Promise<JemaahCheckIn[]> {
  const r = await getRedis()
  let ids: string[] = []
  if (r) {
    ids = await r.smembers(`jemaah:checkin:${date}`)
  } else {
    ids = [...(memCheckIns.get(date) ?? [])]
  }
  return ids.map(id => ({ jemaah_id: id, date, checked_in_at: date }))
}

export async function hasCheckedIn(jemaahId: string, date: string): Promise<boolean> {
  const r = await getRedis()
  if (r) {
    return (await r.sismember(`jemaah:checkin:${date}`, jemaahId)) === 1
  }
  return memCheckIns.get(date)?.has(jemaahId) ?? false
}
