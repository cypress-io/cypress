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

/** One row of the reporter's ROUTES table — a `cy.intercept` registration. */
export interface TapReporterRoute {
  id: string
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
  /** The driver's command log id, e.g. `log-<origin>-3`. */
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
  /** Id of the enclosing log group's command, when nested (e.g. inside cy.session). */
  group?: string
  /** Nesting depth within log groups. */
  groupLevel?: number
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
  routes: TapReporterRoute[]
  commands: TapReporterCommand[]
  /** Present only when the attempt failed. */
  error?: TapReporterError
}
