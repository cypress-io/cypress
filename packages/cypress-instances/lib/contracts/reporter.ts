// The `reporter` command's result contract. A command's result interface lives
// here in `contracts/`, next to the command metadata in `../tap-contract`, so
// the app-side serializer and the CLI-side rendering type against the same
// shape. Optional fields are absent, never null, on the wire.

/**
 * The high-level network detail the reporter renders inline on a
 * request / xhr / fetch / `cy.intercept` row. Present on a command entry only
 * for network-instrumented commands, so its very presence is how a consumer
 * tells a network row from an ordinary command row.
 */
export interface TapNetworkInfo {
  /** HTTP method, or `*` for a wildcard `cy.intercept` matcher. Absent on `cy.request` rows, where the method lives in `message`. */
  method?: string
  /** The request URL, or a `cy.intercept`'s display matcher. Absent on `cy.request` rows, where the URL lives in `message`. */
  url?: string
  /** The reporter's status-dot semantics for a request. Absent on the `cy.intercept` registration row. */
  indicator?: 'successful' | 'pending' | 'aborted' | 'bad'
  /** A stubbed route's response code, or the reporter's `req`/`res modified` label. */
  status?: string | number
  /** Whether a stub served the request instead of hitting origin. */
  stubbed?: boolean
  /** How many requests a `cy.intercept` has matched — the reporter's count badge. */
  numResponses?: number
  /** The route alias set via `.as()`, e.g. `getUsers`. */
  alias?: string
}

export interface TapReporterTest {
  /** The runner's test id, e.g. `r2` — the handle other tap commands accept. */
  id: string
  /** The test's own title, without its suite path. */
  title: string
  /** Suite titles leading to this test plus its own, joined with ` > `. */
  fullTitle: string
  /** Final status, or the unreached placeholder (`pending` mid-run, `skipped` after). */
  state: 'passed' | 'failed' | 'pending' | 'skipped'
}

/** One section of the reporter panel; commands reference it by `hookId`. */
export interface TapReporterHook {
  hookId: string
  /** e.g. `before each`, `after all`, or `test body` for the test's own commands. */
  hookName: string
}

/** One row of the reporter's SESSIONS panel — a `cy.session` this attempt used. */
export interface TapReporterSession {
  /** The session id passed to `cy.session()`, e.g. `all-commands-user`. */
  name: string
  /** The reporter's status badge: `created`, `restored`, `recreated`, `failed`, or an in-flight `-ing` form. */
  status?: string
  /** Present (always `true`) only for a global session (`cacheAcrossSpecs`). */
  global?: true
}

/** One row of the reporter's SPIES / STUBS panel — a `cy.spy` / `cy.stub` agent. */
export interface TapReporterAgent {
  /** The agent's log name, e.g. `spy-1` or `stub-2` — the reporter's Type column. */
  type?: string
  /** The wrapped method's name. */
  functionName?: string
  /** Aliases set via `.as()`. */
  aliases?: string[]
  /** How many times the agent was invoked. */
  callCount?: number
}

/** One row of the reporter's ROUTES table — a `cy.intercept` registration. */
export interface TapReporterRoute {
  /** HTTP method, or `*` for a wildcard matcher. */
  method?: string
  /** The route's display matcher, e.g. `**\/comments/*`. */
  url?: string
  /** Whether the route serves a stubbed response instead of hitting origin. */
  stubbed?: boolean
  /** A stubbed response's status code. */
  status?: string | number
  /** How many requests the route has matched. */
  numResponses?: number
  /** The route alias set via `.as()`. */
  alias?: string
}

