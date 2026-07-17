import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { getRuntimeEnv, validateEnv } from './env'

// Validate environment variables in both development and production
try {
  validateEnv()
} catch (error) {
  console.error('Environment validation failed:', error)
  // Only throw in production, warn in development
  if (process.env.NODE_ENV === 'production') {
    throw error
  }
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const runtimeEnv = getRuntimeEnv()
const databaseUrl = runtimeEnv.databaseUrl

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
