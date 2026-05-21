import { Resend } from 'resend'
import { getResendFrom } from '@/lib/resend-from'
import { generateVerificationCode } from '@/lib/email-verification'
import { buildBrandedEmailHtml } from '@/lib/email-composer'

const PASSWORD_RESET_PREFIX = 'password-reset:'

export function buildPasswordResetIdentifier(email: string) {
  return `${PASSWORD_RESET_PREFIX}${email.trim().toLowerCase()}`
}

export function createPasswordResetCode() {
  return generateVerificationCode()
}

export function buildPasswordResetEmailHTML(params: {
  name: string
  token: string
}) {
  return buildBrandedEmailHtml({
    preview: 'Código para recuperar tu acceso a NeiFe',
    title: 'Recupera tu contraseña',
    greeting: `Hola ${params.name},`,
    intro: [
      'Recibimos una solicitud para restablecer el acceso a tu cuenta de NeiFe.',
      'Usa el siguiente código para continuar con el cambio de contraseña.',
    ],
    emphasisBlock: {
      label: 'Código de recuperación',
      value: params.token,
      hint: 'Válido por 30 minutos',
    },
    closing: [
      'Si no solicitaste este cambio, puedes ignorar este correo y tu contraseña seguirá siendo la misma.',
    ],
  })
}

export async function sendPasswordResetEmail(params: {
  resend: Resend
  email: string
  name: string
  token: string
}) {
  return params.resend.emails.send({
    from: getResendFrom(),
    to: params.email,
    subject: 'Recuperación de acceso a NeiFe',
    html: buildPasswordResetEmailHTML({
      name: params.name,
      token: params.token,
    }),
  })
}
