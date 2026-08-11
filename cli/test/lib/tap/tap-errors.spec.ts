import { beforeEach, describe, expect, it, vi } from 'vitest'
import stripAnsi from 'strip-ansi'

import logger from '../../../lib/logger'
import { renderTapFailure } from '../../../lib/tap/output'
import { TAP_ERROR_COPY, tapErrorCopy } from '@packages/cypress-instances'

// The catalogue of every user-facing `cypress tap` failure. Adding or rewording one
// should land here as a snapshot diff.
//
// These snapshots hold the registry copy alone — the condition and the remedy. What
// a caller sees also carries the specifics from the throw site and a platform
// footer, which is machine-dependent; the rendering assertions below cover the
// assembled shape without pinning the footer.

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
        "INSTANCE_OUTDATED",
        "INVALID_ARGUMENTS",
        "INVALID_INDEX",
        "INVALID_LIMIT",
        "INVALID_OPTIONS",
        "INVALID_PAYLOAD",
        "INVALID_SELECTOR",
        "NO_AUT",
        "NO_BROWSER_ATTACHED",
        "NO_INSTANCE",
        "NO_PROJECT",
        "NO_RUN",
        "PIN_TARGET_REQUIRED",
        "PROTOCOL_MISMATCH",
        "RENDERER_UNRESPONSIVE",
        "RUN_FAILED",
        "RUN_IN_PROGRESS",
        "SNAPSHOT_NOT_FOUND",
        "SNAPSHOT_UNAVAILABLE",
        "SPEC_NOT_FOUND",
        "STALE_HANDLE",
        "STALE_INSTANCE",
        "TESTING_TYPE_NOT_CONFIGURED",
        "TEST_NOT_FOUND",
        "UNKNOWN_COMMAND",
      ]
    `)
  })

  it('reads as one voice across every entry', () => {
    const rendered = Object.entries(TAP_ERROR_COPY)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, copy]) => `${code}\n  ${copy.description}\n  ${copy.solution}`)
    .join('\n\n')

    expect(rendered).toMatchSnapshot()
  })

  // Every entry is copy a caller reads, so the house rules apply to all of them at
  // once rather than one assertion per entry.
  it('states each condition and remedy as a finished sentence', () => {
    const offenders = Object.entries(TAP_ERROR_COPY).flatMap(([code, copy]) => {
      return (['description', 'solution'] as const)
      .filter((slot) => !/^[`A-Z]/.test(copy[slot]) || !/[.?]$/.test(copy[slot]))
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

  it('lays a failure out the way every other CLI error is laid out', async () => {
    const printed = await render('NO_INSTANCE')

    expect(printed).to.contain(TAP_ERROR_COPY.NO_INSTANCE.description)
    expect(printed).to.contain('Start one with cypress open')
    expect(printed).to.contain('----------')
    expect(printed).to.contain('Cypress Version:')
  })

  it('prints the throw site\'s specifics under the registered copy', async () => {
    expect(await render('NO_INSTANCE', 'Looked for pid 999.')).to.contain('Looked for pid 999.')
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
