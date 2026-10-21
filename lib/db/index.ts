import { SupabaseProvider } from './supabase-provider'
import { UpstashProvider } from './upstash-provider'
import { DemoProvider } from './demo-provider'
import type { DbProvider } from './types'

function createProvider(): DbProvider {
  if (process.env.DATA_PROVIDER === 'upstash') {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return new DemoProvider()
    }
    return new UpstashProvider()
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return new DemoProvider()
  }
  return new SupabaseProvider()
}

export const db: DbProvider = createProvider()
export type { DbProvider, CouponInsert, DonorInsert, CouponCounts } from './types'
