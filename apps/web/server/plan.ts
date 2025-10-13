export type PlanKey = 'trial' | 'free' | 'starter' | 'pro' | 'enterprise'

export function planDefaults(plan: PlanKey) {
  switch (plan) {
    case 'trial':
      return { maxSites: 3, checksPerDay: 50, retentionDays: 14, seatsMax: 2 }
    case 'free':
      return { maxSites: 3, checksPerDay: 50, retentionDays: 14, seatsMax: 2 }
    case 'starter':
      return { maxSites: 10, checksPerDay: 500, retentionDays: 90, seatsMax: 5 }
    case 'pro':
      return { maxSites: 50, checksPerDay: 2000, retentionDays: 180, seatsMax: 15 }
    case 'enterprise':
      return { maxSites: -1, checksPerDay: 10000, retentionDays: 365, seatsMax: 100 }
    default:
      return { maxSites: 10, checksPerDay: 200, retentionDays: 90, seatsMax: 5 }
  }
}

export function applyPlanDefaults(plan: PlanKey) {
  return planDefaults(plan)
}
