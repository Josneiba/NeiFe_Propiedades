import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { getRuntimeEnv, validateEnv } from './env'

// Validate environment variables in both development and production without crashing the app
validateEnv()

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
