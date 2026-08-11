// The copy for every `cypress tap` failure, keyed by its code.
//
// A code is a registry key, not output: the CLI renders each failure the way the
// rest of the CLI does — description, solution, the platform footer — and never
// prints the key. That is why codes raised only CLI-side live here too, alongside
// the ones the app raises over the wire: one lookup table means one answer to what
// a tap failure means, and one place to add the next one.
//
// A failure fills the slots like so:
//
//   description  the condition, generic — never interpolated
//   solution     what to do about it, generic — never interpolated
//   detail       the specifics, at the throw site: the selector, the available
//                snapshots, the valid range. Omitted where there are none.
//
// The raw underlying failure (a CDP rejection, an HTTP status) is a diagnostic
// rather than copy: it rides on the error's `message`/`cause` for logs and
// `DEBUG=cypress:cli:tap`, and is never rendered.
//
// Keep this module dependency-free: plain strings, commands in backticks for the
// CLI to highlight, and `docs` as a path rather than a URL.

export interface TapErrorCopy {
  description: string
  solution: string
  /** Append the CLI's standard "search for or open a GitHub issue" block. */
  recommendGhIssue?: boolean
  /** Path under the Cypress docs site, rendered as a "Learn more" block. */
  docs?: string
}

export type TapErrorCode =
  // Finding an instance to drive
  | 'NO_INSTANCE'
  | 'STALE_INSTANCE'
  | 'NO_BROWSER_ATTACHED'
  | 'RENDERER_UNRESPONSIVE'
  // Connecting to it
  | 'CDP_UNREACHABLE'
  | 'BINDING_NOT_FOUND'
  | 'BINDING_THREW'
  | 'STALE_HANDLE'
  // Agreeing on a protocol with it
  | 'PROTOCOL_MISMATCH'
  | 'CLI_OUTDATED'
  | 'INSTANCE_OUTDATED'
  // Reading its data
  | 'GRAPHQL_UNREACHABLE'
  | 'GRAPHQL_FAILED'
  // The run lifecycle
  | 'NO_RUN'
  | 'RUN_IN_PROGRESS'
  | 'RUN_FAILED'
  | 'SPEC_NOT_FOUND'
  | 'NO_PROJECT'
  | 'TESTING_TYPE_NOT_CONFIGURED'
  // Reading the app under test
  | 'NO_AUT'
  | 'INVALID_SELECTOR'
  | 'FRAME_READ_FAILED'
  // Selecting a test, command, or snapshot of a run
  | 'TEST_NOT_FOUND'
  | 'ATTEMPT_NOT_FOUND'
  | 'COMMAND_NOT_FOUND'
  | 'AMBIGUOUS_COMMAND'
  | 'SNAPSHOT_NOT_FOUND'
  | 'SNAPSHOT_UNAVAILABLE'
  | 'PIN_TARGET_REQUIRED'
  // Checking the invocation
  | 'UNKNOWN_COMMAND'
  | 'INVALID_ARGUMENTS'
  | 'INVALID_OPTIONS'
  | 'INVALID_PAYLOAD'
  | 'INVALID_INDEX'
  | 'INVALID_LIMIT'

const UPDATE_COMMAND = '`npm install --save-dev cypress@latest`'

