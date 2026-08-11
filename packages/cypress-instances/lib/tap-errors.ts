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
  NO_INSTANCE: {
    description: 'No running Cypress instance is available to drive.',
    solution: '`cypress tap` drives a Cypress you already have open. Start one with `cypress open`, then try again.',
  },
  STALE_INSTANCE: {
    description: 'Cypress was running, but is no longer responding.',
    solution: 'It likely exited uncleanly. Start Cypress again with `cypress open`, then try again.',
  },
  NO_BROWSER_ATTACHED: {
    description: 'Cypress is running, but no test browser is open.',
    solution: 'Open a browser in Cypress, then try again.',
  },
  RENDERER_UNRESPONSIVE: {
    description: 'Cypress is reachable, but the page running it is not responding.',
    solution: 'It may be paused in DevTools, stuck in a loop, or starved of memory. Pass `--timeout <ms>` to wait longer.',
  },

  CDP_UNREACHABLE: {
    description: 'Lost the debugging connection to the browser running Cypress.',
    solution: 'The browser may have just closed. Make sure Cypress is running with a browser open, then try again.',
  },
  BINDING_NOT_FOUND: {
    description: 'Could not find the running Cypress in any open browser tab.',
    solution: 'The instance may still be loading, so try again in a moment. If the problem persists, the tab running Cypress may have been closed; open a browser in Cypress and try again.',
  },
  BINDING_THREW: {
    description: 'The Cypress instance failed while running the command.',
    solution: 'Check the instance with `cypress tap status`, then try again.',
    recommendGhIssue: true,
  },
  STALE_HANDLE: {
    description: 'The Cypress instance navigated while running the command.',
    solution: 'Run the command again.',
  },

  PROTOCOL_MISMATCH: {
    description: 'The running Cypress answered in a way this CLI does not recognize.',
    solution: `The running Cypress and this CLI are likely different versions. Update the older of the two with ${UPDATE_COMMAND}, then try again.`,
  },
  CLI_OUTDATED: {
    description: 'The running Cypress is newer than this CLI.',
    solution: `Update the CLI with ${UPDATE_COMMAND}, then try again.`,
  },
  INSTANCE_OUTDATED: {
    description: 'The running Cypress is older than this CLI.',
    solution: `Update Cypress in the running project with ${UPDATE_COMMAND}, restart it, then try again.`,
  },

  GRAPHQL_UNREACHABLE: {
    description: 'Could not reach the Cypress instance to read its data.',
    solution: 'The instance may have just closed. Make sure Cypress is running in open mode, then try again.',
  },
  GRAPHQL_FAILED: {
    description: 'The Cypress instance failed while answering a data query.',
    solution: 'Try the command again.',
    recommendGhIssue: true,
  },

  NO_RUN: {
    description: 'No spec has been run yet.',
    solution: 'Start one with `cypress tap run <spec>`, then read it once it has finished. `cypress tap specs` lists the specs this instance can run.',
  },
  RUN_IN_PROGRESS: {
    description: 'A spec is currently running.',
    solution: 'Wait for it to finish — `cypress tap status` reports when it has — then try again.',
  },
  RUN_FAILED: {
    description: 'The Cypress instance could not start the run.',
    solution: 'Check the instance with `cypress tap status`, then try again.',
    recommendGhIssue: true,
  },
  SPEC_NOT_FOUND: {
    description: 'The instance has no spec matching that path.',
    solution: '`cypress tap specs` lists the specs this instance can run. If the spec exists but is not listed, widen `specPattern` in the Cypress config.',
  },
  NO_PROJECT: {
    description: 'The Cypress instance has no project open.',
    solution: 'Open a project in Cypress, then try again.',
  },
  TESTING_TYPE_NOT_CONFIGURED: {
    description: 'That testing type is not configured for this project.',
    solution: 'Configure it in the Cypress config, or start Cypress in a testing type the project supports.',
    docs: '/configuration',
  },

  NO_AUT: {
    description: 'No app under test is loaded.',
    solution: 'Run a spec first with `cypress tap run <spec>`. To read the app as it was at an earlier command, pin that command with `cypress tap pin`.',
  },
  INVALID_SELECTOR: {
    description: 'The app under test rejected the selector as invalid CSS.',
    solution: 'Check the selector for a syntax error, such as an unclosed quote or bracket, then try again.',
  },
  FRAME_READ_FAILED: {
    description: 'Reading the app under test failed.',
    solution: 'The page may have navigated mid-read. Try again once it has settled.',
    recommendGhIssue: true,
  },

  TEST_NOT_FOUND: {
    description: 'The run has no test matching that id.',
    solution: '`cypress tap reporter` lists this run’s tests and their ids.',
  },
  ATTEMPT_NOT_FOUND: {
    description: 'That test has no such attempt.',
    solution: '`--attempt` takes a 1-based attempt number and selects an earlier attempt of a retried test; omit it for the latest.',
  },
  COMMAND_NOT_FOUND: {
    description: 'The test has no command matching that id.',
    solution: '`cypress tap reporter --test-id <id>` lists this test’s commands and their ids.',
  },
  AMBIGUOUS_COMMAND: {
    description: 'That command id matches more than one row of the test.',
    solution: 'Qualify the id with the section it belongs to, as `cypress tap reporter` lists it.',
  },
  SNAPSHOT_NOT_FOUND: {
    description: 'That command has no snapshot matching `--at`.',
    solution: '`--at` takes a snapshot name or a 1-based index; omit it to pin the command’s final state.',
  },
  SNAPSHOT_UNAVAILABLE: {
    description: 'That command has no DOM snapshot to pin.',
    solution: 'Snapshots are captured in open mode and kept only for the most recent tests, as `numTestsKeptInMemory` sets. Run the spec again to capture fresh snapshots, or raise `numTestsKeptInMemory` to keep more.',
  },
  PIN_TARGET_REQUIRED: {
    description: 'The `pin` command was not told what to pin.',
    solution: 'Pass `--test-id` and `--command-id`, as listed by `cypress tap reporter`, or `--clear` to release the current pin.',
  },

  UNKNOWN_COMMAND: {
    description: 'That is not a command this Cypress offers.',
    solution: 'Run `cypress tap --help` to list the commands available.',
  },
  INVALID_ARGUMENTS: {
    description: 'The command was given an argument it cannot accept.',
    solution: 'Run `cypress tap <command> --help` for the arguments it takes.',
  },
  INVALID_OPTIONS: {
    description: 'The command was given an option it cannot accept.',
    solution: 'Run `cypress tap <command> --help` for the options it takes.',
  },
  INVALID_PAYLOAD: {
    description: 'The command was given input this CLI could not read.',
    solution: 'Run `cypress tap <command> --help` for the arguments and options it takes.',
    recommendGhIssue: true,
  },
  INVALID_INDEX: {
    description: '`--at` is not a valid index into the matched elements.',
    solution: '`--at` takes a whole number, 0 or greater: a 0-based index into the elements `--selector` matched, so it needs a selector to index into and a match at that index.',
  },
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
