import { Resend } from 'resend'
import { getResendFrom } from '@/lib/resend-from'
import { buildBrandedEmailHtml } from '@/lib/email-composer'

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
  return buildBrandedEmailHtml({
    preview: 'Verifica tu cuenta de NeiFe',
    title: 'Verifica tu cuenta',
    greeting: `Hola ${params.name},`,
    intro: [
      'Gracias por registrarte en NeiFe.',
      'Usa el siguiente código para confirmar tu correo y activar tu acceso a la plataforma.',
    ],
    emphasisBlock: {
      label: 'Código de verificación',
      value: params.token,
      hint: 'Válido por 24 horas',
    },
    closing: [
      'Si no realizaste este registro, puedes ignorar este correo con tranquilidad.',
    ],
  })
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
    subject: 'Verifica tu cuenta de NeiFe',
    html: buildVerificationEmailHTML({
      name: params.name,
      token: params.token,
    }),
  })
}
