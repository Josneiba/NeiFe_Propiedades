/**
 * Resend requires a verified domain to send from custom addresses.
 * Without RESEND_FROM, use Resend's sandbox sender (no DNS setup).
 * @see https://resend.com/docs/dashboard/domains/introduction
 */
export function getResendFrom(): string {
  const from = process.env.RESEND_FROM?.trim()
  if (from) return from
  return 'NeiFe <onboarding@resend.dev>'
}

export function isResendSandboxFrom(from = getResendFrom()): boolean {
  return /@resend\.dev>?$/i.test(from)
}

export function getResendDomainHelpMessage(): string {
  return 'Resend está usando resend.dev en modo prueba. Para enviar a destinatarios reales debes verificar un dominio en Resend y configurar RESEND_FROM con ese dominio.'
}
