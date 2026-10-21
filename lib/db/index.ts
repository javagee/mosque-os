import { SupabaseProvider } from './supabase-provider'
import { UpstashProvider } from './upstash-provider'
import type { DbProvider } from './types'

function createProvider(): DbProvider {
  if (process.env.DATA_PROVIDER === 'upstash') {
    return new UpstashProvider()
  }
  return new SupabaseProvider()
}

export const db: DbProvider = createProvider()
export type { DbProvider, CouponInsert, DonorInsert, CouponCounts } from './types'
