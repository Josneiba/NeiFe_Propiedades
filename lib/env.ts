const required = ['DATABASE_URL', 'NEXT_PUBLIC_APP_URL'] as const

function hasAuthSecret() {
  return Boolean(
    process.env.NEXTAUTH_SECRET?.trim() || process.env.AUTH_SECRET?.trim()
  )
}

export function validateEnv() {
  const missing: string[] = []

  for (const key of required) {
    const value = process.env[key]
    if (!value || value.trim() === '') {
      missing.push(key)
    }
  }

  if (!hasAuthSecret()) {
    missing.push('NEXTAUTH_SECRET')
  }

  if (missing.length > 0) {
    throw new Error(
      `Variables de entorno faltantes: ${missing.join(', ')}\n` +
        `Copia .env.example a .env.local y completa los valores.`
    )
  }
}