export const TAP_ERROR_COPY: Record<TapErrorCode, TapErrorCopy> = {
  /**
   * Commands: all but `instances` — every other command resolves an instance
   * first. Two never render it: `status` reports `not connected` instead, and a
   * `--help` invocation prints help rather than failing.
   * Detail: `Looked for pid 4321.` when `--instance` named one; none otherwise.
   */
  NO_INSTANCE: {
    description: 'No running Cypress instance is available to drive.',
    solution: '`cypress tap` drives a Cypress you already have open. Start one with `cypress open`, then try again.',
  },
  /**
   * Commands: all but `instances`, on the same path as NO_INSTANCE — records
   * matched, but none answered its liveness probe.
   * Detail: `Looked for pid 4321.` when `--instance` named one; none otherwise.
   */
  STALE_INSTANCE: {
    description: 'Cypress was running, but is no longer responding.',
    solution: 'It likely exited uncleanly. Start Cypress again with `cypress open`, then try again.',
  },
  /**
   * Commands: the schema commands (`command`, `reporter`, `pin`, `run-state`,
   * `resolve-selector`) and `dom`, `aria`, `inspect` — the ones needing a browser
   * to drive. `specs`, `run`, and `status` resolve an instance without one.
   * Detail: `The instance is pid 4321, at /repo.` when exactly one is live;
   * otherwise the `--instance` filter, or none.
   */
  NO_BROWSER_ATTACHED: {
    description: 'Cypress is running, but no test browser is open.',
    solution: 'Open a browser in Cypress, then try again.',
  },
  /**
   * Commands: every command that opens a CDP session — the schema commands,
   * `dom`, `aria`, `inspect`, `status`. `instances` swallows it and reports
   * `rendererResponsive: false` instead of failing.
   * Detail: `It did not answer within 30000ms.` Which call went unanswered is a
   * protocol detail, so it stays on the diagnostic.
   */
  RENDERER_UNRESPONSIVE: {
    description: 'Cypress is reachable, but the page running it is not responding.',
    solution: 'It may be paused in DevTools, stuck in a loop, or starved of memory. Pass `--timeout <ms>` to wait longer.',
  },

  /**
   * Commands: every command that opens a CDP session — the schema commands,
   * `dom`, `aria`, `inspect`, `status`.
   * Detail: none. Six sites share this entry (opening the socket, listing
   * targets, attaching, evaluating the binding, reading it back, and the call
   * itself); none is separately actionable, so which one failed stays on the
   * diagnostic.
   */
  CDP_UNREACHABLE: {
    description: 'Lost the debugging connection to the browser running Cypress.',
    solution: 'The browser may have just closed. Make sure Cypress is running with a browser open, then try again.',
  },
  /**
   * Commands: every command that opens a CDP session — the schema commands,
   * `dom`, `aria`, `inspect`, `status`.
   * Detail: none. Raised both when no open page carries the binding and when a
   * page answered without one; the diagnostic tells the two apart.
   */
  BINDING_NOT_FOUND: {
    description: 'Could not find the running Cypress in any open browser tab.',
    solution: 'The instance may still be loading, so try again in a moment. If the problem persists, the tab running Cypress may have been closed; open a browser in Cypress and try again.',
  },
  /**
   * Commands: every command that calls a binding method — the schema commands,
   * `status`, and `dom`/`aria`/`inspect` through their run-state gate.
   * Detail: none. The method that threw and its exception stay on the
   * diagnostic, since neither is something the reader can act on.
   */
  BINDING_THREW: {
    description: 'The Cypress instance failed while running the command.',
    solution: 'Check the instance with `cypress tap status`, then try again.',
    recommendGhIssue: true,
  },
  /**
   * Commands: every command that calls a binding method — the schema commands,
   * `status`, `dom`, `aria`, `inspect` — and only once a retry has also failed.
   * Detail: none. The raw Chrome text ("Execution context was destroyed") is a
   * vendor string, so it stays on the diagnostic.
   */
  STALE_HANDLE: {
    description: 'The Cypress instance navigated while running the command.',
    solution: 'Run the command again.',
  },

  /**
   * Commands: the schema commands, either from the `getSchema` handshake or from
   * an `exec` reply that is neither a result nor a failure envelope. Also the
   * fallback for any code this CLI ships no entry for.
   * Detail: none. Which reply was unrecognizable stays on the diagnostic.
   */
  PROTOCOL_MISMATCH: {
    description: 'The running Cypress answered in a way this CLI does not recognize.',
    solution: `The running Cypress and this CLI are likely different versions. Update the older of the two with ${UPDATE_COMMAND}, then try again.`,
  },
  /**
   * Commands: the schema commands, from the `getSchema` handshake.
   * Detail: none. The two version numbers stay on the diagnostic — the remedy is
   * the same whichever they are.
   */
  CLI_OUTDATED: {
    description: 'The running Cypress is newer than this CLI.',
    solution: `Update the CLI with ${UPDATE_COMMAND}, then try again.`,
  },
  /**
   * Commands: the schema commands (handshake), plus `specs` and `run` when the
   * instance redirects a GraphQL request instead of answering it — a server old
   * enough to predate the direct-tap route.
   * Detail: none; the versions, or the redirected operation, stay on the
   * diagnostic.
   */
  INSTANCE_OUTDATED: {
    description: 'The running Cypress is older than this CLI.',
    solution: `Update Cypress in the running project with ${UPDATE_COMMAND}, restart it, then try again.`,
  },

  /**
   * Commands: `specs` and `run` — the two that read instance data over HTTP.
   * Detail: none. The operation and the transport failure (a refused socket, a
   * timeout, a non-200 status) stay on the diagnostic.
   */
  GRAPHQL_UNREACHABLE: {
    description: 'Could not reach the Cypress instance to read its data.',
    solution: 'The instance may have just closed. Make sure Cypress is running in open mode, then try again.',
  },
  /**
   * Commands: `specs` and `run`.
   * Detail: none. Whether the envelope was unrecognizable, carried GraphQL
   * errors, held no data, or was not JSON at all stays on the diagnostic.
   */
  GRAPHQL_FAILED: {
    description: 'The Cypress instance failed while answering a data query.',
    solution: 'Try the command again.',
    recommendGhIssue: true,
  },

  /**
   * Commands: `dom`, `aria`, `inspect` (no run has settled, so there is nothing
   * to read) and `command`, `reporter`, `pin` (no run mounted app-side).
   * Detail: none — there is nothing to name beyond the condition itself.
   */
  NO_RUN: {
    description: 'No spec has been run yet.',
    solution: 'Start one with `cypress tap run <spec>`, then read it once it has finished. `cypress tap specs` lists the specs this instance can run.',
  },
  /**
   * Commands: `dom`, `aria`, `inspect` (the app is in flux mid-run, so a read
   * would capture a transient page) and `pin`.
   * Detail: none.
   */
  RUN_IN_PROGRESS: {
    description: 'A spec is currently running.',
    solution: 'Wait for it to finish — `cypress tap status` reports when it has — then try again.',
  },
  /**
   * Commands: `run`.
   * Details:
   * - the mutation's GENERAL_ERROR: its own `detailMessage`.
   * - no result at all: The instance returned no result for
   *   "cypress/e2e/a.cy.ts".
   */
  RUN_FAILED: {
    description: 'The Cypress instance could not start the run.',
    solution: 'Check the instance with `cypress tap status`, then try again.',
    recommendGhIssue: true,
  },
  /**
   * Commands: `run`.
   * Details:
   * - absent from the instance's spec list, checked before any run is requested:
   *   Looked for "cypress/e2e/a.cy.ts".
   * - the mutation's SPEC_NOT_FOUND or NO_SPEC_PATTERN_MATCH: its own
   *   `detailMessage`.
   */
  SPEC_NOT_FOUND: {
    description: 'The instance has no spec matching that path.',
    solution: '`cypress tap specs` lists the specs this instance can run. If the spec exists but is not listed, widen `specPattern` in the Cypress config.',
  },
  /**
   * Commands: `run`, from the mutation's NO_PROJECT.
   * Detail: the mutation's `detailMessage`, when it sends one.
   */
  NO_PROJECT: {
    description: 'The Cypress instance has no project open.',
    solution: 'Open a project in Cypress, then try again.',
  },
  /**
   * Commands: `run`, from the mutation's TESTING_TYPE_NOT_CONFIGURED — the
   * spec's testing type is not one this project configures.
   * Detail: the mutation's `detailMessage`, when it sends one.
   */
  TESTING_TYPE_NOT_CONFIGURED: {
    description: 'That testing type is not configured for this project.',
    solution: 'Configure it in the Cypress config, or start Cypress in a testing type the project supports.',
    docs: '/configuration',
  },

  /**
   * Commands: `dom`, `aria`, `inspect` (no app-under-test frame in the runner
   * page) and `resolve-selector` (no selector source app-side).
   * Detail: none.
   */
  NO_AUT: {
    description: 'No app under test is loaded.',
    solution: 'Run a spec first with `cypress tap run <spec>`. To read the app as it was at an earlier command, pin that command with `cypress tap pin`.',
  },
  /**
   * Commands: `dom`, `aria`, `inspect` — raised by the match counter, the DOM
   * read, or the single-node lookup — and `resolve-selector`. All four go
   * through one factory so the wording cannot drift between them.
   * Detail: `The selector was ">>bad".`
   */
  INVALID_SELECTOR: {
    description: 'The app under test rejected the selector as invalid CSS.',
    solution: 'Check the selector for a syntax error, such as an unclosed quote or bracket, then try again.',
  },
  /**
   * Commands: `dom`, `aria`, `inspect` — an injected script threw inside the AUT
   * frame while counting matches, reading the DOM, or inspecting an element.
   * Detail: none. The script that threw and its exception stay on the diagnostic.
   */
  FRAME_READ_FAILED: {
    description: 'Reading the app under test failed.',
    solution: 'The page may have navigated mid-read. Try again once it has settled.',
    recommendGhIssue: true,
  },

  /**
   * Commands: `command`, `reporter`, `pin` — all three select a test by id.
   * Detail: `Looked for "r7".`
   */
  TEST_NOT_FOUND: {
    description: 'The run has no test matching that id.',
    solution: '`cypress tap reporter` lists this run’s tests and their ids.',
  },
  /**
   * Commands: `command`, `reporter`, `pin` — all three accept `--attempt`.
   * Details:
   * - never retried: Test "r2" has only 1 attempt.
   * - out of range: Test "r2" has 3 attempts, so `--attempt` takes 1–3.
   */
  ATTEMPT_NOT_FOUND: {
    description: 'That test has no such attempt.',
    solution: '`--attempt` takes a 1-based attempt number and selects an earlier attempt of a retried test; omit it for the latest.',
  },
  /**
   * Commands: `command` and `pin` — the two that resolve a command id to a
   * reporter row.
   * Detail: `Looked for "9".`
   */
  COMMAND_NOT_FOUND: {
    description: 'The test has no command matching that id.',
    solution: '`cypress tap reporter --test-id <id>` lists this test’s commands and their ids.',
  },
  /**
   * Commands: `command` and `pin`, when an unqualified row number matches rows
   * in two different hooks and neither is the test body.
   * Detail: `"2" matches h1:2 (before each) and h2:2 (before each) — e.g.
   * "h1:2".` The pair is what makes the id qualifiable.
   */
  AMBIGUOUS_COMMAND: {
    description: 'That command id matches more than one row of the test.',
    solution: 'Qualify the id with the section it belongs to, as `cypress tap reporter` lists it.',
  },
  /**
   * Commands: `pin`, when `--at` names neither a snapshot nor a valid index.
   * Detail: `Looked for "during". This command has: "before" (1), "after" (2).`
   * The enumeration is the point — it is how the reader picks a valid one.
   */
  SNAPSHOT_NOT_FOUND: {
    description: 'That command has no snapshot matching `--at`.',
    solution: '`--at` takes a snapshot name or a 1-based index; omit it to pin the command’s final state.',
  },
  /**
   * Commands: `pin`.
   * Details:
   * - no snapshot captured, or already evicted: none.
   * - the pin call went through but the app reported nothing pinned, a race with
   *   memory eviction: The app under test did not take the pin.
   */
  SNAPSHOT_UNAVAILABLE: {
    description: 'That command has no DOM snapshot to pin.',
    solution: 'Snapshots are captured in open mode and kept only for the most recent tests, as `numTestsKeptInMemory` sets. Run the spec again to capture fresh snapshots, or raise `numTestsKeptInMemory` to keep more.',
  },
  /**
   * Commands: `pin`, invoked with neither `--test-id`/`--command-id` nor
   * `--clear`.
   * Detail: none; the solution names both ways forward.
   */
  PIN_TARGET_REQUIRED: {
    description: 'The `pin` command was not told what to pin.',
    solution: 'Pass `--test-id` and `--command-id`, as listed by `cypress tap reporter`, or `--clear` to release the current pin.',
  },

  /**
   * Commands: any invocation naming a command neither the CLI nor the instance
   * offers, whether it was run or only asked for `--help`; and the binding's own
   * dispatch, which also guards against an inherited name like `constructor`.
   * Detail: `"instancs" is not available in this Cypress (v15.0.0), which offers:
   * instances, status, specs, …` — the listing is what makes a typo fixable.
   */
  UNKNOWN_COMMAND: {
    description: 'That is not a command this Cypress offers.',
    solution: 'Run `cypress tap --help` to list the commands available.',
  },
  /**
   * Commands: the schema commands, from positional coercion in the binding; and
   * `run`, from the mutation's NO_SPEC_PATH.
   * Detail: the coercion failure followed by the command's signature — `<spec>
   * must be a string, but number was given. Usage: cypress tap run <spec>` — or
   * the mutation's `detailMessage`.
   */
  INVALID_ARGUMENTS: {
    description: 'The command was given an argument it cannot accept.',
    solution: 'Run `cypress tap <command> --help` for the arguments it takes.',
  },
  /**
   * Commands: the schema commands, from flag coercion in the binding; and
   * `reporter`, when `--attempt` arrives without `--test-id`.
   * Details:
   * - flag coercion: the failure plus the command's signature, as in "pin" has
   *   no --foo option. Usage: cypress tap pin [options]
   * - `reporter` given `--attempt` alone: No --test-id was given, so there is no
   *   single test to select an attempt of.
   */
  INVALID_OPTIONS: {
    description: 'The command was given an option it cannot accept.',
    solution: 'Run `cypress tap <command> --help` for the options it takes.',
  },
  /**
   * Commands: the schema commands — but not reachable by mistyping a flag. It
   * means args or options crossed the wire as something other than an object, so
   * it reads as a protocol fault and asks for a report.
   * Detail: `"pin" received a non-object args payload, rather than one keyed by
   * name.`
   */
  INVALID_PAYLOAD: {
    description: 'The command was given input this CLI could not read.',
    solution: 'Run `cypress tap <command> --help` for the arguments and options it takes.',
    recommendGhIssue: true,
  },
  /**
   * Commands: `dom`, `aria`, `inspect` — the three that take `--at`.
   * Details, one per way the option can be wrong:
   * - not a whole number: the value read back, as in `--at` was given "abc".
   * - no selector to index into: says so, and names `--selector`.
   * - past the last match: the range, as in ".item" matched 3 elements, so
   *   `--at` takes 0 to 2.
   */
  INVALID_INDEX: {
    description: '`--at` is not a valid index into the matched elements.',
    solution: '`--at` takes a whole number, 0 or greater: a 0-based index into the elements `--selector` matched, so it needs a selector to index into and a match at that index.',
  },
  /**
   * Commands: `dom` (`--max-chars`) and `aria` (`--max-nodes`).
   * Detail: the offending flag and value, as in `--max-nodes` was given "0".
   * The flag is named because the two commands share this entry.
   */
  INVALID_LIMIT: {
    description: 'A size limit was not a positive integer.',
    solution: 'Options that cap the size of a read — `--max-chars`, `--max-nodes` — take a positive integer.',
  },
}

