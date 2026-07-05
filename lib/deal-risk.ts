/**
 * Deterministic deal priority and risk helpers.
 *
 * Priority rules (deterministic):
 * - HIGH: dueDate is past OR dueDate within 3 days OR last activity older than N days (N = 7)
 * - MEDIUM: dueDate within 10 days
 * - LOW: otherwise
 *
 * Risk score: 0-100 combining days to due date and recent activity; higher = more risk
 */

const RECENT_ACTIVITY_THRESHOLD_DAYS = 7 // N = 7 as default, documented

export function getDealPriority(deal: any): 'HIGH' | 'MEDIUM' | 'LOW' {
  const now = new Date()
  const n = RECENT_ACTIVITY_THRESHOLD_DAYS

  const daysToDueDate = deal.dueDate ? Math.ceil((new Date(deal.dueDate).getTime() - now.getTime()) / 86_400_000) : null

  let lastActivityAt: Date | null = null
  if (deal.activities && deal.activities.length) {
    const ts = deal.activities[0].createdAt ?? deal.activities[0].scheduledAt
    lastActivityAt = ts ? new Date(ts) : null
  }
  if (!lastActivityAt && deal.updatedAt) lastActivityAt = new Date(deal.updatedAt)

  const daysSinceLastActivity = lastActivityAt ? Math.ceil((now.getTime() - lastActivityAt.getTime()) / 86_400_000) : null

  // HIGH conditions
  if (daysToDueDate !== null && daysToDueDate <= 0) return 'HIGH'
  if (daysToDueDate !== null && daysToDueDate <= 3) return 'HIGH'
  if (daysSinceLastActivity !== null && daysSinceLastActivity > n) return 'HIGH'

  // MEDIUM
  if (daysToDueDate !== null && daysToDueDate <= 10) return 'MEDIUM'

  // LOW
  return 'LOW'
}

export function getDealRiskScore(deal: any): number {
  const now = new Date()
  const thirtyDays = 30

  const daysToDueDate = deal.dueDate ? Math.ceil((new Date(deal.dueDate).getTime() - now.getTime()) / 86_400_000) : null

  let lastActivityAt: Date | null = null
  if (deal.activities && deal.activities.length) {
    const ts = deal.activities[0].createdAt ?? deal.activities[0].scheduledAt
    lastActivityAt = ts ? new Date(ts) : null
  }
  if (!lastActivityAt && deal.updatedAt) lastActivityAt = new Date(deal.updatedAt)

  const hasRecentActivity = lastActivityAt ? (now.getTime() - lastActivityAt.getTime()) / 86_400_000 <= RECENT_ACTIVITY_THRESHOLD_DAYS : false

  let score = 50
  if (daysToDueDate === null) {
    score = hasRecentActivity ? 35 : 55
  } else {
    if (daysToDueDate < 0) score = 80
    else if (daysToDueDate <= 3) score = 70
    else if (daysToDueDate <= 10) score = 50
    else score = 20
    if (!hasRecentActivity) score = Math.min(100, score + 20)
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

export default { getDealPriority, getDealRiskScore }
