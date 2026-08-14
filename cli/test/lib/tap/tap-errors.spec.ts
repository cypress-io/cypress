import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import stripAnsi from 'strip-ansi'
import chalk from 'chalk'
import Debug from 'debug'

import logger from '../../../lib/logger'
import { renderTapFailure, helpFor } from '../../../lib/tap/output'
import { buildTapProgram } from '../../../lib/tap/build-program'
import { buildTapSchema, TAP_ERROR_COPY, TapError, type TapErrorCode, type TapErrorCopy, AttemptNotFoundTapError, CommandNotFoundTapError, InstanceNotFoundTapError, InvalidValueTapError, MissingArgumentsTapError, MissingCompanionOptionTapError, MissingOptionTapError, SnapshotNotFoundTapError, SpecInProgressTapError, tapErrorCopy, TestNotFoundTapError, UnknownCommandTapError, UnknownOptionTapError, UnknownTapError, VersionSkewTapError } from '@packages/cypress-instances'

// The catalogue of every user-facing `cypress tap` failure. Adding or rewording one
// should land here as a snapshot diff: the rendering catalogue at the foot of this
// file snapshots each code as a caller sees it, headed by an invocation that
// produces it.

describe('lib/tap error registry', () => {
  const entries: [string, TapErrorCopy][] = Object.entries(TAP_ERROR_COPY)

  it('covers exactly these codes (add a case below for any new entry)', () => {
    expect(Object.keys(TAP_ERROR_COPY).sort()).toMatchInlineSnapshot(`
      [
        "AMBIGUOUS_COMMAND",
        "ATTEMPT_NOT_FOUND",
        "BINDING_NOT_FOUND",
        "BINDING_THREW",
        "CDP_UNREACHABLE",
        "CLI_OUTDATED",
        "COMMAND_NOT_FOUND",
        "FRAME_READ_FAILED",
        "GRAPHQL_FAILED",
        "GRAPHQL_UNREACHABLE",
        "INSTANCE_NOT_FOUND",
        "INSTANCE_OUTDATED",
        "INVALID_ARGUMENTS",
        "INVALID_OPTIONS",
        "INVALID_VALUE",
        "MISSING_COMPANION_OPTION",
        "NO_AUT",
        "NO_BROWSER_ATTACHED",
        "NO_INSTANCE",
        "NO_PROJECT",
        "PROTOCOL_MISMATCH",
        "RENDERER_UNRESPONSIVE",
        "SNAPSHOT_NOT_FOUND",
        "SNAPSHOT_UNAVAILABLE",
        "SPEC_IN_PROGRESS",
        "SPEC_NOT_FOUND",
        "SPEC_NOT_STARTED",
        "SPEC_START_FAILED",
        "STALE_HANDLE",
        "STALE_INSTANCE",
        "TESTING_TYPE_NOT_CONFIGURED",
        "TEST_NOT_FOUND",
        "UNKNOWN_COMMAND",
        "UNKNOWN_ERROR",
        "UNKNOWN_OPTION",
      ]
    `)
  })

  // These conditions open by naming their subject, so there is no generic sentence
  // to hold here and their factory writes that line. Every other entry states its
  // condition, whether or not a factory raises it.
  it('holds no condition only for the codes whose opening line names its subject', () => {
    const copyless = entries
    .filter(([, copy]) => !copy.description)
    .map(([code]) => code)

    expect(copyless.sort()).to.deep.eq(['MISSING_COMPANION_OPTION', 'SPEC_IN_PROGRESS', 'UNKNOWN_COMMAND', 'UNKNOWN_OPTION'])
  })

  // Every entry is copy a caller reads, so the house rules apply to all of them at
  // once rather than one assertion per entry. A solution is optional — an entry
  // whose specifics carry the remedy, as INVALID_VALUE's do, ships without one.
  it('states each condition and remedy as a finished sentence', () => {
    const offenders = entries.flatMap(([code, copy]) => {
      return (['description', 'solution'] as const)
      .filter((slot) => copy[slot] !== undefined)
      .filter((slot) => !/^[`A-Z]/.test(copy[slot]!) || !/[.?]$/.test(copy[slot]!))
      .map((slot) => `${code}.${slot}`)
    })

    expect(offenders).to.deep.eq([])
  })

  // The help is the remedy only where what failed was the invocation itself, so
  // the entries asking for it are exactly the ones about how the command was called.
  it('takes the generated help in place of a remedy only where the invocation failed', () => {
    const attaching = entries
    .filter(([, copy]) => copy.attachHelp)
    .map(([code]) => code)

    expect(attaching.sort()).to.deep.eq(['INVALID_ARGUMENTS', 'INVALID_OPTIONS', 'UNKNOWN_COMMAND', 'UNKNOWN_OPTION'])
  })

  it('leaves the specifics to the throw site, never interpolating them', () => {
    const interpolated = entries
    .filter(([, copy]) => `${copy.description}${copy.solution}`.includes('${'))
    .map(([code]) => code)

    expect(interpolated).to.deep.eq([])
  })

  it('links only through on.cypress.io, as a path the CLI resolves', () => {
    const offenders = entries
    .filter(([, copy]) => `${copy.description}${copy.solution}${copy.docs ?? ''}`.includes('docs.cypress.io'))
    .map(([code]) => code)

    expect(offenders).to.deep.eq([])
  })

  // Codes that mean one thing to a reader say it in one wording, so a caller who
  // meets two of them is not told they met two different problems. Pinning the
  // groups here is what keeps a later edit to one member from quietly splitting a
  // group, or from folding a code into one whose remedy is not really its own.
  it('shares one message across the codes that read the same to a caller', () => {
    const byMessage = new Map<string, string[]>()

    for (const [code, copy] of entries.filter(([, copy]) => copy.description)) {
      const key = `${copy.description}\n${copy.solution}`

      byMessage.set(key, [...(byMessage.get(key) ?? []), code])
    }

    const shared = [...byMessage.values()]
    .filter((codes) => codes.length > 1)
    .map((codes) => codes.sort())

    expect(shared.sort()).to.deep.eq([
      ['BINDING_NOT_FOUND', 'CDP_UNREACHABLE', 'GRAPHQL_UNREACHABLE', 'STALE_INSTANCE'],
      ['BINDING_THREW', 'FRAME_READ_FAILED', 'GRAPHQL_FAILED', 'STALE_HANDLE'],
      ['PROTOCOL_MISMATCH', 'UNKNOWN_ERROR'],
    ])
  })
})

describe('lib/tap error registry lookup', () => {
  it('resolves a code it ships', () => {
    expect(tapErrorCopy('NO_INSTANCE')).to.eq(TAP_ERROR_COPY.NO_INSTANCE)
  })

  // The code arrives from the instance over the wire, so anything that is not a code
  // this CLI ships has to land somewhere rather than resolving to nothing — or, for
  // an inherited name, to a member of Object.prototype.
  it('falls back to the protocol-mismatch copy, plus a report, for a code only a newer Cypress knows', () => {
    const copy = tapErrorCopy('SOMETHING_THIS_CLI_HAS_NEVER_HEARD_OF')

    expect(copy.description).to.eq(TAP_ERROR_COPY.PROTOCOL_MISMATCH.description)
    expect(copy.recommendGhIssue).to.be.true
  })

  it('falls back for an inherited name rather than a prototype member', () => {
    for (const name of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) {
      expect(tapErrorCopy(name), name).to.eq(tapErrorCopy('NOT_A_CODE'))
    }
  })

  it('falls back for a code that is not a string at all', () => {
    for (const value of [undefined, null, 42, {}, [], true]) {
      expect(tapErrorCopy(value), String(value)).to.eq(tapErrorCopy('NOT_A_CODE'))
    }
  })
})

// One raiser for both directions of a version disagreement, so the code it picks
// and the remedy that code carries always name the same side.
describe('lib/tap version skew', () => {
  it('names the CLI as behind when the instance speaks a newer schema', () => {
    const err = new VersionSkewTapError({ instanceSchema: 2, cliSchema: 1, instanceCypress: '16.2.0', cliCypress: '15.20.1' })

    expect(err.code).to.eq('CLI_OUTDATED')
    expect(err.detail).to.eq('The Cypress session is running Cypress v16.2.0; this CLI is v15.20.1.')
  })

  it('names the instance as behind when it speaks an older schema', () => {
    const err = new VersionSkewTapError({ instanceSchema: 1, cliSchema: 2, instanceCypress: '15.20.1', cliCypress: '16.2.0' })

    expect(err.code).to.eq('INSTANCE_OUTDATED')
    expect(err.detail).to.eq('The Cypress session is running Cypress v15.20.1; this CLI is v16.2.0.')
  })

  // Whoever has to update acts on a Cypress version, so the schema versions that
  // decided it belong to the debug log rather than the output.
  it('keeps the schema versions on the diagnostic, out of what a caller reads', () => {
    const err = new VersionSkewTapError({ instanceSchema: 7, cliSchema: 3, instanceCypress: '16.2.0', cliCypress: '15.20.1' })

    expect(err.detail).not.to.contain('schema')
    expect(err.message).to.contain('v7')
    expect(err.message).to.contain('v3')
  })
})

describe('lib/tap error rendering', () => {
  const stderr = (): string => stripAnsi(vi.mocked(console.error).mock.calls.flat().join(' '))

  beforeEach(() => {
    logger.reset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  const render = async (code: string, detail?: string): Promise<string> => {
    await renderTapFailure({ code, detail })

    return stderr()
  }

  // The code is a registry key, not output: it selects the copy and never reaches
  // the reader.
  it('never prints the error code', async () => {
    for (const code of Object.keys(TAP_ERROR_COPY)) {
      vi.mocked(console.error).mockClear()

      expect(await render(code), code).not.to.contain(code)
    }
  })

  // The condition, then the specifics that explain it, then what to do about it —
  // as paragraphs, with nothing between them to separate.
  it('lays a failure out as condition, specifics, remedy', async () => {
    const printed = await render('INSTANCE_NOT_FOUND', 'Looked for `--instance` 999.')

    expect(printed).to.eq([
      TAP_ERROR_COPY.INSTANCE_NOT_FOUND.description,
      'Looked for --instance 999.',
      TAP_ERROR_COPY.INSTANCE_NOT_FOUND.solution!.replace(/`/g, ''),
    ].join('\n\n'))
  })

  // A tap failure is about the state of a running instance, not about which Cypress
  // is installed or the machine it runs on.
  it('carries no rule and no platform footer', async () => {
    const printed = await render('NO_INSTANCE')

    expect(printed).not.to.contain('----------')
    expect(printed).not.to.contain('Cypress Version:')
    expect(printed).not.to.contain('Platform:')
  })

  // The one shape every unusable value is reported in, whichever option or argument
  // carried it and whichever side of the wire rejected it.
  it('reports a bad value as what was expected and what arrived', async () => {
    const printed = await render('INVALID_VALUE', new InvalidValueTapError('--max-chars', 'a positive integer', 'bogus').detail)

    expect(printed).to.eq('An invalid value was given.\n\nExpected --max-chars to be a positive integer.\n\nInstead the value was: "bogus"')
  })

  // Both open by naming what was given, and close with the listing that answers it —
  // whatever named the real ones where the failure was noticed.
  it('reports an unknown command as the name given, then the listing', async () => {
    const printed = await render('UNKNOWN_COMMAND', new UnknownCommandTapError('oel2k', 'Commands:\n  instances\n  status').detail)

    expect(printed).to.eq('Unknown command "oel2k"\n\nCommands:\n  instances\n  status')
  })

  it('reports an unknown option as the flag given, then the listing', async () => {
    const printed = await render('UNKNOWN_OPTION', new UnknownOptionTapError('--bogus', 'Usage: cypress tap dom [options]').detail)

    expect(printed).to.eq('Unknown option "--bogus"\n\nUsage: cypress tap dom [options]')
  })

  // The lookups answer the same way, whether they searched a spec or the machine:
  // what was not found, the option and value that named nothing, then where the real
  // ones are listed.
  it('reports a lookup that matched nothing in one shape, whichever id it was', async () => {
    expect(await render('TEST_NOT_FOUND', new TestNotFoundTapError('r7').detail)).to.eq([
      'No test in this spec matched that id.',
      'Looked for --test-id "r7".',
      'Run cypress tap reporter to list the tests in the spec.',
    ].join('\n\n'))

    vi.mocked(console.error).mockClear()

    expect(await render('COMMAND_NOT_FOUND', new CommandNotFoundTapError('9').detail)).to.eq([
      'No command in this test matched that id.',
      'Looked for --command-id "9".',
      'Run cypress tap reporter --test-id <id> to list the commands in the test.',
    ].join('\n\n'))

    vi.mocked(console.error).mockClear()

    // A pid is a number, so it reads without quotes where an id reads with them.
    expect(await render('INSTANCE_NOT_FOUND', new InstanceNotFoundTapError(4321).detail)).to.eq([
      'No Cypress session matched the provided instance id.',
      'Looked for --instance 4321.',
      'Run cypress tap instances to list the Cypress sessions you can tap into.',
    ].join('\n\n'))
  })

  // What narrows the search rides along with the value: how many attempts there
  // are is what makes a rejected number actionable.
  it('carries the context a lookup has, when it has any', async () => {
    const detail = new AttemptNotFoundTapError(5, 'Test "r2" has 3 attempts.').detail

    expect(await render('ATTEMPT_NOT_FOUND', detail)).to.contain('Looked for --attempt 5. Test "r2" has 3 attempts.')
  })

  // The spec is what a poller waits on, so the condition names it and the remedy
  // says how to tell when it has finished.
  it('reports a run in progress as the spec running, then how to watch it', async () => {
    const printed = await render('SPEC_IN_PROGRESS', new SpecInProgressTapError('cypress/e2e/slow.cy.js').detail)

    expect(printed).to.eq('The spec cypress/e2e/slow.cy.js is currently running.\n\nUse cypress tap status to verify when the spec has finished.')
  })

  // The entry's own solution only points at the help, so where the caller has that
  // help the reader gets it instead of being told to go and ask for it.
  it('prints the help an entry asks for in place of its solution', async () => {
    const help = 'Usage: cypress tap reporter [options]\n\nOptions:\n  -t, --test-id <test-id>  the test to read\n'

    await renderTapFailure({ code: 'INVALID_OPTIONS', detail: '"reporter" is missing the required --test-id option.' }, help)

    const printed = stderr()

    expect(printed).to.contain('-t, --test-id <test-id>  the test to read')
    expect(printed).not.to.contain(TAP_ERROR_COPY.INVALID_OPTIONS.solution!.replace(/`/g, ''))
  })

  // Only the entries that ask for it: a failure about the state of the session is
  // not answered by listing the flags of the command that found it.
  it('leaves the help off an entry that does not ask for it', async () => {
    await renderTapFailure({ code: 'NO_INSTANCE' }, 'Usage: cypress tap dom [options]')

    expect(stderr()).not.to.contain('Usage: cypress tap dom')
  })

  it('falls back to the solution when the caller has no help to hand', async () => {
    await renderTapFailure({ code: 'INVALID_OPTIONS', detail: 'missing --test-id' })

    expect(stderr()).to.contain(TAP_ERROR_COPY.INVALID_OPTIONS.solution!.replace(/`/g, ''))
  })

  it('expands recommendGhIssue into the CLI\'s standard issue block', async () => {
    const printed = await render('BINDING_THREW')

    expect(printed).to.contain('search for an existing issue or open a GitHub issue at')
    expect(printed).to.contain('https://github.com/cypress-io/cypress/issues')
  })

  it('leaves the issue block off an entry that does not ask for it', async () => {
    expect(await render('NO_INSTANCE')).not.to.contain('github.com/cypress-io/cypress/issues')
  })

  it('expands docs into a Learn more block under the docs site', async () => {
    const printed = await render('TESTING_TYPE_NOT_CONFIGURED')

    expect(printed).to.contain('Learn more:')
    expect(printed).to.contain('https://on.cypress.io/configuration')
  })

  // Both slots carry backticked commands, so the markup has to be stripped from
  // both — a description keeping its backticks is the way this has gone wrong.
  it('strips the markup from every entry, whichever slot carries it', async () => {
    for (const code of Object.keys(TAP_ERROR_COPY)) {
      vi.mocked(console.error).mockClear()

      expect(await render(code), code).not.to.contain('`')
    }
  })

  // Whatever it was, it reached the reader through a tap command, so it is answered
  // the way every other tap failure is rather than as a bare stack.
  it('renders an error that carries no code as an unknown one', async () => {
    const code = await renderTapFailure(new Error('read of undefined property `pid`'))
    const printed = stderr()

    expect(code).to.eq(1)
    expect(printed).to.eq([
      TAP_ERROR_COPY.UNKNOWN_ERROR.description,
      TAP_ERROR_COPY.UNKNOWN_ERROR.solution,
      'If the problem persists, search for an existing issue or open a GitHub issue at\n\n  https://github.com/cypress-io/cypress/issues',
    ].join('\n\n'))
  })

  // Every Node system error carries a code, and none of them are ours: read for one,
  // an ENOTDIR from a read that should have worked would report itself to the reader
  // as whichever registry entry that errno happened to land on.
  it('renders a system error as unknown rather than reading its errno as a code', async () => {
    const printed = await renderTapFailure(Object.assign(new Error('ENOTDIR: not a directory'), { code: 'ENOTDIR' })).then(stderr)

    expect(printed).to.contain(TAP_ERROR_COPY.UNKNOWN_ERROR.description)
    expect(printed).not.to.contain('ENOTDIR')
  })

  // The same bug in the shape that would actually mislead: an Error whose `code`
  // collides with a registry key would render as that entry, describing a condition
  // nothing had established. What the code is read off, not what it says, is what
  // decides — so the contrast is against the same code arriving as a wire payload.
  it('reads a code off a payload the instance sent, and never off an Error', async () => {
    const asPayload = await renderTapFailure({ code: 'NO_INSTANCE' }).then(stderr)

    expect(asPayload).to.contain(TAP_ERROR_COPY.NO_INSTANCE.description)

    vi.mocked(console.error).mockClear()

    const asThrow = await renderTapFailure(Object.assign(new Error('read of undefined'), { code: 'NO_INSTANCE' })).then(stderr)

    expect(asThrow).to.contain(TAP_ERROR_COPY.UNKNOWN_ERROR.description)
    expect(asThrow).not.to.contain(TAP_ERROR_COPY.NO_INSTANCE.description)
  })

  // A code only a newer Cypress raises has no copy here, so it falls back — and the
  // code itself stays out of the output, as every other code does.
  it('falls back for a wire code it has no entry for, without printing it', async () => {
    const printed = await renderTapFailure({ code: 'SOMETHING_ONLY_A_NEWER_CYPRESS_RAISES' }).then(stderr)

    expect(printed).to.contain(TAP_ERROR_COPY.PROTOCOL_MISMATCH.description)
    expect(printed).not.to.contain('SOMETHING_ONLY_A_NEWER_CYPRESS_RAISES')
  })

  // The diagnostic is for whoever is asked for a debug log, not for the reader: the
  // report is what they are asked for, and it says nothing they can act on.
  it('keeps an unknown error\'s own message out of the output', async () => {
    await renderTapFailure(new Error('read of undefined property `pid`'))

    expect(stderr()).not.to.contain('undefined property')
  })

  // Withholding the stack from the reader only works if it is somewhere to be had:
  // the report the copy asks for is worth answering, and the debug log is the answer.
  it('writes an unknown error\'s stack to the debug log', async () => {
    const written = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)

    Debug.enable('cypress:cli:tap')

    try {
      await renderTapFailure(new Error('read of undefined property `pid`'))
    } finally {
      Debug.disable()
    }

    const logged = stripAnsi(written.mock.calls.flat().join(' '))

    expect(logged).to.contain('read of undefined property')
    expect(logged).to.contain('tap-errors.spec.ts')
  })

  // An uncoded error has no detail of ours; whatever it carries under that name is
  // not copy, so it renders as the bare condition.
  it('prints no specifics under an unknown error', async () => {
    await renderTapFailure({ detail: 'ECONNREFUSED 127.0.0.1:1234' })

    expect(stderr()).not.to.contain('ECONNREFUSED')
  })
})

