import { NextRequest, NextResponse } from 'next/server'

// Demo persona switcher — auto-authenticates without login for demo purposes
export async function GET(req: NextRequest) {
  const persona = req.nextUrl.searchParams.get('persona')

  if (persona === 'admin') {
    const adminPass = process.env.ADMIN_PASSWORD
    if (!adminPass) return NextResponse.redirect(new URL('/admin/login', req.url))

    const res = NextResponse.redirect(new URL('/admin', req.url))
    res.cookies.set('admin_auth', 'authenticated', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8,
      path: '/',
    })
    return res
  }

  if (persona === 'merchant') {
    const pin = process.env.MERCHANT_PIN
    if (!pin) return NextResponse.redirect(new URL('/merchant/login', req.url))

    const res = NextResponse.redirect(new URL('/merchant/redeem', req.url))
    res.cookies.set('merchant_auth', 'Demo Merchant', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8,
      path: '/',
    })
    return res
  }

  // Buyer — just redirect to campaigns
  return NextResponse.redirect(new URL('/campaigns', req.url))
}
