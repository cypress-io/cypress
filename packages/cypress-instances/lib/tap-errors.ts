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

/**
 * Several codes stand for one thing a reader has to do about them, and saying it
 * four slightly different ways only reads as four different problems. Each keeps
 * its own code — `status` and the help fallback branch on some of them, and
 * telemetry counts them apart — so what is shared is the copy, never the identity.
 * The jsdoc on each entry is where the condition it really stands for is written.
 */
const UNREACHABLE = {
  description: `Could not reach the ${TAP_TARGET}.`,
  solution: 'Make sure Cypress is still open with a browser, then run the command again. If it was just started, it may still be loading.',
} satisfies TapErrorCopy

// No "if it keeps failing" clause here: the entries that ask for a report already
// open theirs with one, and saying it twice reads as two separate escalations.
const COMMAND_FAILED = {
  description: `The ${TAP_TARGET} failed while running the command.`,
  solution: `Check the ${TAP_TARGET} with \`cypress tap status\`, then try again.`,
} satisfies TapErrorCopy

/**
 * Nothing worth saying, for the conditions that should not arise: a failure with no
 * code of its own, and an answer this CLI cannot read. Retrying is the only remedy
 * that fits either, and the report is how they stop standing in for something a
 * reader could have acted on.
 */
const NOTHING_KNOWN = {
  description: 'An error occurred.',
  solution: 'Try running the command again.',
} satisfies TapErrorCopy

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
   * @deprecated - raise it with new InstanceNotFoundTapError(), which writes its detail
   */
  INSTANCE_NOT_FOUND: {
    description: `No ${TAP_TARGET} matched the provided instance id.`,
    solution: `Run \`cypress tap instances\` to list the ${TAP_TARGET}s you can tap into.`,
  },
  /** Raised when records matched, but none answered its liveness probe. */
  STALE_INSTANCE: { ...UNREACHABLE },
  /** Raised when the instance is live, but has no browser open to drive. */
  NO_BROWSER_ATTACHED: {
    description: `The ${TAP_TARGET} is running, but no test browser is open.`,
    solution: 'Open a Chromium-based browser in Cypress, then try again.',
  },
  /** Raised when a CDP call went unanswered until the timeout elapsed. */
  RENDERER_UNRESPONSIVE: {
    description: `The ${TAP_TARGET} is reachable, but the page running it is not responding.`,
    solution: 'It may be paused in DevTools, stuck in a loop, or starved of memory. Pass `--timeout <ms>` to wait longer.',
  },

  // Connecting to it
  /** Raised when the CDP connection could not be opened, or dropped mid-command. */
  CDP_UNREACHABLE: { ...UNREACHABLE },
  /** Raised when no open page carries the tap binding. */
  BINDING_NOT_FOUND: { ...UNREACHABLE },
  /** Raised when a binding method threw while running the command. */
  BINDING_THREW: {
    ...COMMAND_FAILED,
    recommendGhIssue: true,
  },
  /**
   * Raised when the page navigated mid-call, and the retry hit it again. An
   * expected race rather than a defect, so it asks for no report.
   */
  STALE_HANDLE: { ...COMMAND_FAILED },

  // Agreeing on a protocol with it
  /**
   * Raised when the instance replied in a shape this CLI has no handling for: an
   * unreadable schema, an exec result that is neither outcome, a call whose args
   * arrived as something other than a map. A version disagreement is not among
   * them — the handshake compares versions and answers for that itself, naming
   * both — so this is left with nothing it could tell a reader to do, and says so.
   */
  PROTOCOL_MISMATCH: {
    ...NOTHING_KNOWN,
    recommendGhIssue: true,
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
  GRAPHQL_UNREACHABLE: { ...UNREACHABLE },
  /** Raised when GraphQL answered, but with errors, no data, or not JSON. */
  GRAPHQL_FAILED: {
    ...COMMAND_FAILED,
    recommendGhIssue: true,
  },

  // The spec lifecycle
  /** Raised when a spec was read before any has run. */
  SPEC_NOT_STARTED: {
    description: 'No spec has run yet.',
    solution: 'Start a spec with the `run` command, then read it once it has finished.',
  },
  /**
   * Raised when a spec was read while it is still running.
   *
   * @deprecated - raise it with new SpecInProgressTapError(), which writes its copy
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
    solution: `\`cypress tap specs\` lists the specs the ${TAP_TARGET} can run. If the spec exists but is not listed, widen \`specPattern\` in the Cypress configuration.`,
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
    solution: 'Run the spec again with `cypress tap run <spec>`. To read the app as it was at an earlier command, pin that command with `cypress tap pin`.',
  },
  /** Raised when an injected script threw inside the AUT frame. */
  FRAME_READ_FAILED: {
    ...COMMAND_FAILED,
    recommendGhIssue: true,
  },

  // Selecting a test, command, or snapshot of a spec
  /**
   * Raised when `--test-id` named a test this spec does not have.
   *
   * @deprecated - raise it with new TestNotFoundTapError(), which writes its detail
   */
  TEST_NOT_FOUND: {
    description: 'No test in this spec matched that id.',
    solution: 'Run `cypress tap reporter` to list the tests in the spec.',
  },
  /**
   * Raised when `--attempt` named a number past the test's attempts.
   *
   * @deprecated - raise it with new AttemptNotFoundTapError(), which writes its detail
   */
  ATTEMPT_NOT_FOUND: {
    description: 'No attempt of this test matched that number.',
    solution: '`--attempt` selects an earlier attempt of a retried test; attempt 1 is the first run. Omit it for the latest.',
  },
  /**
   * Raised when `--command-id` named a reporter row this test does not have.
   *
   * @deprecated - raise it with new CommandNotFoundTapError(), which writes its detail
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
   * @deprecated - raise it with new SnapshotNotFoundTapError(), which writes its detail
   */
  SNAPSHOT_NOT_FOUND: {
    description: 'No snapshot of this command matched that name or index.',
    solution: '`--at` takes a snapshot name or a 1-based index; omit it to pin the command’s final state.',
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
   * @deprecated - raise it with new UnknownCommandTapError(), which writes its copy
   */
  UNKNOWN_COMMAND: {
    attachHelp: true,
  },
  /**
   * Raised when the invocation passed a flag the command does not declare.
   *
   * @deprecated - raise it with new UnknownOptionTapError(), which writes its copy
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
   * @deprecated - raise it with new MissingCompanionOptionTapError(), which writes its copy
   */
  MISSING_COMPANION_OPTION: {},
  /**
   * Raised when a known input was given a value of the wrong type or range.
   *
   * @deprecated - raise it with new InvalidValueTapError(), which writes its copy
   */
  INVALID_VALUE: {
    description: 'An invalid value was given.',
  },

  // Anything else
  /**
   * Raised when a failure reached the renderer with no code of its own, so nothing
   * about it is known well enough to say. Retrying is the only remedy that fits
   * every condition it stands in for, and the report is how it stops standing in
   * for one of them.
   */
  UNKNOWN_ERROR: {
    ...NOTHING_KNOWN,
    recommendGhIssue: true,
  },
} satisfies Record<string, TapErrorCopy>

/** Every failure `cypress tap` can report: the keys of the table above. */
export type TapErrorCode = keyof typeof TAP_ERROR_COPY

// An unknown code is a protocol mismatch by definition: the instance speaks of a
// failure this CLI has no copy for, which is one more thing about its answer that
// cannot be read.
const FALLBACK: TapErrorCopy = TAP_ERROR_COPY.PROTOCOL_MISMATCH

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
 * The codes whose copy is a subclass's rather than the table's. Their opening line
 * names a subject the table cannot know, so raising one bare would print a failure
 * with nothing above its specifics — hence the constructor will not take them, and
 * the classes at the foot of this module are the way in.
 */
export type DetailedTapErrorCode =
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
export type RaisableTapErrorCode = Exclude<TapErrorCode, DetailedTapErrorCode>

/**
 * The one error every tap failure is raised as, on both sides of the wire: the app
 * throws it from a command handler, the CLI throws it from discovery, transport, and
 * its own commands. `code` selects the copy; `detail` carries what the copy cannot
 * know; `message` is the diagnostic, which stays out of the rendered output.
 *
 * The classes below name a condition rather than restate one, but only as it is
 * built: a failure the other side raised arrives through `fromPayload` as this
 * class, never as the subclass that wrote it over there. So a reader branches on
 * `code`, never on which subclass an error is.
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

  /**
   * Re-raise a failure the instance already named. The code is whatever crossed the
   * wire — including one a subclass built over there, whose copy arrived with it —
   * so this takes what the constructor will not.
   */
  static fromPayload (payload: TapErrorPayload): TapError {
    return new TapError(payload.code as RaisableTapErrorCode, { detail: payload.detail })
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
// still built the same way — with the copy its class below writes.
abstract class DetailedTapError extends TapError {
  constructor (code: DetailedTapErrorCode, detail: string) {
    super(code as unknown as RaisableTapErrorCode, { detail })
  }
}

/**
 * The one way to report a value a command cannot use: what was expected of the named
 * input, then the value as it arrived. Both sides of the wire raise it through here,
 * so a bad `--at` reads the same whether the CLI caught it or the instance did.
 */
export class InvalidValueTapError extends DetailedTapError {
  constructor (name: string, expected: string, value: unknown) {
    super('INVALID_VALUE', `Expected \`${name}\` to be ${expected}.\n\nInstead the value was: ${JSON.stringify(value)}`)
  }
}

/** The lookups that answer the same way: a well-formed id that named nothing. */
type NotFoundTapErrorCode = 'INSTANCE_NOT_FOUND' | 'TEST_NOT_FOUND' | 'ATTEMPT_NOT_FOUND' | 'COMMAND_NOT_FOUND' | 'SNAPSHOT_NOT_FOUND'

/**
 * A value that was read fine but matched nothing there is. Each entry states what
 * was being looked for and where the real ones are listed; this writes the one line
 * only the throw site can — which option was given what — plus whatever narrows the
 * search, such as how many attempts the test actually has. The option is the
 * subclass's rather than the caller's, since each of these lookups is reached by
 * exactly one flag.
 */
abstract class NotFoundTapError extends DetailedTapError {
  constructor (code: NotFoundTapErrorCode, option: string, value: unknown, context?: string) {
    super(code, `Looked for \`${option}\` ${JSON.stringify(value)}.${context ? ` ${context}` : ''}`)
  }
}

export class InstanceNotFoundTapError extends NotFoundTapError {
  constructor (value: unknown) {
    super('INSTANCE_NOT_FOUND', '--instance', value)
  }
}

export class TestNotFoundTapError extends NotFoundTapError {
  constructor (value: unknown) {
    super('TEST_NOT_FOUND', '--test-id', value)
  }
}

export class CommandNotFoundTapError extends NotFoundTapError {
  constructor (value: unknown) {
    super('COMMAND_NOT_FOUND', '--command-id', value)
  }
}

export class AttemptNotFoundTapError extends NotFoundTapError {
  constructor (value: unknown, context?: string) {
    super('ATTEMPT_NOT_FOUND', '--attempt', value, context)
  }
}

export class SnapshotNotFoundTapError extends NotFoundTapError {
  constructor (value: unknown, context?: string) {
    super('SNAPSHOT_NOT_FOUND', '--at', value, context)
  }
}

/**
 * A flag that only means something alongside another one. Both are named here;
 * `remedy` is the throw site's, because what dropping either one leaves you with
 * is particular to the pair — a spec-wide view rather than one test's attempt.
 */
export class MissingCompanionOptionTapError extends DetailedTapError {
  constructor (given: string, required: string, remedy: string) {
    super('MISSING_COMPANION_OPTION', `You passed the \`${given}\` flag without also passing the \`${required}\` flag.\n\n${remedy}`)
  }
}

/**
 * A name no command answers to, and a flag no command declares: say which one was
 * given, then list the real ones. The listing is the remedy, which is why neither
 * carries a solution of its own — and it is the generated help of whatever was
 * called, which the CLI holds and appends as it renders. `listing` is for a raiser
 * with one of its own and no renderer to defer to.
 */
export class UnknownCommandTapError extends DetailedTapError {
  constructor (name: string, listing?: string) {
    super('UNKNOWN_COMMAND', listing ? `Unknown command "${name}"\n\n${listing}` : `Unknown command "${name}"`)
  }
}

export class UnknownOptionTapError extends DetailedTapError {
  constructor (flag: string, listing?: string) {
    super('UNKNOWN_OPTION', listing ? `Unknown option "${flag}"\n\n${listing}` : `Unknown option "${flag}"`)
  }
}

/**
 * A required input the invocation left out. Both sides raise these through here —
 * the CLI when its own grammar catches the omission, the instance when a call
 * reaches it without one — so an omission reads the same whichever side caught it.
 * Their entries name no remedy of their own: the called command's help lists every
 * input it takes, and the CLI appends it as it renders. The table describes both
 * codes, so these write only the specifics rather than the opening line too.
 */
export class MissingArgumentsTapError extends TapError {
  constructor (command: string, params: readonly string[]) {
    const named = params.map((param) => `<${param}>`).join(' ')
    const noun = params.length === 1 ? 'argument' : 'arguments'

    super('INVALID_ARGUMENTS', { detail: `"${command}" is missing the required ${named} ${noun}.` })
  }
}

export class MissingOptionTapError extends TapError {
  constructor (command: string, option: string) {
    super('INVALID_OPTIONS', { detail: `"${command}" is missing the required --${option} option.` })
  }
}

/** What the handshake compared, and what each side is actually running. */
export interface VersionSkew {
  /** The tap schema version the instance answered the handshake with. */
  instanceSchema: number
  /** The schema version this CLI speaks. Passed rather than read, so this module
   * stays free of the contract that declares it. */
  cliSchema: number
  instanceCypress: string
  cliCypress: string
}

/**
 * A CLI and an instance that do not speak the same tap schema. Which of the two is
 * behind is decided here rather than at the throw site, so the code and the copy
 * cannot disagree about who has to update — the schema versions settle it, and the
 * table describes both outcomes, so this writes only the specifics.
 *
 * Those specifics name the Cypress versions, not the schema versions: the schema is
 * what disagreed, but it is not what anyone can act on. The schema numbers stay on
 * the diagnostic. Construct this only for a genuine mismatch; equal versions are
 * not a failure, and would read here as the instance being behind.
 */
export class VersionSkewTapError extends TapError {
  constructor ({ instanceSchema, cliSchema, instanceCypress, cliCypress }: VersionSkew) {
    super(instanceSchema > cliSchema ? 'CLI_OUTDATED' : 'INSTANCE_OUTDATED', {
      detail: `The ${TAP_TARGET} is running Cypress v${instanceCypress}; this CLI is v${cliCypress}.`,
      message: `the ${TAP_TARGET} speaks tap schema v${instanceSchema}; this CLI speaks v${cliSchema}.`,
    })
  }
}

/**
 * The spec that is mid-run, which is what makes the condition actionable: it names
 * what to wait on. Both sides raise it through here — the CLI from its run-state
 * gate, the app from the runner — and the spec is only unnamed in the moment
 * between one being selected and its path being known.
 */
export class SpecInProgressTapError extends DetailedTapError {
  constructor (spec: string | null) {
    super('SPEC_IN_PROGRESS', spec ? `The spec ${spec} is currently running.` : 'The spec is currently running.')
  }
}

/**
 * Whatever reached the renderer without having been raised as a tap failure — a
 * TypeError from a command handler, an ENOTDIR from a read that should not have
 * failed. It has no specifics a reader was meant to see, so it carries none; the
 * throw itself rides on `cause`, and its stack on the diagnostic `message`, for the
 * debug log the report asks the reader to attach.
 */
export class UnknownTapError extends TapError {
  constructor (cause: unknown) {
    super('UNKNOWN_ERROR', { message: String((cause as Error | undefined)?.stack ?? cause), cause })
  }
}
