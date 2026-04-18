import { auth } from '@/lib/auth-session'
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
  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const role = session.user.role

  // TENANT intenta acceder a dashboard → redirigir
  if (pathname.startsWith('/dashboard') && role === 'TENANT') {
    return NextResponse.redirect(new URL('/mi-arriendo', req.url))
  }

  // Solo TENANT puede acceder a mi-arriendo
  if (pathname.startsWith('/mi-arriendo') && role !== 'TENANT') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Solo BROKER u OWNER pueden acceder a /broker
  if (pathname.startsWith('/broker') && role !== 'BROKER' && role !== 'OWNER') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
