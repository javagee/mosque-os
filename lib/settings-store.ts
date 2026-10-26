// Thin key-value store for admin-editable settings.
// Uses Upstash when available, falls back to env vars for read-only defaults.
// Key schema: settings:{key}

async function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  const { Redis } = await import('@upstash/redis')
  return new Redis({ url, token })
}

export async function getSetting(key: string): Promise<string | null> {
  const r = await getRedis()
  if (r) return r.get<string>(`settings:${key}`)
  return null
}

export async function setSetting(key: string, value: string): Promise<void> {
  const r = await getRedis()
  if (!r) throw new Error('Upstash not configured — cannot save settings')
  await r.set(`settings:${key}`, value)
}

export async function deleteSetting(key: string): Promise<void> {
  const r = await getRedis()
  if (r) await r.del(`settings:${key}`)
}

// Returns the admin notification email: DB override takes precedence over env var
export async function getAdminNotificationEmail(): Promise<string | null> {
  const stored = await getSetting('admin_notification_email')
  if (stored) return stored
  return process.env.ADMIN_NOTIFICATION_EMAIL ?? null
}
