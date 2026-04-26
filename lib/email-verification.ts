import { Resend } from 'resend'
import { getResendFrom } from '@/lib/resend-from'

const DEFAULT_ENFORCED_FROM = '2026-04-25T00:00:00.000Z'

export function getEmailVerificationEnforcedFrom() {
  const raw = process.env.EMAIL_VERIFICATION_ENFORCED_FROM?.trim()
  const parsed = raw ? new Date(raw) : new Date(DEFAULT_ENFORCED_FROM)

  if (Number.isNaN(parsed.getTime())) {
    return new Date(DEFAULT_ENFORCED_FROM)
  }

  return parsed
}

export function shouldRequireEmailVerificationForUser(params: {
  createdAt: Date
  emailVerified: Date | null
}) {
  if (params.emailVerified !== null) return false
  if (process.env.NODE_ENV !== 'production') return false
  if (!process.env.RESEND_API_KEY) return false

  return params.createdAt >= getEmailVerificationEnforcedFrom()
}

export function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function buildVerificationEmailHTML(params: {
  name: string
  token: string
}) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#1C1917;padding:32px;border-radius:12px;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:20px;font-weight:700;color:#D5C3B6;letter-spacing:0.05em;">NeiFe</span>
      </div>
      <h2 style="color:#FAF6F2;margin:0 0 8px;font-size:20px;">Verifica tu cuenta</h2>
      <p style="color:#9C8578;margin:0 0 28px;font-size:14px;">Hola ${params.name}, usa este codigo para activar tu cuenta:</p>
      <div style="background:#2D3C3C;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;border:1px solid rgba(213,195,182,0.15);">
        <span style="font-size:40px;font-weight:700;color:#5E8B8C;letter-spacing:0.3em;">${params.token}</span>
        <p style="color:#9C8578;font-size:12px;margin:8px 0 0;">Valido por 24 horas</p>
      </div>
      <p style="color:#9C8578;font-size:12px;text-align:center;">Si no creaste esta cuenta, ignora este email.</p>
    </div>
  `
}

export async function sendVerificationEmail(params: {
  resend: Resend
  email: string
  name: string
  token: string
}) {
  return params.resend.emails.send({
    from: getResendFrom(),
    to: params.email,
    subject: `${params.token} - Codigo de verificacion NeiFe`,
    html: buildVerificationEmailHTML({
      name: params.name,
      token: params.token,
    }),
  })
}