// An unknown code is a protocol mismatch by definition — the instance speaks of a
// failure this CLI has no copy for — but worth a report, since a same-version pair
// should never disagree.
const FALLBACK: TapErrorCopy = {
  ...TAP_ERROR_COPY.PROTOCOL_MISMATCH,
  recommendGhIssue: true,
}

/**
 * Copy for a code, which arrives from the instance over the wire — so anything that
 * is not a code we ship falls back rather than being trusted: a non-string, an
 * inherited name like `constructor`, or a code only a newer Cypress knows about.
 */
export const tapErrorCopy = (code: unknown): TapErrorCopy => {
  if (typeof code !== 'string' || !Object.prototype.hasOwnProperty.call(TAP_ERROR_COPY, code)) {
    return FALLBACK
  }

  return TAP_ERROR_COPY[code as TapErrorCode]
}

/** How a failure crosses the wire from the instance to the CLI. */
export interface TapErrorPayload {
  code: string
  /** The specifics of this one, if it has any the copy cannot know. */
  detail?: string
}

export interface TapErrorOptions {
  /** The specifics of this one, rendered under the registered copy. */
  detail?: string
  /** The underlying failure, for logs only — never rendered. */
  message?: string
  cause?: unknown
}

/**
 * The one error every tap failure is raised as, on both sides of the wire: the app
 * throws it from a command handler, the CLI throws it from discovery, transport, and
 * its own commands. `code` selects the copy; `detail` carries what the copy cannot
 * know; `message` is the diagnostic, which stays out of the rendered output.
 */
export class TapError extends Error {
  code: TapErrorCode
  detail?: string
  cause?: unknown

  constructor (code: TapErrorCode, options: TapErrorOptions = {}) {
    super(options.message ?? code)

    this.name = 'TapError'
    this.code = code

    if (options.detail !== undefined) {
      this.detail = options.detail
    }

    if (options.cause !== undefined) {
      this.cause = options.cause
    }
  }

  /** The wire form: the code and the specifics, never the diagnostic. */
  toPayload (): TapErrorPayload {
    return { code: this.code, ...(this.detail !== undefined ? { detail: this.detail } : {}) }
  }
}

export const isTapError = (err: unknown): err is TapError => {
  return err instanceof TapError
}
