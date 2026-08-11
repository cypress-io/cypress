// The copy for every `cypress tap` failure, keyed by its code.
//
// A code is a registry key, not output: the CLI prints the condition, the specifics
// and the remedy as plain paragraphs, and never prints the key. That is why codes
// raised only CLI-side live here too, alongside the ones the app raises over the
// wire: one lookup table means one answer to what a tap failure means, and one place
// to add the next one.
//
// A failure fills the slots like so:
//
//   description  the condition, generic — never interpolated
//   detail       the specifics, at the throw site: the selector, the available
//                snapshots, the valid range. Omitted where there are none.
//   solution     what to do about it, generic — never interpolated. Omitted where
//                the specifics already say it.
//
// A condition whose opening line names its subject — the value that will not do,
// the command that does not exist — cannot be written as a generic sentence, so
// its copy lives in a factory at the foot of this module instead of in the table.
// Both sides of the wire raise it through that factory, which is what keeps the
// wording in one place; the entry is then the code and its doc comment alone.
//
// The raw underlying failure (a CDP rejection, an HTTP status) is a diagnostic
// rather than copy: it rides on the error's `message`/`cause` for logs and
// `DEBUG=cypress:cli:tap`, and is never rendered.
//
// Keep this module dependency-free: plain strings, commands in backticks for the
// CLI to highlight, and `docs` as a path rather than a URL.

