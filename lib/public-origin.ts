import type { NextRequest } from 'next/server'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0'])
const CANONICAL_PRODUCTION_ORIGIN = 'https://neife.cl'

function normalizeOrigin(value?: string | null): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null

  try {
    return new URL(trimmed).origin.replace(/\/$/, '')
  } catch {
    return null
  }
}

function isLocalOrigin(origin: string): boolean {
  try {
    return LOCAL_HOSTS.has(new URL(origin).hostname)
  } catch {
    return false
  }
}

export function getConfiguredPublicOrigin(): string | null {
  const configuredCandidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
  ]

  for (const candidate of configuredCandidates) {
    const origin = normalizeOrigin(candidate)
    if (!origin) continue

    if (process.env.NODE_ENV === 'production' && isLocalOrigin(origin)) {
      continue
    }

    return origin
  }

  return null
}

/**
 * Base URL for links we share (invitations, emails).
 * Priority:
 * 1. Explicit public env vars.
 * 2. Reverse-proxy headers / request URL.
 * 3. Localhost as a last-resort fallback for local development only.
 */
export function getPublicOrigin(req: NextRequest): string {
  const configuredOrigin = getConfiguredPublicOrigin()
  if (configuredOrigin) {
    return configuredOrigin
  }

  const forwardedHost = req.headers.get('x-forwarded-host')?.trim()
  const forwardedProto = req.headers.get('x-forwarded-proto')?.trim() || 'https'

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost.replace(/\/$/, '')}`
  }

  try {
    const requestOrigin = new URL(req.url).origin
    if (process.env.NODE_ENV === 'production' && isLocalOrigin(requestOrigin)) {
      return CANONICAL_PRODUCTION_ORIGIN
    }
    return requestOrigin
  } catch {
    return process.env.NODE_ENV === 'production'
      ? CANONICAL_PRODUCTION_ORIGIN
      : 'http://localhost:3000'
  }
}
