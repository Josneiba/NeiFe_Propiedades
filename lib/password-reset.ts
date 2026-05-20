import { Resend } from 'resend'
import { getResendFrom } from '@/lib/resend-from'
import { generateVerificationCode } from '@/lib/email-verification'

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
  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#1C1917;padding:32px;border-radius:12px;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:20px;font-weight:700;color:#D5C3B6;letter-spacing:0.05em;">NeiFe</span>
      </div>
      <h2 style="color:#FAF6F2;margin:0 0 8px;font-size:20px;">Recupera tu contraseña</h2>
      <p style="color:#9C8578;margin:0 0 28px;font-size:14px;">Hola ${params.name}, usa este código para restablecer tu contraseña:</p>
      <div style="background:#2D3C3C;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;border:1px solid rgba(213,195,182,0.15);">
        <span style="font-size:40px;font-weight:700;color:#5E8B8C;letter-spacing:0.3em;">${params.token}</span>
        <p style="color:#9C8578;font-size:12px;margin:8px 0 0;">Válido por 30 minutos</p>
      </div>
      <p style="color:#9C8578;font-size:12px;text-align:center;">Si no solicitaste este cambio, ignora este correo.</p>
    </div>
  `
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
    subject: `${params.token} - Código para recuperar tu acceso a NeiFe`,
    html: buildPasswordResetEmailHTML({
      name: params.name,
      token: params.token,
    }),
  })
}
