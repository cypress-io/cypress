import type { FoundSpec, SerializedCommandLog, SerializedTest } from '@packages/types'

export interface TapTestsRunner {
  /** Serializes every test of the run, keyed by id. */
  getAllTestsState (): Record<string, SerializedTest>
  /** Serializes one test by id lookup, skipping the whole-run serialization cost. */
  getTestState (testId: string): SerializedTest | undefined
  isRunComplete (): boolean
}

// The fields the tap commands read off a runnable spec, sourced live from
// GraphQL in open mode or from the served snapshot as a fallback. `lastModified`
// comes from git and is only available over the live client (open mode).
export type RunnableSpec = Pick<FoundSpec, 'relative' | 'specType'> & {
  lastModified?: string
}

export interface SpecListEntry {
  /** Project-relative spec path — the form `cypress run --spec` accepts. */
  relativePath: string
  /** Whether the spec is an end-to-end (integration) or component spec. */
  specType: FoundSpec['specType']
  /** Human-readable last-modified time from git (e.g. "2 hours ago"); absent in run mode. */
  lastModified?: string
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

export interface CommandEntry {
  /** The driver's command log id, e.g. `log-<origin>-3`. */
  id: string
  /** The command name as logged, e.g. `visit`, `get`, `assert`. */
  name?: string
  /** The command log's display message — arguments/assertion text, not output. */
  message?: string
  /** `pending` while the command runs, then `passed` or `failed`. */
  state?: SerializedCommandLog['state']
  /** `parent` starts a chain, `child` is chained off a subject, `system` is driver-emitted. */
  type?: SerializedCommandLog['type']
  /**
   * Present (always `true`) only when the driver evicted this test's command
   * details from memory (numTestsKeptInMemory), so scrubbed fields like
   * `message` are absent because of the eviction, not because they were unset.
   */
  cleanedUp?: true
}
