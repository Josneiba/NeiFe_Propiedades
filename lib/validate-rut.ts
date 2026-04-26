/**
 * Valida un RUT chileno usando el algoritmo del dígito verificador (módulo 11).
 * Acepta formatos: 12345678-9, 12.345.678-9, 123456789
 */
export function validateRut(rut: string): boolean {
  if (!rut || typeof rut !== 'string') return false

  const clean = rut.replace(/[\.\-\s]/g, '').toUpperCase()

  if (clean.length < 2) return false

  const body = clean.slice(0, -1)
  const dv = clean.slice(-1)

  if (!/^\d+$/.test(body)) return false

  const expected = calculateDv(parseInt(body, 10))
  return expected === dv
}

function calculateDv(rut: number): string {
  let sum = 0
  let multiplier = 2
  let current = rut

  while (current > 0) {
    sum += (current % 10) * multiplier
    current = Math.floor(current / 10)
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }

  const remainder = 11 - (sum % 11)
  if (remainder === 11) return '0'
  if (remainder === 10) return 'K'
  return remainder.toString()
}

/**
 * Formatea un RUT al formato estándar: 12.345.678-9
 */
export function formatRut(rut: string): string {
  if (!rut) return ''

  const clean = rut.replace(/[\.\-\s]/g, '').toUpperCase()
  if (clean.length < 2) return rut

  const body = clean.slice(0, -1)
  const dv = clean.slice(-1)
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  return `${formattedBody}-${dv}`
}

/**
 * Normaliza el RUT para guardar en DB: sin puntos, con guión.
 * Ejemplo: 12.345.678-9 -> 12345678-9
 */
export function normalizeRut(rut: string): string {
  if (!rut) return ''

  const clean = rut.replace(/[\.\s]/g, '').toUpperCase()
  if (!clean.includes('-') && clean.length >= 2) {
    return `${clean.slice(0, -1)}-${clean.slice(-1)}`
  }

  return clean
}
