import type { Facility, FacilityBooking } from '@/types'

async function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  const { Redis } = await import('@upstash/redis')
  return new Redis({ url, token })
}

const memFacilities = new Map<string, Facility>()
const memBookings = new Map<string, FacilityBooking>()

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function randId(prefix: string) {
  let s = prefix
  for (let i = 0; i < 6; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)]
  return s
}

export function generateFacilityId() { return randId('FAC-') }
export function generateBookingId() { return randId('BKG-') }

export async function saveFacility(f: Facility): Promise<void> {
  const r = await getRedis()
  if (r) {
    await r.set(`facility:${f.id}`, f)
    await r.sadd('facilities:all', f.id)
  } else {
    memFacilities.set(f.id, f)
  }
}

export async function getFacility(id: string): Promise<Facility | null> {
  const r = await getRedis()
  if (r) return r.get<Facility>(`facility:${id}`)
  return memFacilities.get(id) ?? null
}

export async function getAllFacilities(): Promise<Facility[]> {
  const r = await getRedis()
  if (r) {
    const ids = await r.smembers('facilities:all')
    if (!ids.length) return []
    const facs = await Promise.all(ids.map(id => r.get<Facility>(`facility:${id}`)))
    return facs
      .filter((f): f is Facility => f !== null)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }
  return [...memFacilities.values()].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
}

export async function saveBooking(b: FacilityBooking): Promise<void> {
  const r = await getRedis()
  if (r) {
    await r.set(`booking:${b.id}`, b)
    await r.sadd('bookings:all', b.id)
    await r.sadd(`facility:${b.facility_id}:bookings:${b.date}`, b.id)
    if (b.status === 'pending') {
      await r.sadd('bookings:pending', b.id)
    } else {
      await r.srem('bookings:pending', b.id)
    }
  } else {
    memBookings.set(b.id, b)
  }
}

export async function getBooking(id: string): Promise<FacilityBooking | null> {
  const r = await getRedis()
  if (r) return r.get<FacilityBooking>(`booking:${id}`)
  return memBookings.get(id) ?? null
}

export async function getAllBookings(): Promise<FacilityBooking[]> {
  const r = await getRedis()
  if (r) {
    const ids = await r.smembers('bookings:all')
    if (!ids.length) return []
    const bookings = await Promise.all(ids.map(id => r.get<FacilityBooking>(`booking:${id}`)))
    return bookings
      .filter((b): b is FacilityBooking => b !== null)
      .sort((a, b) => b.date.localeCompare(a.date))
  }
  return [...memBookings.values()].sort((a, b) => b.date.localeCompare(a.date))
}

export async function getPendingBookings(): Promise<FacilityBooking[]> {
  const r = await getRedis()
  if (r) {
    const ids = await r.smembers('bookings:pending')
    if (!ids.length) return []
    const bookings = await Promise.all(ids.map(id => r.get<FacilityBooking>(`booking:${id}`)))
    return bookings
      .filter((b): b is FacilityBooking => b !== null)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
  return [...memBookings.values()].filter(b => b.status === 'pending')
}

export async function getFacilityBookingsForDate(facilityId: string, date: string): Promise<FacilityBooking[]> {
  const r = await getRedis()
  if (r) {
    const ids = await r.smembers(`facility:${facilityId}:bookings:${date}`)
    if (!ids.length) return []
    const bookings = await Promise.all(ids.map(id => r.get<FacilityBooking>(`booking:${id}`)))
    return bookings.filter((b): b is FacilityBooking => b !== null)
  }
  return [...memBookings.values()].filter(b => b.facility_id === facilityId && b.date === date)
}
