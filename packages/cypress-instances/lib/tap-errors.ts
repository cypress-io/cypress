// The copy for every `cypress tap` failure, keyed by its code. Code is not usefacing and is
// just used in debug logs and telemetry.

export interface TapErrorCopy {
  description?: string
  solution?: string
  /** Append the CLI's standard "search for or open a GitHub issue" block. */
  recommendGhIssue?: boolean
  /** Path under the Cypress docs site, rendered as a "Learn more" block. */
  docs?: string
  /**
   * The invocation itself is what failed, so the called command's generated help
   * is the remedy: it names every argument and option that would have worked. The
   * CLI holds that help and prints it in place of `solution`, which could only
   * point at the same thing. `solution` still answers for a raiser with no help to
   * hand.
   */
  attachHelp?: boolean
}

const UPDATE_COMMAND = '`npm install --save-dev cypress@latest`'

/**
 * What every failure calls the running Cypress a tap command targets.
 */
export const TAP_TARGET = 'Cypress session'

export const TAP_ERROR_COPY = {
  // Finding an instance to drive
  /** Raised when discovery found no instance record at all, and none was named. */
  NO_INSTANCE: {
    description: `Could not find a ${TAP_TARGET} to tap into.`,
    solution: 'Start Cypress with `cypress open`, select a testing type and launch a browser, then try again.',
  },
  /**
   * Raised when `--instance` named a pid no record on disk matches.
   *
   * @deprecated - raise it with notFoundTapError(), which writes its detail
   */
  INSTANCE_NOT_FOUND: {
    description: `No ${TAP_TARGET} matched that process id.`,
    solution: `Run \`cypress tap instances\` to list the ${TAP_TARGET}s you can tap into.`,
  },
  /** Raised when records matched, but none answered its liveness probe. */
  STALE_INSTANCE: {
    description: `The ${TAP_TARGET} was running, but is no longer responding.`,
    solution: 'It likely exited uncleanly. Start Cypress again with `cypress open`, then try again.',
  },
  /** Raised when the instance is live, but has no browser open to drive. */
  NO_BROWSER_ATTACHED: {
    description: `The ${TAP_TARGET} is running, but no test browser is open.`,
    solution: 'Open a Chromium based browser in Cypress, then try again.',
  },
  /** Raised when a CDP call went unanswered until the timeout elapsed. */
  RENDERER_UNRESPONSIVE: {
    description: `The ${TAP_TARGET} is reachable, but the page running it is not responding.`,
    solution: 'It may be paused in DevTools, stuck in a loop, or starved of memory. Pass `--timeout <ms>` to wait longer.',
  },

  // Connecting to it
  /** Raised when the CDP connection could not be opened, or dropped mid-command. */
  CDP_UNREACHABLE: {
    description: `Lost the connection to the ${TAP_TARGET}'s browser.`,
    solution: 'The browser may have just closed. Make sure Cypress is running with a browser open, then try again.',
  },
  /** Raised when no open page carries the tap binding. */
  BINDING_NOT_FOUND: {
    description: `Could not make a connection to the ${TAP_TARGET}.`,
    solution: `The ${TAP_TARGET} may still be loading, so try again in a moment. If the problem persists, the tab running Cypress may have been closed; open a browser in Cypress and try again.`,
  },
  /** Raised when a binding method threw while running the command. */
  BINDING_THREW: {
    description: `The ${TAP_TARGET} failed while running the command.`,
    solution: `Check the ${TAP_TARGET} with \`cypress tap status\`, then try again.`,
    recommendGhIssue: true,
  },
  /** Raised when the page navigated mid-call, and the retry hit it again. */
  STALE_HANDLE: {
    description: `The ${TAP_TARGET} navigated while running the command.`,
    solution: 'Run the command again.',
  },

  // Agreeing on a protocol with it
  /** Raised when the instance replied in a shape this CLI has no handling for. */
  PROTOCOL_MISMATCH: {
    description: `The ${TAP_TARGET} answered in a way this CLI does not recognize.`,
    solution: `The ${TAP_TARGET} and this CLI are likely different versions. Update the older of the two with ${UPDATE_COMMAND}, then try again.`,
  },
  /** Raised when the handshake reported a schema version newer than this CLI's. */
  CLI_OUTDATED: {
    description: `The targeted ${TAP_TARGET} is newer than this CLI.`,
    solution: `Update the CLI with ${UPDATE_COMMAND}, then try again.`,
  },
  /** Raised when the handshake reported an older schema version, or GraphQL redirected. */
  INSTANCE_OUTDATED: {
    description: `The targeted ${TAP_TARGET} is older than this CLI.`,
    solution: `Update Cypress in the running project with ${UPDATE_COMMAND}, restart it, then try again.`,
  },

  // Reading its data
  /** Raised when a GraphQL request never got an answer over HTTP. */
  GRAPHQL_UNREACHABLE: {
    description: `Could not connect to the ${TAP_TARGET} to read its data.`,
    solution: `The ${TAP_TARGET} may have just closed. Make sure Cypress is running in open mode, then try again.`,
    recommendGhIssue: true,
  },
  /** Raised when GraphQL answered, but with errors, no data, or not JSON. */
  GRAPHQL_FAILED: {
    description: `The ${TAP_TARGET} failed while answering a data query.`,
    solution: 'Try the command again.',
    recommendGhIssue: true,
  },

  // The spec lifecycle
  /** Raised when a spec was read before any has run. */
  SPEC_NOT_STARTED: {
    description: 'No spec is available to read.',
    solution: 'Start a spec with the `run` command, then read it once it has finished.',
  },
  /**
   * Raised when a spec was read while it is still running.
   *
   * @deprecated - raise it with specInProgressTapError(), which writes its copy
   */
  SPEC_IN_PROGRESS: {
    solution: 'Use `cypress tap status` to verify when the spec has finished.',
  },
  /** Raised when the runSpec mutation failed, or answered with no result. */
  SPEC_START_FAILED: {
    description: `The ${TAP_TARGET} could not start the spec.`,
    solution: `Check the ${TAP_TARGET} with \`cypress tap status\`, then try again.`,
  },
  /** Raised when the given path matches no spec the instance can run. */
  SPEC_NOT_FOUND: {
    description: `The ${TAP_TARGET} has no spec matching that path.`,
    solution: `\`cypress tap specs\` lists the specs the ${TAP_TARGET} can run. If the spec exists but is not listed, widen \`specPattern\` in the Cypress config.`,
  },
  /** Raised when the instance is running with no project open. */
  NO_PROJECT: {
    description: `The ${TAP_TARGET} has no project open.`,
    solution: 'Open a project in Cypress, then try again.',
  },
  /** Raised when the spec's testing type is not one this project configures. */
  TESTING_TYPE_NOT_CONFIGURED: {
    description: 'That testing type is not configured for this project.',
    solution: 'Configure it in the Cypress config, or start Cypress in a testing type the project supports.',
    docs: '/configuration',
  },

  // Reading the app under test
  /** Raised when the runner page holds no app-under-test frame to read. */
  NO_AUT: {
    description: `Failed to determine the app under test in the ${TAP_TARGET}.`,
    solution: 'Run a spec first with `cypress tap run <spec>`. To read the app as it was at an earlier command, pin that command with `cypress tap pin`.',
  },
  /** Raised when an injected script threw inside the AUT frame. */
  FRAME_READ_FAILED: {
    description: 'Reading the app under test failed.',
    solution: 'The page may have navigated mid-read. Try again once it has settled.',
    recommendGhIssue: true,
  },

  // Selecting a test, command, or snapshot of a spec
  /**
   * Raised when `--test-id` named a test this spec does not have.
   *
   * @deprecated - raise it with notFoundTapError(), which writes its detail
   */
  TEST_NOT_FOUND: {
    description: 'No test in this spec matched that id.',
    solution: 'Run `cypress tap reporter` to list the tests in the spec.',
  },
  /**
   * Raised when `--attempt` named a number past the test's attempts.
   *
   * @deprecated - raise it with notFoundTapError(), which writes its detail
   */
  ATTEMPT_NOT_FOUND: {
    description: 'No attempt of this test matched that number.',
    solution: '`--attempt` takes a 1-based attempt number and selects an earlier attempt of a retried test; omit it for the latest.',
  },
  /**
   * Raised when `--command-id` named a reporter row this test does not have.
   *
   * @deprecated - raise it with notFoundTapError(), which writes its detail
   */
  COMMAND_NOT_FOUND: {
    description: 'No command in this test matched that id.',
    solution: 'Run `cypress tap reporter --test-id <id>` to list the commands in the test.',
  },
  /** Raised when an unqualified row number matches rows in two different hooks. */
  AMBIGUOUS_COMMAND: {
    description: 'That command id matches more than one row of the test.',
    solution: 'Qualify the id with the section it belongs to, as `cypress tap reporter` lists it.',
  },
  /**
   * Raised when `--at` named neither a snapshot of the command nor a valid index.
   *
   * @deprecated - raise it with notFoundTapError(), which writes its detail
   */
  SNAPSHOT_NOT_FOUND: {
    description: 'No snapshot of this command matched that name or index.',
    solution: 'Run `cypress tap command --test-id <id> --command-id <id>` to list the snapshots a command has. `--at` takes a snapshot name or a 1-based index; omit it to pin the command’s final state.',
  },
  /** Raised when the command captured no snapshot, or it has since been evicted. */
  SNAPSHOT_UNAVAILABLE: {
    description: 'That command has no DOM snapshot to pin.',
    solution: 'Snapshots are captured in open mode and kept only for the most recent tests, as `numTestsKeptInMemory` sets. Run the spec again to capture fresh snapshots, or raise `numTestsKeptInMemory` to keep more.',
  },

  // Checking the invocation
  /**
   * Raised when the invocation named a command that does not exist.
   *
   * @deprecated - raise it with unknownCommandTapError(), which writes its copy
   */
  UNKNOWN_COMMAND: {
    attachHelp: true,
  },
  /**
   * Raised when the invocation passed a flag the command does not declare.
   *
   * @deprecated - raise it with unknownOptionTapError(), which writes its copy
   */
  UNKNOWN_OPTION: {
    attachHelp: true,
  },
  /** Raised when an argument is unknown, or a required one is missing. */
  INVALID_ARGUMENTS: {
    description: 'The command was called with invalid arguments.',
    solution: 'Run `cypress tap <command> --help` for the arguments it takes.',
    attachHelp: true,
  },
  /** Raised when a required option is missing. */
  INVALID_OPTIONS: {
    description: 'The command was called with invalid options.',
    solution: 'Run `cypress tap <command> --help` for the options it takes.',
    attachHelp: true,
  },
  /**
   * Raised when a flag was passed without the flag it depends on.
   *
   * @deprecated - raise it with missingCompanionOptionTapError(), which writes its copy
   */
  MISSING_COMPANION_OPTION: {},
  /**
   * Raised when a known input was given a value of the wrong type or range.
   *
   * @deprecated - raise it with invalidValueTapError(), which writes its copy
   */
  INVALID_VALUE: {
    description: 'An invalid value was given.',
  },
} satisfies Record<string, TapErrorCopy>

