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
