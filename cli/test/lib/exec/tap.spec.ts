import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import logger from '../../../lib/logger'
import { CypressInstanceError, listLiveInstances, resolveLiveInstance, resolveInstance } from '../../../lib/cypress-instances'
import type { LiveInstanceSelection, LiveInstanceState, ReadyInstanceState, InstanceSelection } from '../../../lib/cypress-instances'
import { withTapSession } from '../../../lib/tap/tap-session'
import { tapCliCommands } from '../../../lib/tap/commands'
import type { TapExecResult, TapSchema } from '@packages/cypress-instances'
import { errors } from '../../../lib/errors'
import tap from '../../../lib/exec/tap'

const tapError = (details: { description: string, solution: string }, message: string): Error => {
  return Object.assign(new Error(message), { details, known: true })
}

vi.mock('../../../lib/tap/tap-session', async (importActual) => {
  const actual = await importActual<typeof import('../../../lib/tap/tap-session')>()

  return {
    ...actual,
    withTapSession: vi.fn(),
  }
})

vi.mock('../../../lib/cypress-instances', async (importActual) => {
  const actual = await importActual<typeof import('../../../lib/cypress-instances')>()

  return {
    ...actual,
    listLiveInstances: vi.fn(),
    resolveLiveInstance: vi.fn(),
    resolveInstance: vi.fn(),
  }
})

const schema: TapSchema = {
  schemaVersion: 1,
  cypressVersion: '15.0.0',
  commands: [
    {
      name: 'health',
      description: 'check that a running Cypress instance is reachable and its tap binding responds',
      params: [],
      options: [],
    },
    {
      name: 'run',
      description: 'run (or rerun) a spec by its project-relative path',
      params: [
        { name: 'spec', type: 'string', required: true, description: 'project-relative spec path, as listed by the spec command' },
      ],
      options: [
        { name: 'browser', alias: 'b', type: 'string', required: false, description: 'which browser to run in' },
        { name: 'headed', type: 'boolean', required: false, description: 'show the browser' },
      ],
    },
  ],
}

const mockSession = (sessionSchema: unknown = schema, execOutcome: unknown = { result: 'ok' } satisfies TapExecResult) => {
  const call = vi.fn(async (method: string) => {
    return method === 'getSchema' ? sessionSchema : execOutcome
  })

  vi.mocked(withTapSession).mockImplementation(async (_runner, fn) => fn({ call }))

  return call
}

const readyInstance = (overrides: Partial<ReadyInstanceState> = {}): ReadyInstanceState => ({
  schemaVersion: 1,
  pid: 4242,
  projectRoot: '/projects/app',
  serverPort: 49200,
  instanceId: 'inst-1',
  testingType: 'e2e',
  cdpBrowserWsUrl: 'ws://127.0.0.1:9222/devtools/browser/abc',
  ...overrides,
})

const mockResolved = (overrides: Partial<InstanceSelection> = {}): InstanceSelection => {
  const selection: InstanceSelection = { instance: readyInstance(), reason: 'only', candidateCount: 1, ...overrides }

  vi.mocked(resolveInstance).mockResolvedValue(selection)

  return selection
}

