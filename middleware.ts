import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Rutas públicas — no requieren auth
  const publicRoutes = ['/', '/login', '/registro', '/privacidad', '/terminos', '/legal']
  const isPublic =
    publicRoutes.some((r) => pathname === r) ||
    pathname.startsWith('/invitacion/')

  if (isPublic) return NextResponse.next()

  // Sin sesión → login
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const role = session.user.role

  // TENANT intenta acceder a dashboard → redirigir
  if (pathname.startsWith('/dashboard') && role === 'TENANT') {
    return NextResponse.redirect(new URL('/mi-arriendo', req.url))
  }

  // LANDLORD/OWNER intenta acceder a mi-arriendo → redirigir
  if (
    pathname.startsWith('/mi-arriendo') &&
    (role === 'LANDLORD' || role === 'OWNER')
  ) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
