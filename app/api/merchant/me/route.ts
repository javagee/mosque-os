import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const cookieStore = await cookies()
  const auth = cookieStore.get('merchant_auth')
  if (!auth?.value || auth.value === 'authenticated') {
    return NextResponse.json({ merchantName: null }, { status: 401 })
  }
  return NextResponse.json({ merchantName: auth.value })
}
