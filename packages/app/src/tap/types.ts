import type { SerializedTest } from '@packages/types'

export interface TapTestsRunner {
  getTestsState (testId?: string): Record<string, SerializedTest>
  isRunComplete (): boolean
}

export type TestStateValue = 'passed' | 'failed' | 'pending' | 'skipped'

export interface TestStateEntry {
  id: string
  title: string
  duration?: number
  state: TestStateValue
  /** Retries actually taken this run, not the configured maximum. */
  retries?: number
}

export interface TestError {
  name?: string
  message?: string
  stack?: string
}

export interface TestDetailEntry {
  id: string
  title: string
  /** Suite titles leading to this test plus its own, joined with ` > `. */
  fullTitle: string
  duration?: number
  state: TestStateValue
  retries?: number
  timings?: Record<string, unknown>
  error?: TestError
}
