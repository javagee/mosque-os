import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, clearRateLimit } from '@/lib/rate-limit'

const COOKIE = 'merchant_auth'
const MAX_AGE = 60 * 60 * 8 // 8 hours

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rlKey = `merchant_auth:${ip}`

  const { limited, remaining } = await checkRateLimit(rlKey)
  if (limited) {
    return NextResponse.json({ error: 'Too many failed attempts. Try again in 15 minutes.' }, { status: 429 })
  }

  const { pin, merchantName } = await req.json() as { pin: string; merchantName?: string }
  const validPin = process.env.MERCHANT_PIN

  if (!validPin) {
    return NextResponse.json({ error: 'Merchant PIN not configured' }, { status: 503 })
  }
  if (!pin || pin !== validPin) {
    return NextResponse.json(
      { error: 'Incorrect PIN', attemptsRemaining: remaining },
      { status: 401 }
    )
  }

  await clearRateLimit(rlKey)

  const res = NextResponse.json({ success: true })
  // Store merchant name as cookie value so history page can filter by it
  res.cookies.set(COOKIE, merchantName?.trim() || 'authenticated', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE,
    path: '/',
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.delete(COOKIE)
  return res
}
