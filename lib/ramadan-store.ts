import type { RamadanConfig, RamadanNightData, RamadanSponsor, RamadanSlot } from '@/types'

async function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  const { Redis } = await import('@upstash/redis')
  return new Redis({ url, token })
}

// In-memory fallback for local dev
const memConfigs = new Map<number, RamadanConfig>()
const memSponsors = new Map<string, RamadanSponsor[]>()
const memSlots = new Map<string, RamadanSlot>()         // key: "{year}:{slotId}"
const memSlotIds = new Map<string, string[]>()          // key: "{year}:{night}"

function nightKey(year: number, night: number) {
  return `ramadan:${year}:night:${night}:sponsors`
}

function slotKey(year: number, slotId: string) {
  return `ramadan:${year}:slot:${slotId}`
}

function nightSlotIdsKey(year: number, night: number) {
  return `ramadan:${year}:night:${night}:slot_ids`
}

function configKey(year: number) {
  return `ramadan:${year}:config`
}

function defaultConfig(year: number): RamadanConfig {
  return { year, default_target: 10000, night_targets: {}, active: true }
}

function computeNight(night: number, config: RamadanConfig, sponsors: RamadanSponsor[]): RamadanNightData {
  const target = config.night_targets[night] ?? config.default_target
  const raised = sponsors.filter(s => s.status === 'confirmed').reduce((s, sp) => s + sp.amount, 0)
  const status: RamadanNightData['status'] =
    raised >= target ? 'sponsored' : raised >= target * 0.1 ? 'partial' : 'available'
  return { night, target, raised, sponsors, status }
}

export async function getRamadanConfig(year: number): Promise<RamadanConfig> {
  const r = await getRedis()
  if (r) {
    const cfg = await r.get<RamadanConfig>(configKey(year))
    return cfg ?? defaultConfig(year)
  }
  return memConfigs.get(year) ?? defaultConfig(year)
}

export async function saveRamadanConfig(config: RamadanConfig): Promise<void> {
  const r = await getRedis()
  if (r) {
    await r.set(configKey(config.year), config)
  } else {
    memConfigs.set(config.year, config)
  }
}

export async function getRamadanNight(year: number, night: number): Promise<RamadanNightData> {
  const config = await getRamadanConfig(year)
  const r = await getRedis()
  let sponsors: RamadanSponsor[] = []
  if (r) {
    sponsors = (await r.get<RamadanSponsor[]>(nightKey(year, night))) ?? []
  } else {
    sponsors = memSponsors.get(nightKey(year, night)) ?? []
  }
  return computeNight(night, config, sponsors)
}

export async function getAllRamadanNights(year: number): Promise<RamadanNightData[]> {
  const config = await getRamadanConfig(year)
  const r = await getRedis()
  const nights = await Promise.all(
    Array.from({ length: 30 }, (_, i) => i + 1).map(async night => {
      let sponsors: RamadanSponsor[] = []
      if (r) {
        sponsors = (await r.get<RamadanSponsor[]>(nightKey(year, night))) ?? []
      } else {
        sponsors = memSponsors.get(nightKey(year, night)) ?? []
      }
      return computeNight(night, config, sponsors)
    })
  )
  return nights
}

export async function addRamadanSponsor(year: number, night: number, sponsor: RamadanSponsor): Promise<void> {
  const r = await getRedis()
  const key = nightKey(year, night)
  if (r) {
    const existing = (await r.get<RamadanSponsor[]>(key)) ?? []
    await r.set(key, [...existing, sponsor])
  } else {
    const existing = memSponsors.get(key) ?? []
    memSponsors.set(key, [...existing, sponsor])
  }
}

export async function confirmRamadanSponsor(year: number, night: number, sponsorId: string): Promise<void> {
  const r = await getRedis()
  const key = nightKey(year, night)
  if (r) {
    const sponsors = (await r.get<RamadanSponsor[]>(key)) ?? []
    const updated = sponsors.map(s => s.id === sponsorId ? { ...s, status: 'confirmed' as const } : s)
    await r.set(key, updated)
  } else {
    const existing = memSponsors.get(key) ?? []
    memSponsors.set(key, existing.map(s => s.id === sponsorId ? { ...s, status: 'confirmed' as const } : s))
  }
}

export async function findSponsorByOrderRef(year: number, orderReference: string): Promise<{ night: number; sponsor: RamadanSponsor } | null> {
  const r = await getRedis()
  for (let night = 1; night <= 30; night++) {
    const key = nightKey(year, night)
    let sponsors: RamadanSponsor[] = []
    if (r) {
      sponsors = (await r.get<RamadanSponsor[]>(key)) ?? []
    } else {
      sponsors = memSponsors.get(key) ?? []
    }
    const found = sponsors.find(s => s.order_reference === orderReference)
    if (found) return { night, sponsor: found }
  }
  return null
}

// ── Cash Slot functions (Caliph BUMI spec) ───────────────────────────────────

export async function createRamadanSlot(year: number, slot: RamadanSlot): Promise<void> {
  const r = await getRedis()
  if (r) {
    await r.set(slotKey(year, slot.id), slot)
    const idsKey = nightSlotIdsKey(year, slot.night)
    const ids = (await r.get<string[]>(idsKey)) ?? []
    await r.set(idsKey, [...ids, slot.id])
  } else {
    memSlots.set(`${year}:${slot.id}`, slot)
    const k = `${year}:${slot.night}`
    memSlotIds.set(k, [...(memSlotIds.get(k) ?? []), slot.id])
  }
}

