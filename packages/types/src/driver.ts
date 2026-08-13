import type { ReporterRunState } from './reporter'

interface MochaRunnerState {
  startTime?: number
  currentId?: string | null
  currentRetry?: number | null
  emissions?: Emissions
  tests?: Record<string, Cypress.ObjectLike>
  passed?: number
  failed?: number
  pending?: number
  numLogs?: number
  // the Cloud FILTER keep-list (test full titles) for test-level rerun
  // optimization; carried across a cross-origin reload so the runner can
  // re-prune the non-eligible tests when it resumes the spec
  filteredTests?: string[] | null
}

export type RunState = MochaRunnerState & ReporterRunState & {
  isSpecsListOpen?: boolean
  showFetchRequests?: boolean
  codeEditorLineWrap?: boolean
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