describe('lib/exec/tap', () => {
  beforeEach(() => {
    vi.mocked(withTapSession).mockReset()
    vi.mocked(listLiveInstances).mockReset()
    vi.mocked(resolveLiveInstance).mockReset()
    vi.mocked(resolveInstance).mockReset()
    mockResolved()
    logger.reset()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('dispatching a command', () => {
    it('fetches the schema, hands the command to exec, prints the unwrapped result, and exits 0', async () => {
      const call = mockSession()

      expect(await tap.start(['health'], {})).toBe(0)
      expect(logger.print()).toBe('ok')

      expect(call.mock.calls).toEqual([
        ['getSchema'],
        ['exec', ['health', {}, {}]],
      ])
    })

    it('forwards positional args to exec as raw strings keyed by param name, without interpreting them', async () => {
      const call = mockSession(schema, { result: { status: 'started' } })

      expect(await tap.start(['run', 'cypress/e2e/a.cy.js'], {})).toBe(0)

      expect(call).toHaveBeenCalledWith('exec', ['run', { spec: 'cypress/e2e/a.cy.js' }, {}])
    })

    it('forwards parsed options to exec as raw strings, without interpreting them', async () => {
      const call = mockSession(schema, { result: { status: 'started' } })

      expect(await tap.start(['run', 'cypress/e2e/a.cy.js', '--browser', 'chrome', '--headed'], {})).toBe(0)

      expect(call).toHaveBeenCalledWith('exec', ['run', { spec: 'cypress/e2e/a.cy.js' }, { browser: 'chrome', headed: 'true' }])
    })

    it('rejects an option the command does not advertise, without reaching exec', async () => {
      const call = mockSession()

      expect(await tap.start(['run', 'cypress/e2e/a.cy.js', '--nope'], {})).toBe(1)
      expect(vi.mocked(console.error).mock.calls.flat().join(' ')).toContain(`unknown option '--nope'`)
      expect(call.mock.calls).toEqual([['getSchema']])
    })

    it('prints non-string results as readable JSON', async () => {
      mockSession(schema, { result: { status: 'ok', browsers: 2 } })

      expect(await tap.start(['health'], {})).toBe(0)
      expect(JSON.parse(logger.print())).toEqual({ status: 'ok', browsers: 2 })
    })

    it('resolves the target from --instance and the cwd, then opens a session against it', async () => {
      mockSession()
      const { instance } = mockResolved()

      await tap.start(['health'], { instance: 1234 })

      expect(resolveInstance).toHaveBeenCalledWith({ instance: 1234, cwd: process.cwd() })
      expect(vi.mocked(withTapSession).mock.calls[0][0]).toBe(instance)
    })

    it('resolves with just the cwd tiebreak when --instance is absent', async () => {
      mockSession()

      await tap.start(['health'], {})

      expect(resolveInstance).toHaveBeenCalledWith({ instance: undefined, cwd: process.cwd() })
    })

    it('renders an app-side domain failure ({ error }) with its code and exits 1', async () => {
      const call = mockSession(schema, {
        error: {
          code: 'INVALID_ARGUMENTS',
          message: '<spec> must be a string, but number was given.',
        },
      })

      expect(await tap.start(['run', 'cypress/e2e/a.cy.js'], {})).toBe(1)
      expect(logger.print()).toContain('INVALID_ARGUMENTS')
      expect(call).toHaveBeenCalledWith('exec', ['run', { spec: 'cypress/e2e/a.cy.js' }, {}])
    })

    it('treats an unrecognizable exec result as a transport failure', async () => {
      mockSession(schema, 'not an envelope')

      expect(await tap.start(['health'], {})).toBe(1)
      expect(logger.print()).toContain(errors.tapInvalidExecResult.description)
    })

    it('treats a malformed error envelope as a transport failure, without crashing on renderFailure', async () => {
      for (const malformed of [{ error: null }, { error: 'boom' }, { error: {} }, { error: { code: 'X' } }]) {
        logger.reset()
        mockSession(schema, malformed)

        expect(await tap.start(['health'], {})).toBe(1)
        expect(logger.print()).toContain(errors.tapInvalidExecResult.description)
      }
    })
  })

  describe('commander validates the command against the live schema', () => {
    it('rejects a command the instance does not advertise, without reaching exec', async () => {
      const call = mockSession()

      expect(await tap.start(['bogus'], {})).toBe(1)
      expect(vi.mocked(console.error).mock.calls.flat().join(' ')).toContain(`unknown command 'bogus'`)
      expect(call.mock.calls).toEqual([['getSchema']])
    })

    it('rejects a missing required positional, without reaching exec', async () => {
      const call = mockSession()

      expect(await tap.start(['run'], {})).toBe(1)
      expect(vi.mocked(console.error).mock.calls.flat().join(' ')).toContain(`missing required argument 'spec'`)
      expect(call.mock.calls).toEqual([['getSchema']])
    })
  })

  describe('help', () => {
    it('prints the schema-derived overview for a bare invocation and exits 1', async () => {
      mockSession()

      expect(await tap.start([], {})).toBe(1)
      expect(logger.print()).toContain('Usage: cypress tap')
      expect(logger.print()).toContain('health')
      expect(logger.print()).toContain('run [options] <spec>')
    })

    it('prints the overview and exits 0 for an explicit --help', async () => {
      mockSession()

      expect(await tap.start(['--help'], {})).toBe(0)
      expect(logger.print()).toContain('Usage: cypress tap')
    })

    it('leads the help with a banner naming the resolved instance', async () => {
      mockSession()
      mockResolved({ instance: readyInstance({ pid: 7777, projectRoot: '/projects/app' }) })

      expect(await tap.start(['--help'], {})).toBe(0)
      expect(logger.print()).toContain('Target:\n  /projects/app\n  v15.0.0\n  pid:7777')
    })

    it('lists the CLI-native instances command at the top of the overview commands', async () => {
      mockSession()

      expect(await tap.start(['--help'], {})).toBe(0)
      const help = logger.print()

      expect(help).toContain('instances')
      expect(help.indexOf('instances')).toBeLessThan(help.indexOf('health'))
    })

    it('notes which instance was auto-selected when several were live', async () => {
      mockSession()
      mockResolved({ instance: readyInstance({ pid: 7777 }), reason: 'arbitrary', candidateCount: 3 })

      expect(await tap.start(['--help'], {})).toBe(0)
      expect(logger.print()).toContain('3 running instances matched; targeting pid 7777.')
      expect(logger.print()).toContain('Pass --instance <pid> to target another.')
    })

    it('omits the multi-instance note when only one instance was live', async () => {
      mockSession()
      mockResolved({ reason: 'only', candidateCount: 1 })

      expect(await tap.start(['--help'], {})).toBe(0)
      expect(logger.print()).not.toContain('running instances matched')
    })

    it('prints a rich per-command help for `<command> --help`, without reaching exec', async () => {
      const call = mockSession()

      expect(await tap.start(['run', '--help'], {})).toBe(0)
      expect(logger.print()).toContain('Usage: cypress tap run')
      expect(logger.print()).toContain('Arguments:')
      expect(logger.print()).toContain('spec')
      expect(logger.print()).toContain('project-relative')
      expect(logger.print()).toContain('Target:\n  /projects/app\n  v15.0.0')
      expect(call.mock.calls).toEqual([['getSchema']])
    })

    it('fails when help is requested for a command the instance does not advertise', async () => {
      mockSession()

      expect(await tap.start(['bogus', '--help'], {})).toBe(1)
      expect(logger.print()).toContain('UNKNOWN_COMMAND')
      expect(logger.print()).toContain('is not a command')
    })

    it('treats a hidden command as unknown for `<command> --help` and omits it from the listing', async () => {
      mockSession({
        ...schema,
        commands: [
          ...schema.commands,
          { name: 'run-state', description: 'internal poll target', params: [], options: [], hidden: true },
        ],
      } satisfies TapSchema)

      expect(await tap.start(['run-state', '--help'], {})).toBe(1)
      expect(logger.print()).toContain('UNKNOWN_COMMAND')
      expect(logger.print()).toContain('"run-state" is not a command')
      expect(logger.print()).not.toContain('run-state,')
    })
  })

  describe('the CLI-native instances command', () => {
    const liveInstance = (overrides: Partial<LiveInstanceState> = {}): LiveInstanceState => ({
      schemaVersion: 1,
      pid: 54321,
      projectRoot: '/projects/app',
      serverPort: 49200,
      instanceId: 'inst-1',
      testingType: 'e2e',
      cdpBrowserWsUrl: 'ws://127.0.0.1:9222/devtools/browser/abc',
      ...overrides,
    })

    it('renders the live instances as a JSON summary and exits 0, without opening a session', async () => {
      vi.mocked(listLiveInstances).mockResolvedValue([
        liveInstance({ pid: 111, projectRoot: '/projects/app', serverPort: 49200, cdpBrowserWsUrl: 'ws://x' }),
        liveInstance({ pid: 222, projectRoot: '/projects/other', serverPort: 49201, cdpBrowserWsUrl: null }),
      ])

      expect(await tap.start(['instances'], {})).toBe(0)
      expect(JSON.parse(logger.print())).toEqual([
        { pid: 111, projectRoot: '/projects/app', serverPort: 49200, browserAttached: true },
        { pid: 222, projectRoot: '/projects/other', serverPort: 49201, browserAttached: false },
      ])

      expect(withTapSession).not.toHaveBeenCalled()
    })

    it('renders an empty array when no instance is live', async () => {
      vi.mocked(listLiveInstances).mockResolvedValue([])

      expect(await tap.start(['instances'], {})).toBe(0)
      expect(JSON.parse(logger.print())).toEqual([])
    })

    it('forwards --instance as the discovery filter', async () => {
      vi.mocked(listLiveInstances).mockResolvedValue([])

      await tap.start(['instances'], { instance: 1234 })

      expect(listLiveInstances).toHaveBeenCalledWith({ instance: 1234 })
    })

    it('lists every live instance when --instance is absent', async () => {
      vi.mocked(listLiveInstances).mockResolvedValue([])

      await tap.start(['instances'], {})

      expect(listLiveInstances).toHaveBeenCalledWith({ instance: undefined })
    })

    it('prints instances usage for `instances --help` and exits 0, without enumerating', async () => {
      expect(await tap.start(['instances', '--help'], {})).toBe(0)
      expect(logger.print()).toContain('Usage: cypress tap instances')
      expect(listLiveInstances).not.toHaveBeenCalled()
      expect(withTapSession).not.toHaveBeenCalled()
    })

    it('exits 1 on an excess positional and never enumerates', async () => {
      expect(await tap.start(['instances', 'extra'], {})).toBe(1)
      expect(listLiveInstances).not.toHaveBeenCalled()
      expect(withTapSession).not.toHaveBeenCalled()
    })
  })

  describe('the CLI-native status command', () => {
    const liveInstance = (overrides: Partial<LiveInstanceState> = {}): LiveInstanceState => ({
      schemaVersion: 1,
      pid: 4242,
      projectRoot: '/projects/app',
      serverPort: 49200,
      instanceId: 'inst-1',
      testingType: 'e2e',
      cdpBrowserWsUrl: 'ws://127.0.0.1:9222/devtools/browser/abc',
      ...overrides,
    })

    const mockLiveResolved = (instance: LiveInstanceState): LiveInstanceSelection => {
      const selection: LiveInstanceSelection = { instance, reason: 'only', candidateCount: 1 }

      vi.mocked(resolveLiveInstance).mockResolvedValue(selection)

      return selection
    }

    it('reports "not connected" and exits 0 when no instance is live', async () => {
      vi.mocked(resolveLiveInstance).mockRejectedValue(new CypressInstanceError('NO_INSTANCE', 'none'))

      expect(await tap.start(['status'], {})).toBe(0)
      expect(JSON.parse(logger.print())).toEqual({ status: 'not connected' })
      // Nothing live means nothing to connect to.
      expect(withTapSession).not.toHaveBeenCalled()
    })

    it('reports "not connected" for a stale discovery record too', async () => {
      vi.mocked(resolveLiveInstance).mockRejectedValue(new CypressInstanceError('STALE_INSTANCE', 'stale'))

      expect(await tap.start(['status'], {})).toBe(0)
      expect(JSON.parse(logger.print())).toEqual({ status: 'not connected' })
    })

    it('reports "browser not selected" without opening a session when no browser is attached', async () => {
      mockLiveResolved(liveInstance({ pid: 111, cdpBrowserWsUrl: null }))

      expect(await tap.start(['status'], {})).toBe(0)
      expect(JSON.parse(logger.print())).toEqual({
        status: 'browser not selected',
        pid: 111,
        projectRoot: '/projects/app',
        testingType: 'e2e',
        browserAttached: false,
      })

      // The early lifecycle is reported from discovery alone.
      expect(withTapSession).not.toHaveBeenCalled()
    })

    it('reports "spec not selected" with totalSpecs when a browser is attached and on the spec list', async () => {
      mockLiveResolved(liveInstance())
      mockSession(schema, { result: { spec: null, totalSpecs: 3 } } satisfies TapExecResult)

      expect(await tap.start(['status'], {})).toBe(0)
      expect(JSON.parse(logger.print())).toEqual({
        status: 'spec not selected',
        pid: 4242,
        projectRoot: '/projects/app',
        testingType: 'e2e',
        browserAttached: true,
        totalSpecs: 3,
      })
    })

    it('merges the run state, active spec, and results when on a spec', async () => {
      mockLiveResolved(liveInstance())
      mockSession(schema, {
        result: {
          spec: 'cypress/e2e/login.cy.ts',
          totalSpecs: 3,
          state: 'running',
          totalTests: 5,
          results: { passed: 1, failed: 1, pending: 2, skipped: 1 },
        },
      } satisfies TapExecResult)

      expect(await tap.start(['status'], {})).toBe(0)
      expect(JSON.parse(logger.print())).toEqual({
        status: 'running',
        pid: 4242,
        projectRoot: '/projects/app',
        testingType: 'e2e',
        browserAttached: true,
        totalSpecs: 3,
        spec: 'cypress/e2e/login.cy.ts',
        totalTests: 5,
        results: { passed: 1, failed: 1, pending: 2, skipped: 1 },
      })
    })

    it('asks the binding for run-state over the session', async () => {
      mockLiveResolved(liveInstance())
      const call = mockSession(schema, { result: { spec: null, totalSpecs: 0 } } satisfies TapExecResult)

      await tap.start(['status'], {})

      expect(call).toHaveBeenCalledWith('exec', ['run-state', {}, {}])
    })

    it('forwards --instance plus the cwd to discovery', async () => {
      mockLiveResolved(liveInstance({ cdpBrowserWsUrl: null }))

      await tap.start(['status'], { instance: 1234 })

      expect(resolveLiveInstance).toHaveBeenCalledWith({ instance: 1234, cwd: process.cwd() })
    })

    it('exits 1 and renders the failure when the instance is unreachable despite a browser', async () => {
      mockLiveResolved(liveInstance())
      vi.mocked(withTapSession).mockRejectedValue(tapError(errors.tapBindingNotFound, 'the instance may still be loading'))

      expect(await tap.start(['status'], {})).toBe(1)
      expect(logger.print()).toContain(errors.tapBindingNotFound.description)
    })

    it('exits 1 and surfaces the binding error when the running Cypress lacks the run-state command', async () => {
      mockLiveResolved(liveInstance())
      mockSession(schema, { error: { code: 'UNKNOWN_COMMAND', message: 'no such command' } } satisfies TapExecResult)

      expect(await tap.start(['status'], {})).toBe(1)
      expect(logger.print()).toContain('UNKNOWN_COMMAND: no such command')
      expect(logger.print()).not.toContain(errors.tapInvalidExecResult.description)
    })

    it('prints status usage for `status --help` and exits 0, without resolving', async () => {
      expect(await tap.start(['status', '--help'], {})).toBe(0)
      expect(logger.print()).toContain('Usage: cypress tap status')
      expect(resolveLiveInstance).not.toHaveBeenCalled()
      expect(withTapSession).not.toHaveBeenCalled()
    })

    it('exits 1 on an excess positional and never resolves an instance', async () => {
      expect(await tap.start(['status', 'extra'], {})).toBe(1)
      expect(resolveLiveInstance).not.toHaveBeenCalled()
      expect(withTapSession).not.toHaveBeenCalled()
    })
  })

  describe('the schema handshake', () => {
    it('rejects an unrecognizable schema', async () => {
      mockSession('not a schema')

      expect(await tap.start(['health'], {})).toBe(1)
      expect(logger.print()).toContain(errors.tapInvalidSchema.description)
    })

    it('rejects a future protocol version, telling the user to update the CLI', async () => {
      mockSession({ ...schema, schemaVersion: 2 })

      expect(await tap.start(['health'], {})).toBe(1)
      expect(logger.print()).toContain('newer than this CLI')
      expect(logger.print()).toContain('Update the CLI')
    })

    it('rejects an older protocol version, telling the user to update the running Cypress', async () => {
      mockSession({ ...schema, schemaVersion: 0 })

      expect(await tap.start(['health'], {})).toBe(1)
      expect(logger.print()).toContain('older than this CLI')
      expect(logger.print()).toContain('Update Cypress')
    })
  })

  describe('failure rendering', () => {
    const failResolve = (err: unknown) => vi.mocked(resolveInstance).mockRejectedValue(err)
    const failSession = (err: unknown) => vi.mocked(withTapSession).mockRejectedValue(err)

    it('renders discovery errors with their code and exits 1', async () => {
      failResolve(new CypressInstanceError('NO_INSTANCE', 'No running Cypress was found.'))

      expect(await tap.start(['health'], {})).toBe(1)
      expect(logger.print()).toBe('NO_INSTANCE: No running Cypress was found.')
    })

    it('renders a known transport failure as its mapped description and solution, and exits 1', async () => {
      mockSession()
      failSession(tapError(errors.tapCdpUnreachable, 'Could not open a debugging connection to the browser: socket hang up'))

      expect(await tap.start(['health'], {})).toBe(1)
      expect(logger.print()).toContain(errors.tapCdpUnreachable.description)
      expect(logger.print()).toContain(errors.tapCdpUnreachable.solution)
    })

    it('renders the binding-not-found failure as its mapped guidance', async () => {
      mockSession()
      failSession(tapError(errors.tapBindingNotFound, 'Failed to connect to the runner page.'))

      expect(await tap.start(['health'], {})).toBe(1)
      expect(logger.print()).toContain(errors.tapBindingNotFound.description)
    })

    it('falls back to generic help when no instance is found and help was wanted', async () => {
      failResolve(new CypressInstanceError('NO_INSTANCE', 'No running Cypress was found.'))

      expect(await tap.start(['--help'], {})).toBe(0)
      expect(logger.print()).toContain('Usage: cypress tap')
      expect(logger.print()).toContain('discovered from the running Cypress instance')

      for (const { name, description } of tapCliCommands) {
        expect(logger.print()).toMatch(new RegExp(`^  ${name} +${description}$`, 'm'))
      }
    })

    it('falls back to generic help (exit 1) for a bare invocation with no instance found', async () => {
      failResolve(new CypressInstanceError('NO_INSTANCE', 'No running Cypress was found.'))

      expect(await tap.start([], {})).toBe(1)
      expect(logger.print()).toContain('Usage: cypress tap')
    })

    it('surfaces a specific discovery error on a bare invocation instead of generic help', async () => {
      failResolve(new CypressInstanceError('NO_BROWSER_ATTACHED', 'Cypress is running (pid 4242, /projects/app), but no test browser is open. Open a browser in Cypress and try again.'))

      expect(await tap.start([], {})).toBe(1)
      expect(logger.print()).toContain('NO_BROWSER_ATTACHED')
      expect(logger.print()).toContain('no test browser is open')
      expect(logger.print()).not.toContain('Usage: cypress tap')
    })

    it('surfaces a specific discovery error for explicit --help instead of generic help', async () => {
      failResolve(new CypressInstanceError('STALE_INSTANCE', 'Cypress was previously running, but is no longer responding.'))

      expect(await tap.start(['--help'], {})).toBe(1)
      expect(logger.print()).toContain('STALE_INSTANCE')
      expect(logger.print()).not.toContain('Usage: cypress tap')
    })

    it('still surfaces the discovery error when an actual command was requested', async () => {
      failResolve(new CypressInstanceError('NO_INSTANCE', 'No running Cypress was found.'))

      expect(await tap.start(['health'], {})).toBe(1)
      expect(logger.print()).toContain('NO_INSTANCE')
    })

    it('rethrows unexpected errors for the generic CLI error path', async () => {
      const unexpected = new Error('boom')

      failResolve(unexpected)

      await expect(tap.start(['health'], {})).rejects.toBe(unexpected)
    })
  })
})
