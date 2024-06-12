import type { ReporterRunState, StudioRecorderState } from './reporter'

interface MochaRunnerState {
  startTime?: number
  currentId?: string | null
  emissions?: Emissions
  tests?: Record<string, Cypress.ObjectLike>
  passed?: number
  failed?: number
  pending?: number
  numLogs?: number
}

export type RunState = MochaRunnerState & ReporterRunState & {
  studio?: StudioRecorderState
  isSpecsListOpen?: boolean
}

export interface Emissions {
  started: Record<string, boolean>
  ended: Record<string, boolean>
}

export type StoredSessions = Record<string, Cypress.ServerSessionData>

export interface CachedTestState {
  activeSessions: StoredSessions
}

export type Instrument = 'agent' | 'command' | 'route'

export type TestState = 'active' | 'failed' | 'pending' | 'passed' | 'processing' | 'warned'

export type TestFilter = readonly string[] | undefined
