import type { FoundSpec, SerializedTest } from '@packages/types'

export interface TapTestsRunner {
  getAllTestsState (): Record<string, SerializedTest>
  isRunComplete (): boolean
}

export interface SpecListEntry {
  /** Project-relative spec path — the form `cypress run --spec` accepts. */
  relativePath: string
  /** Whether the spec is an end-to-end (integration) or component spec. */
  specType: FoundSpec['specType']
}

export type TestStateValue = 'passed' | 'failed' | 'pending' | 'skipped'

export interface TestStateEntry {
  /** The runner's test id, e.g. `r2` — the handle other tap commands accept. */
  id: string
  /** The test's own title, without its suite path. */
  title: string
  /** Wall-clock run time in ms; absent until the test has run. */
  duration?: number
  /** Final status, or the unreached placeholder (`pending` mid-run, `skipped` after). */
  state: TestStateValue
  /** Retries actually taken this run, not the configured maximum. */
  retries?: number
}

export interface TestError {
  /** Error class name, e.g. `AssertionError`; absent on non-Error throws. */
  name?: string
  /** The thrown message; absent on non-Error throws without one. */
  message?: string
  /** The stack trace as the driver captured it. */
  stack?: string
}

export interface TestDetailEntry {
  /** The runner's test id, e.g. `r2` — the handle other tap commands accept. */
  id: string
  /** The test's own title, without its suite path. */
  title: string
  /** Suite titles leading to this test plus its own, joined with ` > `. */
  fullTitle: string
  /** Wall-clock run time in ms; absent until the test has run. */
  duration?: number
  /** Final status, or the unreached placeholder (`pending` mid-run, `skipped` after). */
  state: TestStateValue
  /** Retries actually taken this run, not the configured maximum. */
  retries?: number
  /** The driver's lifecycle/hook timing breakdown; absent until the test has run. */
  timings?: Record<string, unknown>
  /** The failure that ended the test; absent unless it failed. */
  error?: TestError
}
