import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

/** JWT session helper without Prisma — safe for middleware and server components. */
export const { auth } = NextAuth(authConfig)
