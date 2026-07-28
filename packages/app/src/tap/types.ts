import type { SerializedCommandLog, SerializedTest } from '@packages/types'

export interface TapTestsRunner {
  /** Serializes every test of the run, keyed by id. */
  getAllTestsState (): Record<string, SerializedTest>
  /** Serializes one test by id lookup, skipping the whole-run serialization cost. */
  getTestState (testId: string): SerializedTest | undefined
  isRunComplete (): boolean
}

/**
 * One snapshot on a command log, as `getSnapshotPropsForLog` exposes it: the
 * cloned body sits behind an opaque object that `restoreDom` knows how to
 * render. We read only the optional `name` (to select/label it) and otherwise
 * treat the entry as opaque.
 */
export interface PinSnapshotEntry {
  name?: string
}

export interface PinSnapshotProps {
  url?: string
  snapshots?: Array<PinSnapshotEntry | null | undefined> | null
}

export interface PinSnapshotRunner {
  getTestState (testId: string): SerializedTest | undefined
  getSnapshotPropsForLog (testId: string, logId: string): PinSnapshotProps | undefined
}

/**
 * The slice of the AUT iframe the pin command drives directly. `detachDom`
 * captures (and detaches) the current body so it can be put back on release —
 * the reliable restore the app's own unpin can't give a cold pin (see below).
 */
export interface PinAutIframe {
  detachDom (): unknown
  restoreDom (snapshot: unknown): void
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

/**
 * The high-level network detail the reporter renders inline on a
 * request / xhr / fetch / `cy.intercept` row. Present on `CommandEntry` only
 * for network-instrumented commands, so its very presence is how a consumer
 * tells a network row from an ordinary command row — that is why the row does
 * not also serialize the driver's raw `instrument`. Each field stays absent
 * when the underlying row doesn't carry it, matching the serializer's
 * absent-not-null discipline.
 */
export interface NetworkCommandInfo {
  /** HTTP method, or `*` for a wildcard `cy.intercept` matcher. Absent on `cy.request` rows, where the method lives in `message`. */
  method?: string
  /** The request URL, or a `cy.intercept`'s display matcher. Absent on `cy.request` rows, where the URL lives in `message`. */
  url?: string
  /** The reporter's status-dot semantics for a request. Absent on the `cy.intercept` registration row. */
  indicator?: 'successful' | 'pending' | 'aborted' | 'bad'
  /** A stubbed route's response code, or the reporter's `req`/`res modified` label. */
  status?: string | number
  /** Whether a stub served the request instead of hitting origin (`isStubbed` on intercept rows, `!wentToOrigin` on request rows). */
  stubbed?: boolean
  /** How many requests a `cy.intercept` has matched — the reporter's count badge. */
  numResponses?: number
  /** The route alias set via `.as()`, e.g. `getUsers`. */
  alias?: string
}

export interface CommandEntry {
  /** The driver's command log id, e.g. `log-<origin>-3`. */
  id: string
  /** The command name as logged, e.g. `visit`, `get`, `assert`. */
  name?: string
  /**
   * The reporter's display text for the row: the command arguments/assertion
   * text, or — for a network row whose base message is empty — the request
   * summary the reporter shows in its place (e.g. `GET 200 /api/users`).
   */
  message?: string
  /** `pending` while the command runs, then `passed` or `failed`. */
  state?: SerializedCommandLog['state']
  /** `parent` starts a chain, `child` is chained off a subject, `system` is driver-emitted. */
  type?: SerializedCommandLog['type']
  /**
   * High-level network detail — method, URL, status/indicator, stubbed flag,
   * response count, alias — matching what the reporter renders inline on
   * request / xhr / `cy.intercept` rows. Absent on ordinary command rows.
   */
  network?: NetworkCommandInfo
  /**
   * Present (always `true`) only when the driver evicted this test's command
   * details from memory (numTestsKeptInMemory), so scrubbed fields like
   * `message` are absent because of the eviction, not because they were unset.
   */
  cleanedUp?: true
}
