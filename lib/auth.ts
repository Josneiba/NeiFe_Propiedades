import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { authConfig } from './auth.config'
import { shouldRequireEmailVerificationForUser } from './email-verification'
import { isPrismaConnectionError, logPrismaConnectionWarning } from './prisma-errors'

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(6),
          })
          .safeParse(credentials)

        if (!parsed.success) return null

        let user
        try {
          user = await prisma.user.findUnique({
            where: { email: parsed.data.email },
          })
        } catch (error) {
          if (isPrismaConnectionError(error)) {
            logPrismaConnectionWarning('auth.authorize', error)
            return null
          }

          throw error
        }

        if (!user || !user.isActive) return null

        const passwordMatch = await bcrypt.compare(
          parsed.data.password,
          user.password
        )

        if (!passwordMatch) return null

        if (
          shouldRequireEmailVerificationForUser({
            createdAt: user.createdAt,
            emailVerified: user.emailVerified,
          })
        ) {
          throw new Error('EMAIL_NOT_VERIFIED')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          rut: user.rut,
          documentCountry: user.documentCountry,
          documentType: user.documentType,
          documentNumber: user.documentNumber,
          documentNumberNormalized: user.documentNumberNormalized,
          phone: user.phone,
          company: user.company,
        }
      },
    }),
  ],
})
