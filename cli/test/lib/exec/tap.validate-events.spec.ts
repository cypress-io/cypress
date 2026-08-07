import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CypressInstanceError, resolveLiveInstance, resolveInstance } from '../../../lib/cypress-instances'
import { withTapSession } from '../../../lib/tap/tap-session'
import { buildTapSchema } from '@packages/cypress-instances'
import { errors } from '../../../lib/errors'
import tap from '../../../lib/exec/tap'
import { fetchMock, mockSession, reportedEvent, resetTapMocks, schema, tapError } from './tap-fixtures'

// vi.mock is hoisted above these imports, so the factories cannot come from
// ./tap-fixtures — everything they don't cover does.
vi.mock('../../../lib/tap/tap-session', async (importActual) => {
  return { ...await importActual<typeof import('../../../lib/tap/tap-session')>(), withTapSession: vi.fn() }
})

vi.mock('../../../lib/tap/instance-gql', () => {
  return { queryInstanceGraphql: vi.fn() }
})

vi.mock('../../../lib/cypress-instances', async (importActual) => {
  return {
    ...await importActual<typeof import('../../../lib/cypress-instances')>(),
    listLiveInstances: vi.fn(),
    resolveLiveInstance: vi.fn(),
    resolveInstance: vi.fn(),
  }
})

vi.mock('../../../lib/tap/aut/frame', async (importActual) => {
  return { ...await importActual<typeof import('../../../lib/tap/aut/frame')>(), withResolvedAutFrame: vi.fn() }
})

// These specs assert what an invocation reports, which a source checkout's
// version would otherwise stop it from sending at all.
vi.mock('../../../lib/util', async (importActual) => {
  const actual = await importActual<typeof import('../../../lib/util')>()

  return {
    ...actual,
    default: { ...actual.default, pkgVersion: vi.fn().mockReturnValue('15.0.0') },
  }
})

