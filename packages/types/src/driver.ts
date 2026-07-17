import type { ReporterRunState } from './reporter'
import type { RUNNABLE_LOGS, RUNNABLE_PROPS } from './constants'

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

// A command log entry as the driver attaches it to a serialized test: the raw
// attrs the driver's Log emits, typed only where stable. Other attrs (snapshots,
// renderProps, ...) vary by command and stay opaque.
export interface SerializedCommandLog {
  id: string
  name?: string
  message?: string
  state?: 'pending' | 'passed' | 'failed'
  type?: 'parent' | 'child' | 'system'
  [key: string]: unknown
}

// The subset of the serialized shape that is stable across driver versions.
// `timings` and `err` stay opaque objects: their values are heterogeneous
// (`err` carries whatever the user's thrown object had on it), so consumers
// must narrow at runtime.
interface SerializedTestStable {
  id: string
  title: string
  _titlePath?: string[]
  state?: 'passed' | 'failed' | 'pending'
  duration?: number
  currentRetry?: number
  retries?: number
  timings?: Record<string, unknown> | null
  err?: Record<string, unknown> | null
  commands?: SerializedCommandLog[]
  prevAttempts?: SerializedTest[]
}

// A test as the driver serializes it: only allowlist keys (absent, not
// undefined, when the runnable lacks them), typed only where stable.
export type SerializedTest =
  & Omit<{ [K in typeof RUNNABLE_PROPS[number] | typeof RUNNABLE_LOGS[number]]?: unknown }, keyof SerializedTestStable>
  & SerializedTestStable

export type Instrument = 'agent' | 'command' | 'route'

export type TestState = 'active' | 'failed' | 'pending' | 'passed' | 'processing' | 'warned'

export type TestFilter = readonly string[] | undefined
