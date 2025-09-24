import { SeverityColor, SiteAggregates } from './types'

export function severityFor(site: SiteAggregates): SeverityColor {
  if (site.status === 'unreachable' || site.status === 'auth_failed') return 'red'
  if (site.hasSecurityUpdate) return 'red'
  if (site.hasAnyUpdate) return 'yellow'
  if (!site.lastCheckedAt) return 'gray'
  return 'green'
}