export interface TapReporterCommand {
  /**
   * The command id the pin command accepts. Numbered rows carry the exact
   * number the app reporter shows (a per-hook-section counter, so it restarts
   * each section); event and system rows, which the reporter leaves
   * unnumbered, carry an attempt-wide `e1`..`eN` instead. A duplicated number
   * resolves to the test body first, then a unique match; qualify it with the
   * section's hookId (`h1:3`) to target a hook row directly. Route
   * registrations aren't commands and have no id.
   */
  id: string
  /** The command name as logged, e.g. `visit`, `get`, `assert`. */
  name?: string
  /** Label the reporter shows in place of `name` on event rows, e.g. `xhr`, `fetch`, `document`. */
  displayName?: string
  /** The reporter's display text for the row. */
  message?: string
  /** `pending` while the command runs, then `passed` or `failed`. */
  state?: 'pending' | 'passed' | 'failed'
  /** `parent` starts a chain, `child` is chained off a subject, `system` is driver-emitted. */
  type?: 'parent' | 'child' | 'system'
  /** The section this row renders under; the test's own id for the test body. */
  hookId?: string
  /** Event log — the reporter renders these unnumbered, as annotations of the surrounding command. */
  event?: true
  /** Tap command id of the enclosing log group's command, when nested (e.g. inside cy.session). */
  group?: string
  /** Nesting depth within log groups. */
  groupLevel?: number
  /** Aliases this row defines via `.as()` — the reporter's badge on the row. Also set on spy/stub call rows. */
  aliases?: string[]
  /** What the alias points at: `route`, `agent`, `primitive`, `dom`, or `intercept` — the reporter colors `dom` indigo, the rest purple. */
  aliasType?: string
  /** Alias names this row references, e.g. `cy.get('@x')` / `cy.wait('@x')` — the `@name`s in `message`. */
  referencedAliases?: string[]
  /** High-level network detail; absent on ordinary command rows. */
  network?: TapNetworkInfo
  /** Present (always `true`) only when the driver evicted this test's command details from memory. */
  cleanedUp?: true
}

/** The source location and snippet the reporter's error panel points at. */
export interface TapReporterCodeFrame {
  /** Project-relative spec path. */
  file?: string
  line?: number
  column?: number
  /** The rendered snippet, with line numbers and a `>` marker on the failing line. */
  frame?: string
}

/** The failure that ended the attempt — the reporter's error panel. */
export interface TapReporterError {
  /** Error class name, e.g. `AssertionError`; absent on non-Error throws. */
  name?: string
  /** The thrown message; absent on non-Error throws without one. */
  message?: string
  /** The stack trace as the driver captured it. */
  stack?: string
  codeFrame?: TapReporterCodeFrame
}

/**
 * The `reporter` command's result: everything the open-mode reporter renders
 * for one test attempt — enough to reconstruct the panel 1-1.
 */
export interface TapReporterView {
  test: TapReporterTest
  hooks: TapReporterHook[]
  sessions: TapReporterSession[]
  agents: TapReporterAgent[]
  routes: TapReporterRoute[]
  commands: TapReporterCommand[]
  /** Present only when the attempt failed. */
  error?: TapReporterError
}

/** One attempt of a retried test. */
export interface TapReporterSpecAttempt {
  /** 1-based attempt number (attempt 1 = first run) — the value the `--attempt` option accepts. */
  attempt: number
  state: 'passed' | 'failed' | 'pending' | 'skipped'
  /** Wall-clock run time in ms; absent until the attempt has run. */
  duration?: number
}

/** One test row of the spec overview. */
export interface TapReporterSpecTest {
  /** The runner's test id, e.g. `r2` — the handle other tap commands accept. */
  id: string
  /** The test's own title, without its suite path. */
  title: string
  /** Final status, or the unreached placeholder (`pending` mid-run, `skipped` after). */
  state: 'passed' | 'failed' | 'pending' | 'skipped'
  /** Wall-clock run time in ms; absent until the test has run. */
  duration?: number
  /** Retries actually taken this run, not the configured maximum. */
  retries?: number
  /** Every attempt in run order, last one final; present only when the test was retried. */
  attempts?: TapReporterSpecAttempt[]
}

/**
 * One suite section of the spec overview, flattened the way the CLI displays
 * it: nesting is expressed in the joined title, not by recursion, and a suite
 * whose tests all live in deeper suites gets no entry of its own.
 */
export interface TapReporterSuite {
  /** The full suite path, joined with ` > `, e.g. `A > B`. */
  title: string
  /** The suite's direct tests, in document order. */
  tests: TapReporterSpecTest[]
}

/**
 * The app reporter's header stats. Unreached tests count as `pending` mid-run
 * and `skipped` once the run completes.
 */
export interface TapReporterStats {
  passed: number
  failed: number
  pending: number
  skipped: number
  /** Wall-clock run duration in ms, frozen at the last test's end once the run completes; absent before the run starts. */
  duration?: number
}

/**
 * The `reporter` command's result when no test is given: the spec-level
 * overview the app reporter shows — header stats, the root-level tests, and
 * one flattened section per suite with direct tests, in document order.
 */
export interface TapReporterSpecView {
  /** Project-relative spec path; absent only if the active spec can't be read. */
  spec?: string
  stats: TapReporterStats
  tests: TapReporterSpecTest[]
  suites: TapReporterSuite[]
}
