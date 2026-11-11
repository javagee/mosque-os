import type { RamadanConfig, RamadanNightData, RamadanSponsor } from '@/types'

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

function nightKey(year: number, night: number) {
  return `ramadan:${year}:night:${night}:sponsors`
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
