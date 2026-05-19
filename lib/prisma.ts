import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { validateEnv } from './env'

if (process.env.NODE_ENV === 'production') {
  validateEnv()
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const databaseUrl = process.env.DATABASE_URL

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    ...(databaseUrl
      ? {
          adapter: new PrismaNeon({ connectionString: databaseUrl }),
        }
      : {}),
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
