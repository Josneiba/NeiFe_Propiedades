const required = ['DATABASE_URL', 'NEXT_PUBLIC_APP_URL'] as const

function readEnvValue(key: string) {
  return process.env[key]?.trim() || ''
}

function getDatabaseUrl() {
  return (
    readEnvValue('DATABASE_URL') ||
    readEnvValue('POSTGRES_URL') ||
    readEnvValue('POSTGRES_PRISMA_URL') ||
    readEnvValue('POSTGRES_URL_NON_POOLING') ||
    ''
  )
}

function getAppUrl() {
  return (
    readEnvValue('NEXT_PUBLIC_APP_URL') ||
    readEnvValue('NEXTAUTH_URL') ||
    readEnvValue('AUTH_URL') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    ''
  )
}

function hasAuthSecret() {
  return Boolean(readEnvValue('NEXTAUTH_SECRET') || readEnvValue('AUTH_SECRET'))
}

export function validateEnv() {
  const missing: string[] = []

  const databaseUrl = getDatabaseUrl()
  if (!databaseUrl) {
    missing.push('DATABASE_URL')
  }

  const appUrl = getAppUrl()
  if (!appUrl) {
    missing.push('NEXT_PUBLIC_APP_URL')
  }

  if (!hasAuthSecret()) {
    missing.push('NEXTAUTH_SECRET')
  }

  if (missing.length > 0) {
    console.warn(`Variables de entorno faltantes: ${missing.join(', ')}`)
  }

  return {
    missing,
    databaseUrl,
    appUrl,
    authSecret: getRuntimeEnv().authSecret,
  }
}

export function getRuntimeEnv() {
  return {
    databaseUrl: getDatabaseUrl(),
    appUrl: getAppUrl(),
    authSecret: readEnvValue('NEXTAUTH_SECRET') || readEnvValue('AUTH_SECRET'),
  }
}

