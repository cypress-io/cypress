import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resolveLiveInstance, resolveInstance } from '../../../lib/cypress-instances'
import { withTapSession } from '../../../lib/tap/tap-session'
import { buildTapSchema } from '@packages/cypress-instances'
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

  // A schema command's flags are named by the schema, which a discovery failure
  // never fetched, so the code is all such an invocation has to report.
  it('reports a discovery failure by its code', async () => {
    vi.mocked(resolveInstance).mockRejectedValue(tapError('NO_INSTANCE', 'No running Cypress was found.'))

    expect(await tap.start(['reporter', '--test-id', 'r2'], {})).toBe(1)
    expect(reportedEvent()).toMatchObject({ command: 'reporter', exitCode: 1, errorCode: 'NO_INSTANCE' })
    expect(reportedEvent().flags).toEqual([])
  })

  // A CLI-native command is dispatched before it looks for an instance, so it
  // reports what was typed as well as the code it failed with.
  it('reports a discovery failure a CLI-native command handled itself', async () => {
    vi.mocked(resolveLiveInstance).mockRejectedValue(tapError('NO_INSTANCE', 'No running Cypress was found.'))

    expect(await tap.start(['run', 'cypress/e2e/a.cy.js'], {})).toBe(1)
    expect(reportedEvent()).toMatchObject({ command: 'run', exitCode: 1, errorCode: 'NO_INSTANCE', flags: ['spec'] })
    expect(JSON.stringify(reportedEvent())).not.toContain('a.cy.js')
  })

  it('reports an instance-side failure by the code the instance gave', async () => {
    mockSession(schema, { error: { code: 'INVALID_ARGUMENTS', message: '<spec> must be a string.' } })

    expect(await tap.start(['fake-command-for-testing', 'cypress/e2e/a.cy.js'], {})).toBe(1)
    expect(reportedEvent()).toMatchObject({ exitCode: 1, errorCode: 'INVALID_ARGUMENTS' })
  })

  it('reports a transport failure by its code', async () => {
    mockSession()
    vi.mocked(withTapSession).mockRejectedValue(tapError('CDP_UNREACHABLE', 'socket hang up'))

    expect(await tap.start(['health'], {})).toBe(1)
    expect(reportedEvent()).toMatchObject({ exitCode: 1, errorCode: 'CDP_UNREACHABLE' })
  })

  it('reports a mistyped flag by its code', async () => {
    mockSession(buildTapSchema('15.0.0'))

    expect(await tap.start(['reporter', '--nope'], {})).toBe(1)
    expect(reportedEvent()).toMatchObject({ command: 'reporter', exitCode: 1, errorCode: 'UNKNOWN_OPTION' })
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

      expect(await tap.start(['reporter', '--test-id', 'r2'], { json: true, instance: 4242 })).toBe(0)

      expect(reportedEvent().flags).toEqual(['json', 'instance', 'test-id'])
      expect(JSON.stringify(reportedEvent())).not.toContain('r2')
      expect(JSON.stringify(reportedEvent())).not.toContain('4242')
    })

    it('reports an option by its canonical name whichever spelling was used', async () => {
      mockSession()

      expect(await tap.start(['status', '-h'], {})).toBe(0)
      expect(reportedEvent().flags).toEqual(['help'])
    })

    // An undeclared flag is rejected before dispatch, so it reports as the
    // unknown option it is, under no flag at all — and the value it carried
    // stays home.
    it('reports no flag for one this CLI does not declare, and never its value', async () => {
      mockSession(buildTapSchema('15.0.0'))

      expect(await tap.start(['reporter', '--secret-token=abc123'], {})).toBe(1)
      expect(reportedEvent()).toMatchObject({ command: 'reporter', errorCode: 'UNKNOWN_OPTION' })
      expect(reportedEvent().flags).toEqual([])
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

  it('sends nothing when telemetry is turned off', async () => {
    vi.stubEnv('CYPRESS_DISABLE_GUEST_TELEMETRY', '1')
    mockSession()

    try {
      expect(await tap.start(['health'], {})).toBe(0)
      expect(fetchMock).not.toHaveBeenCalled()
    } finally {
      vi.unstubAllEnvs()
    }
  })
})
