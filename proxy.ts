import { NextRequest, NextResponse } from 'next/server'

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Protect /admin/* except the login page
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const auth = req.cookies.get('admin_auth')
    if (!auth?.value) {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/admin/login'
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Protect /merchant/* except the login page
  if (pathname.startsWith('/merchant') && !pathname.startsWith('/merchant/login')) {
    const auth = req.cookies.get('merchant_auth')
    if (!auth?.value) {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/merchant/login'
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Protect /api/admin/* except the auth endpoint itself
  if (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/auth')) {
    const auth = req.cookies.get('admin_auth')
    if (!auth?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/merchant/:path*', '/api/admin/:path*'],
}
