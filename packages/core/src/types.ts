export type SeverityColor = 'green' | 'yellow' | 'red' | 'gray'

export type Role = 'admin' | 'viewer'

export interface SiteAggregates {
  id: string
  name: string
  url: string
  status: 'ok' | 'unreachable' | 'auth_failed' | 'unknown'
  lastCheckedAt: Date | null
  hasAnyUpdate: boolean
  hasSecurityUpdate: boolean
  hasChangelog: boolean
}

export interface WpPluginStatus {
  slug: string
  name: string
  currentVersion: string
  latestVersion: string
  updateAvailable: boolean
  security: boolean
  hasChangelog: boolean
  changelogUrl?: string
}

export interface WpCoreStatus {
  currentVersion: string
  latestVersion: string
  updateAvailable: boolean
  security: boolean
}

export interface WpSnapshot {
  site: { url: string; name?: string }
  core: WpCoreStatus
  plugins: WpPluginStatus[]
}

