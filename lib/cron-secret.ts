const PLACEHOLDER_CRON_SECRET = 'thisisthesecretkeyforcrons'

export function hasSafeCronSecret() {
  const secret = process.env.CRON_SECRET?.trim()

  return Boolean(secret && secret.length >= 16 && secret !== PLACEHOLDER_CRON_SECRET)
}

export function getCronSecretConfigError() {
  return 'CRON_SECRET no está configurado correctamente. Genera un secreto nuevo y evita usar el valor de ejemplo.'
}