// Every code, rendered end to end as a caller sees it: an invocation that produces
// the failure in practice, then the registry copy assembled with the specifics a
// real throw site writes. One snapshot per code, named by the code, so the file
// reads as a transcript of what each failure looks like at the terminal — and a
// change to any failure's assembled output lands as a reviewable diff under it.
describe('lib/tap error rendering catalogue', () => {
  // Vitest runs without a TTY, so chalk would otherwise emit no colour at all and
  // the catalogue would read as plain text no caller ever sees.
  const colourless = chalk.level

  beforeEach(() => {
    chalk.level = 1
    logger.reset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    chalk.level = colourless
  })

  const COLOUR_NAMES: Record<string, string> = {
    30: 'black',
    31: 'red',
    32: 'green',
    33: 'yellow',
    34: 'blue',
    35: 'magenta',
    36: 'cyan',
    37: 'white',
  }

  // eslint-disable-next-line no-control-regex
  const SGR = /\u001b\[(\d+)m/g

  /**
   * The escapes chalk emits, spelled out as `{color:cyan}…{/color}`. This file is
   * read far more than it is run — in a terminal, in a diff, in review — and raw
   * escapes are legible in none of those. A code with no name here spells itself
   * out as its number, so a newly styled failure is still readable and still
   * obviously wants naming.
   */
  const spellOutColours = (text: string): string => {
    return text.replace(SGR, (_match, code: string) => {
      return code === '39' ? '{/color}' : `{color:${COLOUR_NAMES[code] ?? code}}`
    })
  }

  // The generated help of the program a caller really parses against, so an entry
  // that takes help in place of its remedy snapshots the help it would actually
  // print rather than a stand-in written here.
  const program = buildTapProgram(buildTapSchema('15.4.0'), () => {})

  interface RepresentativeFailure {
    /** A `cypress tap` invocation that produces this failure in practice. */
    invocation: string
    failure: TapError
    /** The command whose help the CLI has to hand when it renders this one. */
    helpOf?: string
  }

  // One realistic failure per code — factory-raised codes through their factory,
  // the rest as their throw sites raise them: with the detail the site writes, or
  // bare where it writes none, since that bare rendering is the real output. Each
  // entry names the throw site its specifics are copied from; a code raised in
  // several places names the one the representative mimics.
  // `Record<TapErrorCode, ...>` makes a new registry entry a compile error here
  // until it gets a representative.
  const REPRESENTATIVE: Record<TapErrorCode, RepresentativeFailure> = {
    // cli/lib/cypress-instances/index.ts (resolveInstance), with no Cypress open
    NO_INSTANCE: {
      invocation: 'cypress tap dom --selector "#status"',
      failure: new TapError('NO_INSTANCE'),
    },
    // cli/lib/cypress-instances/index.ts (resolveInstance)
    INSTANCE_NOT_FOUND: {
      invocation: 'cypress tap --instance 4321 dom --selector "#status"',
      failure: new InstanceNotFoundTapError(4321),
    },
    // cli/lib/cypress-instances/index.ts (liveMatches)
    STALE_INSTANCE: {
      invocation: 'cypress tap --instance 4321 dom --selector "#status"',
      failure: new TapError('STALE_INSTANCE'),
    },
    // cli/lib/cypress-instances/index.ts (resolveInstance)
    NO_BROWSER_ATTACHED: {
      invocation: 'cypress tap dom --selector "#status"',
      failure: new TapError('NO_BROWSER_ATTACHED'),
    },
    // cli/lib/tap/cdp-timeout.ts
    RENDERER_UNRESPONSIVE: {
      invocation: 'cypress tap dom --selector "#status"',
      failure: new TapError('RENDERER_UNRESPONSIVE', { detail: 'No response within the specified timeout (30000ms).' }),
    },
    // cli/lib/tap/tap-session.ts
    CDP_UNREACHABLE: {
      invocation: 'cypress tap status',
      failure: new TapError('CDP_UNREACHABLE'),
    },
    // cli/lib/tap/tap-session.ts
    BINDING_NOT_FOUND: {
      invocation: 'cypress tap status',
      failure: new TapError('BINDING_NOT_FOUND'),
    },
    // cli/lib/tap/tap-session.ts
    BINDING_THREW: {
      invocation: 'cypress tap reporter',
      failure: new TapError('BINDING_THREW'),
    },
    // cli/lib/tap/tap-session.ts
    STALE_HANDLE: {
      invocation: 'cypress tap dom --selector "#status"',
      failure: new TapError('STALE_HANDLE'),
    },
    // cli/lib/tap/tap-session.ts (validateExecResult); also the schema handshake in cli/lib/exec/tap.ts
    PROTOCOL_MISMATCH: {
      invocation: 'cypress tap status',
      failure: new TapError('PROTOCOL_MISMATCH'),
    },
    // cli/lib/exec/tap.ts (schema handshake)
    // Both directions come from one raiser, which picks the code from the schema
    // versions — so these two entries differ only in which side is ahead.
    CLI_OUTDATED: {
      invocation: 'cypress tap status',
      failure: new VersionSkewTapError({ instanceSchema: 2, cliSchema: 1, instanceCypress: '16.2.0', cliCypress: '15.20.1' }),
    },
    // cli/lib/exec/tap.ts (schema handshake); also cli/lib/tap/instance-gql.ts, which
    // has no schema to hand and so names no versions
    INSTANCE_OUTDATED: {
      invocation: 'cypress tap status',
      failure: new VersionSkewTapError({ instanceSchema: 1, cliSchema: 2, instanceCypress: '15.20.1', cliCypress: '16.2.0' }),
    },
    // cli/lib/tap/instance-gql.ts
    GRAPHQL_UNREACHABLE: {
      invocation: 'cypress tap specs',
      failure: new TapError('GRAPHQL_UNREACHABLE'),
    },
    // cli/lib/tap/instance-gql.ts
    GRAPHQL_FAILED: {
      invocation: 'cypress tap specs',
      failure: new TapError('GRAPHQL_FAILED'),
    },
    // cli/lib/tap/aut/frame.ts; also the app-side commands in packages/app/src/tap/commands/
    SPEC_NOT_STARTED: {
      invocation: 'cypress tap dom --selector "#status"',
      failure: new TapError('SPEC_NOT_STARTED'),
    },
    // cli/lib/tap/aut/frame.ts; also packages/app/src/tap/commands/pin.ts
    SPEC_IN_PROGRESS: {
      invocation: 'cypress tap dom --selector "#status"',
      failure: new SpecInProgressTapError('cypress/e2e/checkout.cy.ts'),
    },
    // cli/lib/tap/commands/run.ts
    SPEC_START_FAILED: {
      invocation: 'cypress tap run cypress/e2e/checkout.cy.ts',
      failure: new TapError('SPEC_START_FAILED', { detail: 'The Cypress session returned no result for "cypress/e2e/checkout.cy.ts".' }),
    },
    // cli/lib/tap/commands/run.ts
    SPEC_NOT_FOUND: {
      invocation: 'cypress tap run cypress/e2e/checkout.cy.ts',
      failure: new TapError('SPEC_NOT_FOUND', { detail: 'Looked for "cypress/e2e/checkout.cy.ts".' }),
    },
    // cli/lib/tap/commands/run.ts (mapped from the runSpec mutation's failure)
    NO_PROJECT: {
      invocation: 'cypress tap run cypress/e2e/checkout.cy.ts',
      failure: new TapError('NO_PROJECT'),
    },
    // cli/lib/tap/commands/run.ts (mapped from the runSpec mutation's failure)
    TESTING_TYPE_NOT_CONFIGURED: {
      invocation: 'cypress tap run cypress/e2e/checkout.cy.ts',
      failure: new TapError('TESTING_TYPE_NOT_CONFIGURED'),
    },
    // cli/lib/tap/aut/frame.ts; also packages/app/src/tap/commands/resolve-selector.ts
    NO_AUT: {
      invocation: 'cypress tap dom --selector "#status"',
      failure: new TapError('NO_AUT'),
    },
    // cli/lib/tap/aut/single-match.ts; also the dom/inspect extractors
    FRAME_READ_FAILED: {
      invocation: 'cypress tap dom --selector ".item"',
      failure: new TapError('FRAME_READ_FAILED'),
    },
    // packages/app/src/tap/test-state.ts
    TEST_NOT_FOUND: {
      invocation: 'cypress tap reporter --test-id r7',
      failure: new TestNotFoundTapError('r7'),
    },
    // packages/app/src/tap/test-state.ts
    ATTEMPT_NOT_FOUND: {
      invocation: 'cypress tap reporter --test-id r7 --attempt 5',
      failure: new AttemptNotFoundTapError(5, 'Test "r7" has 3 attempts.'),
    },
    // packages/app/src/tap/commands/command.ts; also pin.ts
    COMMAND_NOT_FOUND: {
      invocation: 'cypress tap command --test-id r7 --command-id 9',
      failure: new CommandNotFoundTapError('9'),
    },
    // packages/app/src/tap/test-state.ts
    AMBIGUOUS_COMMAND: {
      invocation: 'cypress tap command --test-id r7 --command-id 1',
      failure: new TapError('AMBIGUOUS_COMMAND', { detail: '"1" matches:\n\n  h2:1 (before each)\n  h3:1 (before each)\n  h5:1 (after each)' }),
    },
    // packages/app/src/tap/commands/pin.ts
    SNAPSHOT_NOT_FOUND: {
      invocation: 'cypress tap pin --test-id r7 --command-id 3 --at middle',
      failure: new SnapshotNotFoundTapError('middle', 'This command has these snapshots: 1 before, 2 after.'),
    },
    // packages/app/src/tap/commands/pin.ts
    SNAPSHOT_UNAVAILABLE: {
      invocation: 'cypress tap pin --test-id r7 --command-id 3',
      failure: new TapError('SNAPSHOT_UNAVAILABLE'),
    },
    // packages/app/src/tap/tap-manager.ts; also cli/lib/tap/build-program.ts
    UNKNOWN_COMMAND: {
      invocation: 'cypress tap oel2k',
      failure: new UnknownCommandTapError('oel2k'),
      helpOf: 'oel2k',
    },
    // cli/lib/tap/build-program.ts; also packages/app/src/tap/exec-args.ts
    UNKNOWN_OPTION: {
      invocation: 'cypress tap dom --bogus',
      failure: new UnknownOptionTapError('--bogus'),
      helpOf: 'dom',
    },
    // cli/lib/tap/build-program.ts; also packages/app/src/tap/exec-args.ts
    INVALID_ARGUMENTS: {
      invocation: 'cypress tap run',
      failure: new MissingArgumentsTapError('run', ['spec']),
      helpOf: 'run',
    },
    // cli/lib/tap/build-program.ts; also packages/app/src/tap/exec-args.ts
    INVALID_OPTIONS: {
      invocation: 'cypress tap reporter',
      failure: new MissingOptionTapError('reporter', 'test-id'),
      helpOf: 'reporter',
    },
    // packages/app/src/tap/commands/reporter.ts
    MISSING_COMPANION_OPTION: {
      invocation: 'cypress tap reporter --attempt 2',
      failure: new MissingCompanionOptionTapError('--attempt', '--test-id', 'Pass `--test-id` to specify the test, or omit `--attempt` to review the latest attempt for every test in the spec.'),
    },
    // cli/lib/tap/output.ts, standing in for anything that reached the renderer
    // without being raised as a tap failure
    UNKNOWN_ERROR: {
      invocation: 'cypress tap status',
      failure: new UnknownTapError(new TypeError('cannot read property \'pid\' of undefined')),
    },
    // cli/lib/tap/aut/single-match.ts; also packages/app/src/tap/exec-args.ts
    INVALID_VALUE: {
      invocation: 'cypress tap dom --selector ".item" --at 5',
      failure: new InvalidValueTapError('--at', '0 to 2, since ".item" matched 3 elements', '5'),
    },
  }

  // The Record type already forces this at compile time; asserting it too makes a
  // drift fail as a test rather than only as a type error.
  it('holds one representative failure for every code', () => {
    expect(Object.keys(REPRESENTATIVE).sort()).to.deep.eq(Object.keys(TAP_ERROR_COPY).sort())
  })

  for (const code of Object.keys(TAP_ERROR_COPY) as TapErrorCode[]) {
    it(code, async () => {
      const { invocation, failure, helpOf } = REPRESENTATIVE[code]

      await renderTapFailure(failure, helpOf === undefined ? undefined : helpFor(program, helpOf))

      // What the failure itself styled, taken before `errorToStderr` paints the
      // whole thing red: the blanket colour says nothing a reader of this file
      // needs, whereas the commands and links each entry highlights do.
      const printed = spellOutColours(logger.print())

      expect(`> ${invocation}\n${printed}`).toMatchSnapshot()
    })
  }
})
