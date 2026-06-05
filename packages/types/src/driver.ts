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
  // the number of consecutive top-window origin changes a single `cy.visit()`
  // has triggered without the page successfully loading. used to detect (and
  // bail out of) the infinite reload loop that occurs when a dynamic `baseUrl`
  // keeps resolving visits to a cross-origin location. see issue #33233.
  originChangeCount?: number
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
