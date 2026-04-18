import type { NextAuthConfig } from 'next-auth'

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
        token.role = (user as { role?: string }).role
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.name = token.name as string
      }
      return session
    },
  },
  providers: [],
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
} satisfies NextAuthConfig
