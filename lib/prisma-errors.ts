export function isPrismaConnectionError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  return (
    error.name === 'PrismaClientInitializationError' ||
    error.message.includes("Can't reach database server") ||
    error.message.includes('P1001')
  )
}

export function logPrismaConnectionWarning(scope: string, error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown Prisma error'
  console.warn(`[${scope}] Database unavailable. ${message}`)
}
