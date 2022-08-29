export interface RunState {
  startTime?: number
  currentId?: number | null
  emissions?: Emissions
  tests?: Record<string, Cypress.ObjectLike>
  passed?: number
  failed?: number
  pending?: number
  numLogs?: number
}

export interface Emissions {
  started: Record<string, boolean>
  ended: Record<string, boolean>
}

interface HtmlWebStorage {
  origin: string
  value: Record<string, any>
}

export interface ServerSessionData {
  id: string
  cacheAcrossSpecs: boolean
  cookies: Cypress.Cookie[] | null
  localStorage: Array<HtmlWebStorage> | null
  sessionStorage: Array<HtmlWebStorage> | null
  setup: string
}

export type StoredSessions = Record<string, ServerSessionData>

export interface CachedTestState {
  activeSessions: StoredSessions
}
