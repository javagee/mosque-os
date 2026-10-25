import { NextRequest, NextResponse } from 'next/server'

const COOKIE = 'merchant_auth'
const MAX_AGE = 60 * 60 * 8 // 8 hours

export async function POST(req: NextRequest) {
  const { pin, merchantName } = await req.json() as { pin: string; merchantName?: string }
  const validPin = process.env.MERCHANT_PIN

  if (!validPin) {
    return NextResponse.json({ error: 'Merchant PIN not configured' }, { status: 503 })
  }
  if (!pin || pin !== validPin) {
    return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 })
  }

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
