import { auth } from '@/lib/auth-session'
import { NextResponse } from 'next/server'

const publicPathnames = ['/', '/login', '/registro', '/privacidad', '/terminos', '/legal']

function isPublicPath(pathname: string) {
  return (
    publicPathnames.some((r) => pathname === r) ||
    pathname.startsWith('/invitacion/')
  )
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const role = session?.user?.role

  if (isPublicPath(pathname)) return NextResponse.next()

  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (pathname.startsWith('/dashboard') && role === 'TENANT') {
    return NextResponse.redirect(new URL('/mi-arriendo', req.url))
  }

  if (pathname.startsWith('/mi-arriendo') && role !== 'TENANT') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (
    pathname.startsWith('/broker') &&
    role !== 'BROKER' &&
    role !== 'OWNER'
  ) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
