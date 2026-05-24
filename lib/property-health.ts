export type HealthStatus = 'OK' | 'WARN' | 'CRITICAL'

export interface PropertyHealth {
  status: HealthStatus
  score: number // 0-100
  issues: string[]
  color: string
  label: string
}

interface HealthInput {
  paymentStatus: string | null // 'PAID' | 'PENDING' | 'OVERDUE' | null
  activeMaintenance: number
  daysUntilContractExpiry: number | null
  hasTenant: boolean
}

export function calculatePropertyHealth(input: HealthInput): PropertyHealth {
  const issues: string[] = []
  let score = 100

  // Payments (weight 50)
  if (input.paymentStatus === 'PENDING') {
    score -= 20
    issues.push('Pago pendiente este mes')
  } else if (input.paymentStatus === 'OVERDUE') {
    score -= 50
    issues.push('Pago atrasado')
  }
  // PAID or null -> no penalización for payments (null means no tenant)

  // Maintenance (weight 30)
  const n = input.activeMaintenance ?? 0
  if (n >= 3) {
    score -= 30
    issues.push(`${n} mantenciones activas — revisar urgente`)
  } else if (n >= 1) {
    score -= 15
    issues.push(`${n} mantención(es) activa(s)`)
  }

  // Contract (weight 20)
  const days = input.daysUntilContractExpiry
  if (typeof days === 'number') {
    if (days < 30) {
      score -= 20
      issues.push(`Contrato vence pronto (${days} días)`)
    } else if (days <= 60) {
      score -= 10
      issues.push(`Contrato vence en ${days} días`)
    }
  }

  // No tenant
  if (!input.hasTenant) {
    score -= 10
    issues.push('Sin arrendatario asignado')
  }

  // Clamp score
  score = Math.max(0, Math.min(100, Math.round(score)))

  let status: HealthStatus = 'OK'
  let color = '#5E8B8C'
  let label = 'Saludable'

  if (score >= 80) {
    status = 'OK'
    color = '#5E8B8C'
    label = 'Saludable'
  } else if (score >= 50) {
    status = 'WARN'
    color = '#F2C94C'
    label = 'Atención'
  } else {
    status = 'CRITICAL'
    color = '#C27F79'
    label = 'Urgente'
  }

  return {
    status,
    score,
    issues,
    color,
    label,
  }
}
