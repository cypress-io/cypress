export type RunnableState = 'passed' | 'failed' | 'pending' | 'skipped'

interface ReporterCodeFrame {
  line: number
  column: number
  originalFile: string
  relativeFile: string
  absoluteFile: string
  frame: string
  language: string
}

export interface ReporterTestError {
  name?: string
  message?: string
  stack?: string
  codeFrame?: ReporterCodeFrame
}

export interface ReporterTestAttempt {
  state: RunnableState | null
  error: ReporterTestError | null
  timings: unknown
  failedFromHookId: string | null
  wallClockStartedAt: Date | null
  wallClockDuration: number | null
  videoTimestamp: number | null
}

export interface ReporterTest {
  testId: string | null
  title: string[]
  state: RunnableState | null
  body: string | null
  displayError: string | null
  attempts: ReporterTestAttempt[]
}

export interface ReporterHook {
  hookId: string | undefined
  hookName: string | undefined
  title: string[]
  body: string | undefined
}

export interface ReporterStats {
  suites: number
  tests: number
  passes: number
  pending: number
  skipped: number
  failures: number
  wallClockDuration: number
  wallClockStartedAt?: Date | string
  wallClockEndedAt?: Date | string
}

interface ReporterMochaStats {
  suites: number
  tests: number
  passes: number
  pending: number
  failures: number
  start?: string
  end?: string
  duration?: number
}

export interface BaseReporterResults {
  error?: string
  stats: {
    failures: number
    tests: number
    passes: number
    pending: number
    suites: number
    skipped: number
    wallClockDuration: number
    wallClockStartedAt: string
    wallClockEndedAt: string
  }
}

export interface ReporterResults {
  error?: string
  stats: ReporterStats
  reporter: string
  reporterStats: ReporterMochaStats
  hooks: ReporterHook[]
  tests: ReporterTest[]
}

export interface CypressTestStatusInfo {
  attempts?: number
  strategy?: string
  outerStatus?: RunnableState
  shouldAttemptsContinue?: boolean
}

export interface RunnableAttemptPayload {
  err?: ReporterTestError | string
  state?: RunnableState
  timings?: unknown
  failedFromHookId?: string
  wallClockStartedAt?: number | Date
  wallClockDuration?: number
}

export interface RunnablePayload {
  id?: string
  title?: string
  body?: string
  type?: 'test' | 'hook' | 'suite'
  state?: RunnableState
  root?: boolean
  file?: string
  duration?: number
  timedOut?: boolean
  async?: number | boolean
  sync?: boolean
  err?: ReporterTestError | string
  _retries?: number
  _currentRetry?: number
  currentRetry?: number
  retries?: number
  hookId?: string
  hookName?: string
  originalTitle?: string
  final?: boolean
  failedFromHookId?: string
  prevAttempts?: RunnableAttemptPayload[]
  _cypressTestStatusInfo?: CypressTestStatusInfo
  timings?: unknown
  wallClockStartedAt?: number | Date
  wallClockDuration?: number
  tests?: RunnablePayload[]
  suites?: RunnablePayload[]
  start?: number | Date
  end?: number | Date
}

export type RetriesConfig = {
  experimentalStrategy?: string
  experimentalOptions?: Record<string, unknown>
  runMode?: number | boolean | null
  openMode?: number | boolean | null
}

export type ReporterEventName =
  | 'start'
  | 'end'
  | 'suite'
  | 'suite end'
  | 'test'
  | 'test end'
  | 'hook'
  | 'retry'
  | 'hook end'
  | 'pass'
  | 'pending'
  | 'fail'
  | 'test:after:run'
  | 'test:before:run'

type ReporterEventHandler = (
  arg: RunnablePayload,
  runnables: Record<string, InternalRunnable>,
  stats: ReporterStats,
) => unknown[]

export type ReporterEventHandlers = {
  [K in ReporterEventName]?: ReporterEventHandler | true
}

export interface InternalRunnable {
  id?: string
  title?: string
  body?: string
  type?: 'test' | 'hook' | 'suite'
  state?: RunnableState
  root?: boolean
  file?: string
  duration?: number
  timedOut?: boolean
  async?: number | boolean
  sync?: boolean
  err?: ReporterTestError | string
  _retries?: number
  _currentRetry?: number
  hookId?: string
  hookName?: string
  originalTitle?: string
  failedFromHookId?: string
  prevAttempts?: RunnableAttemptPayload[]
  _cypressTestStatusInfo?: CypressTestStatusInfo
  timings?: unknown
  wallClockStartedAt?: number | Date
  wallClockDuration?: number
  parent?: InternalRunnable
  tests?: InternalRunnable[]
  suites?: InternalRunnable[]
  titlePath?: () => string[]
  fullTitle?: () => string
  speed?: string
  retries?: number
}