/** Every failure `cypress tap` can report: the keys of the table above. */
export type TapErrorCode = keyof typeof TAP_ERROR_COPY

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
  | 'INSTANCE_NOT_FOUND'
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
export type NotFoundTapErrorCode = 'INSTANCE_NOT_FOUND' | 'TEST_NOT_FOUND' | 'ATTEMPT_NOT_FOUND' | 'COMMAND_NOT_FOUND' | 'SNAPSHOT_NOT_FOUND'

/**
 * A value that was read fine but matched nothing there is. Each entry states what
 * was being looked for and where the real ones are listed; this writes the one line
 * only the throw site can — which option was given what — plus whatever narrows the
 * search, such as how many attempts the test actually has.
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
 * given, then list the real ones. The listing is the remedy, which is why neither
 * carries a solution of its own — and it is the generated help of whatever was
 * called, which the CLI holds and appends as it renders. `listing` is for a raiser
 * with one of its own and no renderer to defer to.
 */
export const unknownCommandTapError = (name: string, listing?: string): TapError => {
  return factoryRaised('UNKNOWN_COMMAND', listing ? `Unknown command "${name}"\n\n${listing}` : `Unknown command "${name}"`)
}

export const unknownOptionTapError = (flag: string, listing?: string): TapError => {
  return factoryRaised('UNKNOWN_OPTION', listing ? `Unknown option "${flag}"\n\n${listing}` : `Unknown option "${flag}"`)
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
