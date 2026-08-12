import { beforeEach, describe, expect, it, vi } from 'vitest'
import stripAnsi from 'strip-ansi'

import logger from '../../../lib/logger'
import { renderTapFailure } from '../../../lib/tap/output'
import { TAP_ERROR_COPY, invalidValueTapError, notFoundTapError, specInProgressTapError, tapErrorCopy, unknownCommandTapError, unknownOptionTapError } from '@packages/cypress-instances'

// The catalogue of every user-facing `cypress tap` failure. Adding or rewording one
// should land here as a snapshot diff.
//
// These snapshots hold the registry copy alone — the condition and the remedy. What
// a caller sees also carries the specifics from the throw site; the rendering
// assertions below cover the assembled shape.

describe('lib/tap error registry', () => {
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
        "INVALID_PAYLOAD",
        "INVALID_VALUE",
        "MISSING_COMPANION_OPTION",
        "NO_AUT",
        "NO_BROWSER_ATTACHED",
        "NO_INSTANCE",
        "NO_PROJECT",
        "PIN_TARGET_REQUIRED",
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
        "UNKNOWN_OPTION",
      ]
    `)
  })

  it('reads as one voice across every entry', () => {
    const rendered = Object.entries(TAP_ERROR_COPY)
    .filter(([, copy]) => copy.description || copy.solution)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, copy]) => [code, copy.description, copy.solution].filter(Boolean).join('\n  '))
    .join('\n\n')

    expect(rendered).toMatchSnapshot()
  })

  // These conditions open by naming their subject, so there is no generic sentence
  // to hold here and their factory writes that line. Every other entry states its
  // condition, whether or not a factory raises it.
  it('holds no condition only for the codes whose opening line names its subject', () => {
    const copyless = Object.entries(TAP_ERROR_COPY)
    .filter(([, copy]) => !copy.description)
    .map(([code]) => code)

    expect(copyless.sort()).to.deep.eq(['MISSING_COMPANION_OPTION', 'SPEC_IN_PROGRESS', 'UNKNOWN_COMMAND', 'UNKNOWN_OPTION'])
  })

  // Every entry is copy a caller reads, so the house rules apply to all of them at
  // once rather than one assertion per entry. A solution is optional — an entry
  // whose specifics carry the remedy, as INVALID_VALUE's do, ships without one.
  it('states each condition and remedy as a finished sentence', () => {
    const offenders = Object.entries(TAP_ERROR_COPY).flatMap(([code, copy]) => {
      return (['description', 'solution'] as const)
      .filter((slot) => copy[slot] !== undefined)
      .filter((slot) => !/^[`A-Z]/.test(copy[slot]!) || !/[.?]$/.test(copy[slot]!))
      .map((slot) => `${code}.${slot}`)
    })

    expect(offenders).to.deep.eq([])
  })

  it('leaves the specifics to the throw site, never interpolating them', () => {
    const interpolated = Object.entries(TAP_ERROR_COPY)
    .filter(([, copy]) => `${copy.description}${copy.solution}`.includes('${'))
    .map(([code]) => code)

    expect(interpolated).to.deep.eq([])
  })

  it('links only through on.cypress.io, as a path the CLI resolves', () => {
    const offenders = Object.entries(TAP_ERROR_COPY)
    .filter(([, copy]) => `${copy.description}${copy.solution}${copy.docs ?? ''}`.includes('docs.cypress.io'))
    .map(([code]) => code)

    expect(offenders).to.deep.eq([])
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
    const printed = await render('INVALID_VALUE', invalidValueTapError('--max-chars', 'a positive integer', 'bogus').detail)

    expect(printed).to.eq('An invalid value was given.\n\nExpected --max-chars to be a positive integer.\n\nInstead the value was: "bogus"')
  })

  // Both open by naming what was given, and close with the listing that answers it —
  // whatever named the real ones where the failure was noticed.
  it('reports an unknown command as the name given, then the listing', async () => {
    const printed = await render('UNKNOWN_COMMAND', unknownCommandTapError('oel2k', 'Commands:\n  instances\n  status').detail)

    expect(printed).to.eq('Unknown command "oel2k"\n\nCommands:\n  instances\n  status')
  })

  it('reports an unknown option as the flag given, then the listing', async () => {
    const printed = await render('UNKNOWN_OPTION', unknownOptionTapError('--bogus', 'Usage: cypress tap dom [options]').detail)

    expect(printed).to.eq('Unknown option "--bogus"\n\nUsage: cypress tap dom [options]')
  })

  // The lookups answer the same way, whether they searched a spec or the machine:
  // what was not found, the option and value that named nothing, then where the real
  // ones are listed.
  it('reports a lookup that matched nothing in one shape, whichever id it was', async () => {
    expect(await render('TEST_NOT_FOUND', notFoundTapError('TEST_NOT_FOUND', '--test-id', 'r7').detail)).to.eq([
      'No test in this spec matched that id.',
      'Looked for --test-id "r7".',
      'Run cypress tap reporter to list the tests in the spec.',
    ].join('\n\n'))

    vi.mocked(console.error).mockClear()

    expect(await render('COMMAND_NOT_FOUND', notFoundTapError('COMMAND_NOT_FOUND', '--command-id', '9').detail)).to.eq([
      'No command in this test matched that id.',
      'Looked for --command-id "9".',
      'Run cypress tap reporter --test-id <id> to list the commands in the test.',
    ].join('\n\n'))

    vi.mocked(console.error).mockClear()

    // A pid is a number, so it reads without quotes where an id reads with them.
    expect(await render('INSTANCE_NOT_FOUND', notFoundTapError('INSTANCE_NOT_FOUND', '--instance', 4321).detail)).to.eq([
      'No running Cypress matched that process id.',
      'Looked for --instance 4321.',
      'Run cypress tap instances to list the sessions you can tap into.',
    ].join('\n\n'))
  })

  // What narrows the search rides along with the value: how many attempts there
  // are is what makes a rejected number actionable.
  it('carries the context a lookup has, when it has any', async () => {
    const detail = notFoundTapError('ATTEMPT_NOT_FOUND', '--attempt', 5, 'Test "r2" has 3 attempts.').detail

    expect(await render('ATTEMPT_NOT_FOUND', detail)).to.contain('Looked for --attempt 5. Test "r2" has 3 attempts.')
  })

  // The spec is what a poller waits on, so the condition names it and the remedy
  // says how to tell when it has finished.
  it('reports a run in progress as the spec running, then how to watch it', async () => {
    const printed = await render('SPEC_IN_PROGRESS', specInProgressTapError('cypress/e2e/slow.cy.js').detail)

    expect(printed).to.eq('The spec cypress/e2e/slow.cy.js is currently running.\n\nUse cypress tap status to verify when the spec has finished.')
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

  it('keeps unwinding an error that is not ours to render', async () => {
    await expect(renderTapFailure(new Error('not a tap failure'))).rejects.toThrow('not a tap failure')
  })
})
