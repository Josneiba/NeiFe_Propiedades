import type { NextAuthConfig } from 'next-auth'
import type { Role } from '@prisma/client'

const publicPathnames = [
  '/',
  '/login',
  '/registro',
  '/privacidad',
  '/terminos',
  '/legal',
]

function isPublicPath(pathname: string) {
  return (
    publicPathnames.some((r) => pathname === r) ||
    pathname.startsWith('/invitacion/')
  )
}

function asNullableString(value: unknown) {
  return typeof value === 'string' ? value : null
}

/** Edge-safe config: no Prisma / Node-only deps (used by middleware + auth-session). */
export const authConfig = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request }) {
      const pathname = request.nextUrl.pathname
      if (isPublicPath(pathname)) return true
      return !!auth?.user
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.name = user.name
        token.rut = user.rut ?? null
        token.phone = user.phone ?? null
        token.company = user.company ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.name = token.name as string
        session.user.rut = asNullableString(token.rut)
        session.user.phone = asNullableString(token.phone)
        session.user.company = asNullableString(token.company)
      }
      return session
    },
  },
  providers: [],
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
} satisfies NextAuthConfig