export async function getNightSlots(year: number, night: number): Promise<RamadanSlot[]> {
  const r = await getRedis()
  if (r) {
    const ids = (await r.get<string[]>(nightSlotIdsKey(year, night))) ?? []
    if (!ids.length) return []
    const slots = await Promise.all(ids.map(id => r.get<RamadanSlot>(slotKey(year, id))))
    return slots.filter((s): s is RamadanSlot => s !== null)
  }
  const ids = memSlotIds.get(`${year}:${night}`) ?? []
  return ids.map(id => memSlots.get(`${year}:${id}`)).filter((s): s is RamadanSlot => s !== undefined)
}

export async function getRamadanSlot(year: number, slotId: string): Promise<RamadanSlot | null> {
  const r = await getRedis()
  if (r) return r.get<RamadanSlot>(slotKey(year, slotId))
  return memSlots.get(`${year}:${slotId}`) ?? null
}

// Atomically holds a slot for 15 minutes; returns hold token or null if unavailable.
export async function holdSlotAtomic(
  year: number,
  slotId: string,
  holdToken: string,
): Promise<{ holdToken: string; expiresAt: number } | null> {
  const nowSec = Math.floor(Date.now() / 1000)
  const expiresAt = nowSec + 900 // 15 minutes

  const r = await getRedis()
  if (r) {
    // Lua: check AVAILABLE (auto-releasing expired holds), set HELD atomically
    const script = `
      local raw = redis.call('GET', KEYS[1])
      if raw == false then return nil end
      local slot = cjson.decode(raw)
      local now = tonumber(ARGV[1])
      if slot['status'] == 'HELD' and slot['hold_expires_at'] ~= nil then
        if tonumber(slot['hold_expires_at']) < now then
          slot['status'] = 'AVAILABLE'
          slot['hold_token'] = nil
          slot['hold_expires_at'] = nil
        end
      end
      if slot['status'] ~= 'AVAILABLE' then return false end
      slot['status'] = 'HELD'
      slot['hold_token'] = ARGV[2]
      slot['hold_expires_at'] = tonumber(ARGV[3])
      redis.call('SET', KEYS[1], cjson.encode(slot))
      return ARGV[2]
    `
    const result = await r.eval(script, [slotKey(year, slotId)], [String(nowSec), holdToken, String(expiresAt)])
    if (!result) return null
    return { holdToken, expiresAt }
  }

  // In-memory fallback (single-threaded — no race)
  const slot = memSlots.get(`${year}:${slotId}`)
  if (!slot) return null
  if (slot.status === 'HELD' && slot.hold_expires_at && slot.hold_expires_at < nowSec) {
    slot.status = 'AVAILABLE'
    delete slot.hold_token
    delete slot.hold_expires_at
  }
  if (slot.status !== 'AVAILABLE') return null
  slot.status = 'HELD'
  slot.hold_token = holdToken
  slot.hold_expires_at = expiresAt
  return { holdToken, expiresAt }
}

export async function claimSlot(
  year: number,
  slotId: string,
  holdToken: string,
  donorName: string,
  donorEmail: string,
  donorAnonymous: boolean,
  orderReference: string,
): Promise<boolean> {
  const nowSec = Math.floor(Date.now() / 1000)
  const r = await getRedis()
  if (r) {
    const slot = await r.get<RamadanSlot>(slotKey(year, slotId))
    if (!slot) return false
    if (slot.status !== 'HELD') return false
    if (slot.hold_token !== holdToken) return false
    if (slot.hold_expires_at && slot.hold_expires_at < nowSec) return false
    await r.set(slotKey(year, slotId), {
      ...slot,
      status: 'CLAIMED_PENDING',
      donor_name: donorName,
      donor_email: donorEmail,
      donor_anonymous: donorAnonymous,
      order_reference: orderReference,
    })
    return true
  }
  const slot = memSlots.get(`${year}:${slotId}`)
  if (!slot || slot.status !== 'HELD' || slot.hold_token !== holdToken) return false
  if (slot.hold_expires_at && slot.hold_expires_at < nowSec) return false
  memSlots.set(`${year}:${slotId}`, {
    ...slot,
    status: 'CLAIMED_PENDING',
    donor_name: donorName,
    donor_email: donorEmail,
    donor_anonymous: donorAnonymous,
    order_reference: orderReference,
  })
  return true
}

export async function verifySlot(year: number, slotId: string): Promise<RamadanSlot | null> {
  const r = await getRedis()
  if (r) {
    const slot = await r.get<RamadanSlot>(slotKey(year, slotId))
    if (!slot || slot.status !== 'CLAIMED_PENDING') return null
    const updated: RamadanSlot = { ...slot, status: 'SPONSORED', sponsored_at: new Date().toISOString() }
    await r.set(slotKey(year, slotId), updated)
    return updated
  }
  const slot = memSlots.get(`${year}:${slotId}`)
  if (!slot || slot.status !== 'CLAIMED_PENDING') return null
  const updated: RamadanSlot = { ...slot, status: 'SPONSORED', sponsored_at: new Date().toISOString() }
  memSlots.set(`${year}:${slotId}`, updated)
  return updated
}
