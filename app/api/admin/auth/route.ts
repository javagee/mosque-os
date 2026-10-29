import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, clearRateLimit } from '@/lib/rate-limit'

const COOKIE = 'admin_auth'
const MAX_AGE = 60 * 60 * 8 // 8 hours

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rlKey = `admin_auth:${ip}`

  const { limited, remaining } = await checkRateLimit(rlKey)
  if (limited) {
    return NextResponse.json({ error: 'Too many failed attempts. Try again in 15 minutes.' }, { status: 429 })
  }

  const { username, password } = await req.json() as { username: string; password: string }

  const validUser = process.env.ADMIN_USERNAME ?? 'admin'
  const validPass = process.env.ADMIN_PASSWORD

  if (!validPass) {
    return NextResponse.json({ error: 'Admin credentials not configured' }, { status: 503 })
  }
  if (username !== validUser || password !== validPass) {
    return NextResponse.json(
      { error: 'Incorrect username or password', attemptsRemaining: remaining },
      { status: 401 }
    )
  }

  await clearRateLimit(rlKey)

  const res = NextResponse.json({ success: true })
  res.cookies.set(COOKIE, 'authenticated', {
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
