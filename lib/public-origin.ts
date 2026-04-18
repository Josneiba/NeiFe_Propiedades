import type { NextRequest } from 'next/server'

/**
 * Base URL for links we share (invitations, emails).
 * - Production: use NEXT_PUBLIC_APP_URL (e.g. https://neife.com).
 * - Development: prefer the request origin so links match the real dev port (3000 vs 3001).
 */
export function getPublicOrigin(req: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || ''

  if (process.env.NODE_ENV === 'production') {
    if (configured) return configured
  } else {
    try {
      return new URL(req.url).origin
    } catch {
      /* ignore */
    }
  }

  if (configured) return configured

  try {
    return new URL(req.url).origin
  } catch {
    return 'http://localhost:3000'
  }
}