describe('lib/exec/tap reporting the invocation', () => {
  beforeEach(resetTapMocks)

  // `health` is advertised by this test's schema but is not a command this CLI
  // ships, standing in for a newer instance.
  it('reports a dispatched command that succeeded', async () => {
    mockSession()

    expect(await tap.start(['health'], {})).toBe(0)

    expect(reportedEvent()).toMatchObject({
      command: 'health',
      exitCode: 0,
      durationMs: expect.any(Number),
    })

    expect(reportedEvent()).not.toHaveProperty('errorCode')
  })

  it('reports a discovery failure by its code', async () => {
    vi.mocked(resolveInstance).mockRejectedValue(new CypressInstanceError('NO_INSTANCE', 'No running Cypress was found.'))

    expect(await tap.start(['reporter', '--testId', 'r2'], {})).toBe(1)
    expect(reportedEvent()).toMatchObject({ command: 'reporter', exitCode: 1, errorCode: 'NO_INSTANCE' })
  })

  it('reports a discovery failure a CLI-native command handled itself', async () => {
    vi.mocked(resolveLiveInstance).mockRejectedValue(new CypressInstanceError('NO_INSTANCE', 'No running Cypress was found.'))

    expect(await tap.start(['specs'], {})).toBe(1)
    expect(reportedEvent()).toMatchObject({ command: 'specs', exitCode: 1, errorCode: 'NO_INSTANCE' })
  })

  it('reports an instance-side failure by the code the instance gave', async () => {
    mockSession(schema, { error: { code: 'INVALID_ARGUMENTS', message: '<spec> must be a string.' } })

    expect(await tap.start(['fake-command-for-testing', 'cypress/e2e/a.cy.js'], {})).toBe(1)
    expect(reportedEvent()).toMatchObject({ exitCode: 1, errorCode: 'INVALID_ARGUMENTS' })
  })

  // A known transport failure has no code of its own to report, only the
  // description and solution the user was shown.
  it('reports a known transport failure without a code', async () => {
    mockSession()
    vi.mocked(withTapSession).mockRejectedValue(tapError(errors.tapCdpUnreachable, 'socket hang up'))

    expect(await tap.start(['health'], {})).toBe(1)
    expect(reportedEvent()).toMatchObject({ exitCode: 1 })
    expect(reportedEvent()).not.toHaveProperty('errorCode')
  })

  it('reports a mistyped flag as invalid usage', async () => {
    mockSession(buildTapSchema('15.0.0'))

    expect(await tap.start(['reporter', '--nope'], {})).toBe(1)
    expect(reportedEvent()).toMatchObject({ command: 'reporter', exitCode: 1, errorCode: 'INVALID_USAGE' })
  })

  it('reports a command this CLI does not know as unknown', async () => {
    mockSession()

    expect(await tap.start(['../../etc/passwd'], {})).toBe(1)
    expect(reportedEvent()).toMatchObject({ command: 'unknown', exitCode: 1 })
  })

  it('reports a bare invocation under no command', async () => {
    mockSession()

    expect(await tap.start(['--help'], {})).toBe(0)
    expect(reportedEvent()).toMatchObject({ command: 'none', exitCode: 0, flags: ['help'] })

    expect(await tap.start(['status', '--help'], {})).toBe(0)
    expect(reportedEvent()).toMatchObject({ command: 'status', exitCode: 0, flags: ['help'] })
  })

  describe('flags', () => {
    // The names say which options agents reach for; the values are selectors,
    // spec paths and test titles, so they never leave the machine.
    // The outer `cypress tap` command parses --instance/--json/--timeout off
    // before start() sees the operands, so they arrive as options instead.
    it('reports the flag names an invocation used, never their values', async () => {
      mockSession(buildTapSchema('15.0.0'))

      expect(await tap.start(['reporter', '--testId', 'r2'], { json: true, instance: 4242 })).toBe(0)

      expect(reportedEvent().flags).toEqual(['testId', 'json', 'instance'])
      expect(JSON.stringify(reportedEvent())).not.toContain('r2')
      expect(JSON.stringify(reportedEvent())).not.toContain('4242')
    })

    it('reports an option by its canonical name whichever spelling was used', async () => {
      mockSession()

      expect(await tap.start(['status', '-h'], {})).toBe(0)
      expect(reportedEvent().flags).toEqual(['help'])
    })

    it('reports a flag this CLI does not declare as unknown', async () => {
      mockSession()

      expect(await tap.start(['fake-command-for-testing', 'cypress/e2e/a.cy.js', '--secret-token=abc123'], {})).toBe(1)
      expect(reportedEvent().flags).toEqual(['unknown'])
      expect(JSON.stringify(reportedEvent())).not.toContain('abc123')
    })

    it('reports no flags for an invocation that passed none', async () => {
      mockSession()

      expect(await tap.start(['health'], {})).toBe(0)
      expect(reportedEvent().flags).toEqual([])
    })
  })

  it('reports an unexpected error before rethrowing it', async () => {
    vi.mocked(resolveInstance).mockRejectedValue(new Error('boom'))

    await expect(tap.start(['health'], {})).rejects.toThrow('boom')
    expect(reportedEvent()).toMatchObject({ exitCode: 1, errorCode: 'UNHANDLED' })
  })

  it('leaves the exit code alone when the collector cannot be reached', async () => {
    mockSession()
    fetchMock.mockRejectedValue(new Error('socket hang up'))

    expect(await tap.start(['health'], {})).toBe(0)
  })

  it('sends nothing when crash reports are turned off', async () => {
    const original = process.env.CYPRESS_CRASH_REPORTS

    process.env.CYPRESS_CRASH_REPORTS = '0'
    mockSession()

    try {
      expect(await tap.start(['health'], {})).toBe(0)
      expect(fetchMock).not.toHaveBeenCalled()
    } finally {
      process.env.CYPRESS_CRASH_REPORTS = original
    }
  })
})