export interface TapErrorCopy {
  description?: string
  solution?: string
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
  // The spec lifecycle
  | 'SPEC_NOT_STARTED'
  | 'SPEC_IN_PROGRESS'
  | 'SPEC_START_FAILED'
  | 'SPEC_NOT_FOUND'
  | 'NO_PROJECT'
  | 'TESTING_TYPE_NOT_CONFIGURED'
  // Reading the app under test
  | 'NO_AUT'
  | 'FRAME_READ_FAILED'
  // Selecting a test, command, or snapshot of a spec
  | 'TEST_NOT_FOUND'
  | 'ATTEMPT_NOT_FOUND'
  | 'COMMAND_NOT_FOUND'
  | 'AMBIGUOUS_COMMAND'
  | 'SNAPSHOT_NOT_FOUND'
  | 'SNAPSHOT_UNAVAILABLE'
  | 'PIN_TARGET_REQUIRED'
  // Checking the invocation
  | 'UNKNOWN_COMMAND'
  | 'UNKNOWN_OPTION'
  | 'MISSING_COMPANION_OPTION'
  | 'INVALID_ARGUMENTS'
  | 'INVALID_OPTIONS'
  | 'INVALID_PAYLOAD'
  | 'INVALID_VALUE'

const UPDATE_COMMAND = '`npm install --save-dev cypress@latest`'

/**
 * The same map read the other way: which failures each command can report. Three
 * sets recur, because every command shares one discovery path, one transport
 * layer, and one dispatcher — they are named once here and referred to below
 * rather than repeated per command.
 *
 *   DISCOVERY  NO_INSTANCE, STALE_INSTANCE
 *   TRANSPORT  RENDERER_UNRESPONSIVE, CDP_UNREACHABLE, BINDING_NOT_FOUND,
 *              BINDING_THREW, STALE_HANDLE, PROTOCOL_MISMATCH
 *   DISPATCH   UNKNOWN_COMMAND, UNKNOWN_OPTION, INVALID_ARGUMENTS,
 *              MISSING_COMPANION_OPTION, INVALID_OPTIONS, INVALID_PAYLOAD,
 *              INVALID_VALUE
 *
 * instances:
 * - none. It reports the instances it found and swallows every probe failure, so
 *   an unresponsive one reads as `rendererResponsive: false` rather than an error.
 *
 * status:
 * - DISCOVERY, but reported as `not connected` at exit 0 — never rendered
 * - TRANSPORT
 *
 * specs:
 * - DISCOVERY
 * - GRAPHQL_UNREACHABLE, GRAPHQL_FAILED, INSTANCE_OUTDATED
 *
 * run:
 * - DISCOVERY
 * - GRAPHQL_UNREACHABLE, GRAPHQL_FAILED, INSTANCE_OUTDATED
 * - SPEC_NOT_FOUND, SPEC_START_FAILED, NO_PROJECT, TESTING_TYPE_NOT_CONFIGURED,
 *   INVALID_ARGUMENTS — the last four mapped from the runSpec mutation's codes
 *
 * Every command also answers UNKNOWN_COMMAND and UNKNOWN_OPTION before it runs:
 * the CLI parses the invocation against the schema it holds, so a name or flag
 * that is not in it never reaches the instance.
 *
 * dom, aria, inspect:
 * - INVALID_VALUE, from their own option parsing, before an instance is resolved
 * - DISCOVERY, plus NO_BROWSER_ATTACHED
 * - TRANSPORT
 * - SPEC_NOT_STARTED, SPEC_IN_PROGRESS — the spec-lifecycle gate, before any read
 * - NO_AUT, FRAME_READ_FAILED
 * - INVALID_VALUE again, for a rejected `--selector` or an `--at` past the last
 *   match, and MISSING_COMPANION_OPTION for `--at` with no `--selector`
 *
 * The rest run on the instance through the binding, so all of them carry
 * DISCOVERY, NO_BROWSER_ATTACHED, TRANSPORT, DISPATCH, and the version pair
 * CLI_OUTDATED / INSTANCE_OUTDATED from the schema handshake. What each adds:
 *
 * command:
 * - SPEC_NOT_STARTED, TEST_NOT_FOUND, ATTEMPT_NOT_FOUND, COMMAND_NOT_FOUND,
 *   AMBIGUOUS_COMMAND
 *
 * reporter:
 * - SPEC_NOT_STARTED, TEST_NOT_FOUND, ATTEMPT_NOT_FOUND
 * - MISSING_COMPANION_OPTION, for `--attempt` without `--test-id`
 *
 * pin:
 * - SPEC_NOT_STARTED, SPEC_IN_PROGRESS, TEST_NOT_FOUND, ATTEMPT_NOT_FOUND,
 *   COMMAND_NOT_FOUND, AMBIGUOUS_COMMAND
 * - SNAPSHOT_NOT_FOUND, SNAPSHOT_UNAVAILABLE, PIN_TARGET_REQUIRED
 *
 * run-state (hidden; `status` and the AUT readers call it):
 * - none of its own. It answers with the spec's state, reporting even a failed
 *   spec build as a result rather than a failure.
 *
 * resolve-selector (hidden; the AUT readers call it to name ambiguous matches):
 * - NO_AUT, INVALID_VALUE
 */
export const TAP_ERROR_COPY: Record<TapErrorCode, TapErrorCopy> = {
  /**
   * Commands: all but `instances` — every other command resolves an instance
   * first. Two never render it: `status` reports `not connected` instead, and a
   * `--help` invocation prints help rather than failing.
   * Detail: `Looked for pid 4321.` when `--instance` named one; none otherwise.
   */
  NO_INSTANCE: {
    description: 'Could not find an open-mode session to tap into.',
    solution: 'Start Cypress with `cypress open`, select a testing type and launch a browser, then try again.',
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
    solution: 'Open a Chromium browser in Cypress, then try again.',
  },
  /**
   * Commands: every command that opens a CDP session — the schema commands,
   * `dom`, `aria`, `inspect`, `status`. `instances` swallows it and reports
   * `rendererResponsive: false` instead of failing.
   * Detail: `No response within the specified timeout (30000ms).` Which call went unanswered is a
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
  SPEC_NOT_STARTED: {
    description: 'No spec is available to read.',
    solution: 'Start a spec with the `run` command, then read it once it has finished.',
  },
  /**
   * Commands: `dom`, `aria`, `inspect` (the app is in flux mid-run, so a read
   * would capture a transient page) and `pin`.
   * Detail: always the line `specInProgressTapError` builds, which names the spec
   * that is running — hence no condition of its own here.
   *
   * @deprecated - raise it with specInProgressTapError(), which writes its copy
   */
  SPEC_IN_PROGRESS: {
    solution: 'Use `cypress tap status` to verify when the spec has finished.',
  },
  /**
   * Commands: `run`.
   * Details:
   * - the mutation's GENERAL_ERROR: its own `detailMessage`.
   * - no result at all: The instance returned no result for
   *   "cypress/e2e/a.cy.ts".
   */
  SPEC_START_FAILED: {
    description: 'The Cypress instance could not start the spec.',
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
   * The three lookups share one shape, raised through `notFoundTapError`: what was
   * being looked for, the option and value that named nothing, and where the real
   * ones are listed. See its doc for the line each detail carries.
   *
   * Commands: `command`, `reporter`, `pin` — all three select a test by id.
   *
   * @deprecated - raise it with notFoundTapError(), which writes its detail
   */
  TEST_NOT_FOUND: {
    description: 'No test in this spec matched that id.',
    solution: 'Run `cypress tap reporter` to list the tests in the spec.',
  },
  /**
   * Commands: `command`, `reporter`, `pin` — all three accept `--attempt`.
   *
   * @deprecated - raise it with notFoundTapError(), which writes its detail
   */
  ATTEMPT_NOT_FOUND: {
    description: 'No attempt of this test matched that number.',
    solution: '`--attempt` takes a 1-based attempt number and selects an earlier attempt of a retried test; omit it for the latest.',
  },
  /**
   * Commands: `command` and `pin` — the two that resolve a command id to a
   * reporter row.
   *
   * @deprecated - raise it with notFoundTapError(), which writes its detail
   */
  COMMAND_NOT_FOUND: {
    description: 'No command in this test matched that id.',
    solution: 'Run `cypress tap reporter --test-id <id>` to list the commands in the test.',
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
   * Commands: `pin`, when `--at` names neither a snapshot nor a valid index. Its
   * context clause enumerates the snapshots the command does have, which is how
   * the reader picks a valid one.
   *
   * @deprecated - raise it with notFoundTapError(), which writes its detail
   */
  SNAPSHOT_NOT_FOUND: {
    description: 'No snapshot of this command matched that name or index.',
    solution: 'Run `cypress tap command --test-id <id> --command-id <id>` to list the snapshots a command has. `--at` takes a snapshot name or a 1-based index; omit it to pin the command’s final state.',
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
   * Raised through `unknownCommandTapError`, so its copy lives there. The listing
   * that follows is what makes a typo fixable: the CLI's own help, or the
   * commands the binding offers.
   */
  /** @deprecated - raise it with unknownCommandTapError(), which writes its copy */
  UNKNOWN_COMMAND: {},
  /**
   * Commands: any invocation passing a flag the command does not declare, caught
   * CLI-side as the command's grammar parses; and the binding's own coercion, for
   * a caller that reaches it directly. Raised through `unknownOptionTapError`.
   * An option the command does take but was given wrongly is INVALID_OPTIONS (a
   * required one missing, one that needs another alongside it) or INVALID_VALUE
   * (a value of the wrong type).
   */
  /** @deprecated - raise it with unknownOptionTapError(), which writes its copy */
  UNKNOWN_OPTION: {},
  /**
   * Commands: the schema commands, when an argument is unknown or a required one
   * is missing; and `run`, from the mutation's NO_SPEC_PATH. An argument of the
   * wrong type is INVALID_VALUE instead.
   * Detail: the fault followed by the command's signature — `<foo> was passed to
   * "run", but it's not a supported argument of "run". Usage: cypress tap run
   * <spec>` — or the mutation's `detailMessage`.
   */
  INVALID_ARGUMENTS: {
    description: 'The command was given an argument it cannot accept.',
    solution: 'Run `cypress tap <command> --help` for the arguments it takes.',
  },
  /**
   * Commands: the schema commands, when a required flag is missing. A flag of the
   * wrong type is INVALID_VALUE, one that needs another alongside it is
   * MISSING_COMPANION_OPTION, and a flag the CLI knows the command does not take
   * never reaches here — the CLI names it and prints that command's help.
   * Detail: the fault plus the command's signature, as in "pin" is missing the
   * required --test-id option. Usage: cypress tap pin [options]
   */
  INVALID_OPTIONS: {
    description: 'The command was given an option it cannot accept.',
    solution: 'Run `cypress tap <command> --help` for the options it takes.',
  },
  /**
   * Commands: `reporter`, for `--attempt` without `--test-id`; and `dom`, `aria`,
   * `inspect`, for `--at` without `--selector`. Both flags are named, and what
   * dropping either one leaves you with is the throw site's to say.
   *
   * @deprecated - raise it with missingCompanionOptionTapError(), which writes its copy
   */
  MISSING_COMPANION_OPTION: {},
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
   * Commands: any command taking a value this CLI or the instance rejects —
   * `--max-chars`/`--max-nodes`, `--at` (malformed or past the last match),
   * `--selector`, and the schema commands' own positional and flag coercion.
   * Detail: always the two paragraphs `invalidValue` builds, which is why this
   * entry carries no solution — the expectation is the solution.
   *
   * @deprecated - raise it with invalidValueTapError(), which writes its copy
   */
  INVALID_VALUE: {
    description: 'An invalid value was given.',
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
 * The codes whose copy is a factory's rather than the table's. Their opening line
 * names a subject the table cannot know, so raising one bare would print a failure
 * with nothing above its specifics — hence the constructor will not take them, and
 * the factories at the foot of this module are the way in.
 */
export type FactoryRaisedTapErrorCode =
  | 'INVALID_VALUE'
  | 'TEST_NOT_FOUND'
  | 'ATTEMPT_NOT_FOUND'
  | 'COMMAND_NOT_FOUND'
  | 'SNAPSHOT_NOT_FOUND'
  | 'UNKNOWN_COMMAND'
  | 'UNKNOWN_OPTION'
  | 'MISSING_COMPANION_OPTION'
  | 'SPEC_IN_PROGRESS'

/** Every code a caller may raise directly: the ones whose copy the table holds. */
export type RaisableTapErrorCode = Exclude<TapErrorCode, FactoryRaisedTapErrorCode>

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

  constructor (code: RaisableTapErrorCode, options: TapErrorOptions = {}) {
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

// The one door through the constructor's guard, so that every code it keeps out is
// still built the same way — with the copy its factory below writes.
const factoryRaised = (code: FactoryRaisedTapErrorCode, detail: string): TapError => {
  return new TapError(code as unknown as RaisableTapErrorCode, { detail })
}

/**
 * The one way to report a value a command cannot use: what was expected of the named
 * input, then the value as it arrived. Both sides of the wire raise it through here,
 * so a bad `--at` reads the same whether the CLI caught it or the instance did.
 */
export const invalidValueTapError = (name: string, expected: string, value: unknown): TapError => {
  return factoryRaised('INVALID_VALUE', `Expected \`${name}\` to be ${expected}.\n\nInstead the value was: ${JSON.stringify(value)}`)
}

/** The lookups that answer the same way: a well-formed id that named nothing. */
export type NotFoundTapErrorCode = 'TEST_NOT_FOUND' | 'ATTEMPT_NOT_FOUND' | 'COMMAND_NOT_FOUND' | 'SNAPSHOT_NOT_FOUND'

/**
 * A selector that was read fine but matched nothing the run has. Each entry states
 * what was being looked for and where the real ones are listed; this writes the one
 * line only the throw site can — which option was given what — plus whatever narrows
 * the search, such as how many attempts the test actually has.
 */
export const notFoundTapError = (code: NotFoundTapErrorCode, option: string, value: unknown, context?: string): TapError => {
  return factoryRaised(code, `Looked for \`${option}\` ${JSON.stringify(value)}.${context ? ` ${context}` : ''}`)
}

/**
 * A flag that only means something alongside another one. Both are named here;
 * `remedy` is the throw site's, because what dropping either one leaves you with
 * is particular to the pair — a spec-wide view, the whole document.
 */
export const missingCompanionOptionTapError = (given: string, required: string, remedy: string): TapError => {
  return factoryRaised('MISSING_COMPANION_OPTION', `You passed the \`${given}\` flag without also passing the \`${required}\` flag.\n\n${remedy}`)
}

/**
 * A name no command answers to, and a flag no command declares: say which one was
 * given, then list the real ones. `listing` is whatever names them where the failure
 * was noticed — the CLI's generated help, or the commands the binding offers — and
 * is the remedy, which is why neither carries a solution of its own.
 */
export const unknownCommandTapError = (name: string, listing: string): TapError => {
  return factoryRaised('UNKNOWN_COMMAND', `Unknown command "${name}"\n\n${listing}`)
}

export const unknownOptionTapError = (flag: string, listing: string): TapError => {
  return factoryRaised('UNKNOWN_OPTION', `Unknown option "${flag}"\n\n${listing}`)
}

/**
 * The spec that is mid-run, which is what makes the condition actionable: it names
 * what to wait on. Both sides raise it through here — the CLI from its run-state
 * gate, the app from the runner — and the spec is only unnamed in the moment
 * between one being selected and its path being known.
 */
export const specInProgressTapError = (spec: string | null): TapError => {
  return factoryRaised('SPEC_IN_PROGRESS', spec ? `The spec ${spec} is currently running.` : 'The spec is currently running.')
}

/**
 * Re-raise a failure the instance already named. The code is whatever crossed the
 * wire — including one a factory built over there, whose copy arrived with it — so
 * this takes what the constructor will not.
 */
export const tapErrorFromPayload = (payload: TapErrorPayload): TapError => {
  return new TapError(payload.code as RaisableTapErrorCode, { detail: payload.detail })
}
