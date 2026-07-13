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

// The own-property allowlists the driver keeps when serializing a runnable
// (`wrapAll`/`mixinLogs` in driver `src/cypress/runner.ts`). Shared here so
// consumers of the serialized shape (e.g. `Cypress.runner.getTestsState`) use
// one key source with the driver.
export const RUNNABLE_LOGS = ['routes', 'agents', 'commands', 'hooks'] as const

export const RUNNABLE_PROPS = [
  '_cypressTestStatusInfo', '_testConfig', 'id', 'order', 'title', '_titlePath', 'root', 'hookName', 'hookId', 'err', 'state', 'pending', 'failedFromHookId', 'failedFromHookName', 'body', 'speed', 'type', 'duration', 'wallClockStartedAt', 'wallClockDuration', 'timings', 'file', 'originalTitle', 'invocationDetails', 'final', 'currentRetry', 'retries', '_slow',
] as const

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
