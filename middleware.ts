import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Protect all /merchant/* routes except the login page itself
  if (pathname.startsWith('/merchant') && !pathname.startsWith('/merchant/login')) {
    const auth = req.cookies.get('merchant_auth')
    if (!auth?.value) {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/merchant/login'
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/merchant/:path*'],
}
