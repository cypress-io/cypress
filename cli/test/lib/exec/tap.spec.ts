import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import logger from '../../../lib/logger'
import { CypressInstanceError, listLiveInstances, resolveLiveInstance, resolveInstance } from '../../../lib/cypress-instances'
import type { LiveInstanceSelection, LiveInstanceState, ReadyInstanceState, InstanceSelection } from '../../../lib/cypress-instances'
import { withTapSession } from '../../../lib/tap/tap-session'
import { queryInstanceGraphql } from '../../../lib/tap/instance-gql'
import { tapCliCommands } from '../../../lib/tap/commands'
import type { TapSession } from '../../../lib/tap/tap-session'
import { withResolvedAutFrame } from '../../../lib/tap/aut/frame'
import type { AutFrame } from '../../../lib/tap/aut/frame'
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

vi.mock('../../../lib/tap/instance-gql', () => {
  return {
    queryInstanceGraphql: vi.fn(),
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

// The AUT-frame reader drives CDP, covered in frame.spec.ts; here we assert only
// that dom/aria/inspect route to it with their parsed args, so stub it out.
vi.mock('../../../lib/tap/aut/frame', async (importActual) => {
  const actual = await importActual<typeof import('../../../lib/tap/aut/frame')>()

  return {
    ...actual,
    withResolvedAutFrame: vi.fn(),
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
      name: 'fake-command-for-testing',
      description: 'a fake command, advertised only by this test\'s schema, exercising schema-forwarded dispatch',
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

  // These tests drive the binding exec/status paths, which use only `call`;
  // the frame extractors (dom/aria/inspect, which use client/sessionId) are
  // covered separately, so the session's CDP members are stubbed away here.
  vi.mocked(withTapSession).mockImplementation(async (_runner, fn) => fn({ call } as unknown as TapSession))

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
    vi.mocked(queryInstanceGraphql).mockReset()
    vi.mocked(listLiveInstances).mockReset()
    vi.mocked(resolveLiveInstance).mockReset()
    vi.mocked(resolveInstance).mockReset()
    vi.mocked(withResolvedAutFrame).mockReset()
    vi.mocked(withResolvedAutFrame).mockResolvedValue(0)
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

      expect(await tap.start(['fake-command-for-testing', 'cypress/e2e/a.cy.js'], {})).toBe(0)

      expect(call).toHaveBeenCalledWith('exec', ['fake-command-for-testing', { spec: 'cypress/e2e/a.cy.js' }, {}])
    })

    it('forwards parsed options to exec as raw strings, without interpreting them', async () => {
      const call = mockSession(schema, { result: { status: 'started' } })

      expect(await tap.start(['fake-command-for-testing', 'cypress/e2e/a.cy.js', '--browser', 'chrome', '--headed'], {})).toBe(0)

      expect(call).toHaveBeenCalledWith('exec', ['fake-command-for-testing', { spec: 'cypress/e2e/a.cy.js' }, { browser: 'chrome', headed: 'true' }])
    })

    it('rejects an option the command does not advertise, without reaching exec', async () => {
      const call = mockSession()

      expect(await tap.start(['fake-command-for-testing', 'cypress/e2e/a.cy.js', '--nope'], {})).toBe(1)
      expect(vi.mocked(console.error).mock.calls.flat().join(' ')).toContain(`unknown option '--nope'`)
      expect(call.mock.calls).toEqual([['getSchema']])
    })

    it('prints non-string results as readable JSON', async () => {
      mockSession(schema, { result: { status: 'ok', browsers: 2 } })

      expect(await tap.start(['health'], {})).toBe(0)
      expect(JSON.parse(logger.print())).toEqual({ status: 'ok', browsers: 2 })
    })

    const reporterSchema: TapSchema = {
      ...schema,
      commands: [
        ...schema.commands,
        {
          name: 'reporter',
          description: 'render a test’s full reporter view',
          params: [],
          options: [{ name: 'test', type: 'string', required: true, description: 'test id' }],
        },
      ],
    }

    const reporterView = {
      test: { id: 'r2', title: 'loads', fullTitle: 'App > loads', state: 'passed' },
      hooks: [{ hookId: 'r2', hookName: 'test body' }],
      routes: [],
      commands: [{ id: 'log-1', name: 'visit', message: '/', state: 'passed', type: 'parent', hookId: 'r2' }],
    }

    it('prints a command’s human-readable rendering by default when it defines one', async () => {
      const call = mockSession(reporterSchema, { result: reporterView })

      expect(await tap.start(['reporter', '--test', 'r2'], {})).toBe(0)
      expect(call).toHaveBeenCalledWith('exec', ['reporter', {}, { test: 'r2' }])

      const output = logger.print()

      expect(output).toContain('App > loads')
      expect(output).toContain('TEST BODY')
      expect(output).toContain('visit')
      expect(() => JSON.parse(output)).toThrow()
    })

    it('prints the raw JSON result when --json is passed', async () => {
      mockSession(reporterSchema, { result: reporterView })

      expect(await tap.start(['reporter', '--test', 'r2'], { json: true })).toBe(0)
      expect(JSON.parse(logger.print())).toEqual(reporterView)
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

      expect(await tap.start(['fake-command-for-testing', 'cypress/e2e/a.cy.js'], {})).toBe(1)
      expect(logger.print()).toContain('INVALID_ARGUMENTS')
      expect(call).toHaveBeenCalledWith('exec', ['fake-command-for-testing', { spec: 'cypress/e2e/a.cy.js' }, {}])
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

      expect(await tap.start(['fake-command-for-testing'], {})).toBe(1)
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
      expect(logger.print()).toContain('fake-command-for-testing [options] <spec>')
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

      expect(await tap.start(['fake-command-for-testing', '--help'], {})).toBe(0)
      expect(logger.print()).toContain('Usage: cypress tap fake-command-for-testing')
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
        liveInstance({ pid: 111, projectRoot: '/projects/app', testingType: 'e2e', cdpBrowserWsUrl: 'ws://x' }),
        liveInstance({ pid: 222, projectRoot: '/projects/other', testingType: 'component', cdpBrowserWsUrl: null }),
      ])

      expect(await tap.start(['instances'], {})).toBe(0)
      expect(JSON.parse(logger.print())).toEqual([
        { pid: 111, projectRoot: '/projects/app', testingType: 'e2e', browserAttached: true },
        { pid: 222, projectRoot: '/projects/other', testingType: 'component', browserAttached: false },
      ])

      expect(withTapSession).not.toHaveBeenCalled()
    })

    it('reports the testing type as null for an instance that has not chosen one', async () => {
      vi.mocked(listLiveInstances).mockResolvedValue([liveInstance({ pid: 111, testingType: null })])

      expect(await tap.start(['instances'], {})).toBe(0)
      expect(JSON.parse(logger.print())[0].testingType).toBeNull()
    })

    it('never exposes the internal serverPort', async () => {
      vi.mocked(listLiveInstances).mockResolvedValue([liveInstance({ pid: 111, serverPort: 49200 })])

      expect(await tap.start(['instances'], {})).toBe(0)
      expect(JSON.parse(logger.print())[0]).not.toHaveProperty('serverPort')
    })

    it('prints guidance instead of an empty array when no instance is live', async () => {
      vi.mocked(listLiveInstances).mockResolvedValue([])

      expect(await tap.start(['instances'], {})).toBe(0)

      const output = logger.print()

      expect(() => JSON.parse(output)).toThrow()
      expect(output).toContain('No running Cypress instance found')
      expect(output).toContain('select a testing type')
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

  describe('the CLI-native specs command', () => {
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

    it('renders the live spec list as JSON and exits 0, without opening a session', async () => {
      mockLiveResolved(liveInstance())
      vi.mocked(queryInstanceGraphql).mockResolvedValue({
        currentProject: { specs: [
          { relative: 'cypress/e2e/a.cy.ts', gitInfo: { lastModifiedHumanReadable: '2 hours ago', lastModifiedTimestamp: '2026-07-24 09:00:00 -0500' } },
          { relative: 'cypress/e2e/b.cy.ts', gitInfo: null },
        ] },
      })

      expect(await tap.start(['specs'], {})).toBe(0)
      // git's last-modified (human-readable + raw timestamp) rides along when
      // present, omitted when the spec has none.
      expect(JSON.parse(logger.print())).toEqual([
        { relativePath: 'cypress/e2e/a.cy.ts', lastModified: '2 hours ago', lastModifiedTimestamp: '2026-07-24 09:00:00 -0500' },
        { relativePath: 'cypress/e2e/b.cy.ts' },
      ])

      // The spec list comes from the instance's data layer, not the browser.
      expect(withTapSession).not.toHaveBeenCalled()
    })

    it('lists specs even when the instance has no browser attached', async () => {
      mockLiveResolved(liveInstance({ cdpBrowserWsUrl: null }))
      vi.mocked(queryInstanceGraphql).mockResolvedValue({
        currentProject: { specs: [{ relative: 'cypress/e2e/a.cy.ts' }] },
      })

      expect(await tap.start(['specs'], {})).toBe(0)
      expect(JSON.parse(logger.print())).toEqual([{ relativePath: 'cypress/e2e/a.cy.ts' }])
    })

    it('normalizes OS-native (Windows) spec paths to POSIX so they match run/status', async () => {
      mockLiveResolved(liveInstance())
      vi.mocked(queryInstanceGraphql).mockResolvedValue({
        currentProject: { specs: [{ relative: 'cypress\\e2e\\win.cy.ts', gitInfo: null }] },
      })

      expect(await tap.start(['specs'], {})).toBe(0)
      expect(JSON.parse(logger.print())).toEqual([{ relativePath: 'cypress/e2e/win.cy.ts' }])
    })

    it('queries the resolved instance with the TapSpecs operation', async () => {
      const { instance } = mockLiveResolved(liveInstance())

      vi.mocked(queryInstanceGraphql).mockResolvedValue({ currentProject: { specs: [] } })

      await tap.start(['specs'], {})

      expect(queryInstanceGraphql).toHaveBeenCalledWith(instance, expect.objectContaining({ operationName: 'TapSpecs' }))
    })

    it('forwards --instance plus the cwd to discovery', async () => {
      mockLiveResolved(liveInstance())
      vi.mocked(queryInstanceGraphql).mockResolvedValue({ currentProject: { specs: [] } })

      await tap.start(['specs'], { instance: 1234 })

      expect(resolveLiveInstance).toHaveBeenCalledWith({ instance: 1234, cwd: process.cwd() })
    })

    it('renders an empty list when the instance has no project open', async () => {
      mockLiveResolved(liveInstance())
      vi.mocked(queryInstanceGraphql).mockResolvedValue({ currentProject: null })

      expect(await tap.start(['specs'], {})).toBe(0)
      expect(JSON.parse(logger.print())).toEqual([])
    })

    it('drops malformed spec entries rather than rendering junk', async () => {
      mockLiveResolved(liveInstance())
      vi.mocked(queryInstanceGraphql).mockResolvedValue({
        currentProject: { specs: [
          null,
          { relative: 42 },
          {},
          { relative: 'cypress/e2e/no-git.cy.ts', gitInfo: { lastModifiedHumanReadable: 42, lastModifiedTimestamp: 42 } },
          { relative: 'cypress/e2e/ok.cy.ts', gitInfo: { lastModifiedHumanReadable: 'yesterday', lastModifiedTimestamp: '2026-07-23 10:00:00 -0500' } },
        ] },
      })

      expect(await tap.start(['specs'], {})).toBe(0)
      // Non-string git fields are dropped, not rendered as junk.
      expect(JSON.parse(logger.print())).toEqual([
        { relativePath: 'cypress/e2e/no-git.cy.ts' },
        { relativePath: 'cypress/e2e/ok.cy.ts', lastModified: 'yesterday', lastModifiedTimestamp: '2026-07-23 10:00:00 -0500' },
      ])
    })

    it('renders the discovery failure and exits 1 when no instance is live', async () => {
      vi.mocked(resolveLiveInstance).mockRejectedValue(new CypressInstanceError('NO_INSTANCE', 'No running Cypress was found.'))

      expect(await tap.start(['specs'], {})).toBe(1)
      expect(logger.print()).toBe('NO_INSTANCE: No running Cypress was found.')
      expect(queryInstanceGraphql).not.toHaveBeenCalled()
    })

    it('renders a known data-layer failure and exits 1', async () => {
      mockLiveResolved(liveInstance())
      vi.mocked(queryInstanceGraphql).mockRejectedValue(tapError(errors.tapGraphqlUnreachable, 'Could not reach the instance to run TapSpecs: socket hang up'))

      expect(await tap.start(['specs'], {})).toBe(1)
      expect(logger.print()).toContain(errors.tapGraphqlUnreachable.description)
      expect(logger.print()).toContain(errors.tapGraphqlUnreachable.solution)
    })

    it('prints specs usage for `specs --help` and exits 0, without resolving', async () => {
      expect(await tap.start(['specs', '--help'], {})).toBe(0)
      expect(logger.print()).toContain('Usage: cypress tap specs')
      expect(resolveLiveInstance).not.toHaveBeenCalled()
      expect(queryInstanceGraphql).not.toHaveBeenCalled()
    })

    it('exits 1 on an excess positional and never resolves an instance', async () => {
      expect(await tap.start(['specs', 'extra'], {})).toBe(1)
      expect(resolveLiveInstance).not.toHaveBeenCalled()
      expect(queryInstanceGraphql).not.toHaveBeenCalled()
    })

    it('rethrows unexpected errors for the generic CLI error path', async () => {
      const unexpected = new Error('boom')

      mockLiveResolved(liveInstance())
      vi.mocked(queryInstanceGraphql).mockRejectedValue(unexpected)

      await expect(tap.start(['specs'], {})).rejects.toBe(unexpected)
    })
  })

  describe('the CLI-native run command', () => {
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

    // The absolute path deliberately disagrees with projectRoot + relative, proving
    // the CLI sends the instance's own absolute path rather than resolving one.
    const loginSpec = { relative: 'cypress/e2e/login.cy.ts', absolute: '/disk/real-project/cypress/e2e/login.cy.ts' }

    const launched = { __typename: 'RunSpecResponse', testingType: 'e2e', browser: { displayName: 'Chrome' }, spec: { relative: 'cypress/e2e/login.cy.ts' } }

    const mockInstanceGraphql = ({ specs = [loginSpec], runSpec = launched }: { specs?: unknown[], runSpec?: unknown } = {}) => {
      vi.mocked(queryInstanceGraphql).mockImplementation(async (_instance, operation) => {
        return operation.operationName === 'TapSpecs' ? { currentProject: { specs } } : { runSpec }
      })
    }

    it('triggers the run and renders the launch outcome as JSON, without opening a session', async () => {
      mockLiveResolved(liveInstance())
      mockInstanceGraphql()

      expect(await tap.start(['run', 'cypress/e2e/login.cy.ts'], {})).toBe(0)
      expect(JSON.parse(logger.print())).toEqual({ spec: 'cypress/e2e/login.cy.ts', testingType: 'e2e', browser: 'Chrome' })

      // The run is driven from the instance's data layer, not over a CDP session.
      expect(withTapSession).not.toHaveBeenCalled()
    })

    it('sends the matched spec\'s instance-reported absolute path to the TapRunSpec operation', async () => {
      const { instance } = mockLiveResolved(liveInstance())

      mockInstanceGraphql()

      await tap.start(['run', 'cypress/e2e/login.cy.ts'], {})

      // The mutation gets a launch-sized timeout: it can wait on a browser
      // launch and a testing-type switch, unlike ordinary data queries.
      expect(queryInstanceGraphql).toHaveBeenCalledWith(instance, expect.objectContaining({
        operationName: 'TapRunSpec',
        variables: { specPath: '/disk/real-project/cypress/e2e/login.cy.ts' },
      }), 60_000)
    })

    it('matches an OS-native (Windows) relative path from the instance against the POSIX input', async () => {
      const { instance } = mockLiveResolved(liveInstance())

      mockInstanceGraphql({ specs: [{ relative: 'cypress\\e2e\\login.cy.ts', absolute: 'C:\\projects\\app\\cypress\\e2e\\login.cy.ts' }] })

      expect(await tap.start(['run', 'cypress/e2e/login.cy.ts'], {})).toBe(0)
      expect(queryInstanceGraphql).toHaveBeenCalledWith(instance, expect.objectContaining({
        operationName: 'TapRunSpec',
        variables: { specPath: 'C:\\projects\\app\\cypress\\e2e\\login.cy.ts' },
      }), 60_000)
    })

    it('fails with SPEC_NOT_FOUND when the spec is not in the instance\'s list, without triggering a run', async () => {
      mockLiveResolved(liveInstance())
      mockInstanceGraphql({ specs: [{ relative: 'cypress/e2e/other.cy.ts', absolute: '/disk/real-project/cypress/e2e/other.cy.ts' }] })

      expect(await tap.start(['run', 'cypress/e2e/login.cy.ts'], {})).toBe(1)
      expect(logger.print()).toBe('SPEC_NOT_FOUND: No spec matches the path "cypress/e2e/login.cy.ts" — use the specs command to list runnable specs.')
      expect(queryInstanceGraphql).not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ operationName: 'TapRunSpec' }))
    })

    it('surfaces a RunSpecError with the instance\'s own code and message, exiting 1', async () => {
      mockLiveResolved(liveInstance())
      mockInstanceGraphql({
        runSpec: { __typename: 'RunSpecError', code: 'NO_SPEC_PATTERN_MATCH', detailMessage: 'Unable to determine testing type, spec does not match any configured specPattern' },
      })

      expect(await tap.start(['run', 'cypress/e2e/login.cy.ts'], {})).toBe(1)
      expect(logger.print()).toBe('NO_SPEC_PATTERN_MATCH: Unable to determine testing type, spec does not match any configured specPattern')
    })

    it('exits 1 when the instance returns no run result', async () => {
      mockLiveResolved(liveInstance())
      mockInstanceGraphql({ runSpec: null })

      expect(await tap.start(['run', 'cypress/e2e/login.cy.ts'], {})).toBe(1)
      expect(logger.print()).toContain('RUN_FAILED')
    })

    it('forwards --instance plus the cwd to discovery', async () => {
      mockLiveResolved(liveInstance())
      mockInstanceGraphql()

      await tap.start(['run', 'cypress/e2e/login.cy.ts'], { instance: 1234 })

      expect(resolveLiveInstance).toHaveBeenCalledWith({ instance: 1234, cwd: process.cwd() })
    })

    it('renders the discovery failure and exits 1 when no instance is live', async () => {
      vi.mocked(resolveLiveInstance).mockRejectedValue(new CypressInstanceError('NO_INSTANCE', 'No running Cypress was found.'))

      expect(await tap.start(['run', 'cypress/e2e/login.cy.ts'], {})).toBe(1)
      expect(logger.print()).toBe('NO_INSTANCE: No running Cypress was found.')
      expect(queryInstanceGraphql).not.toHaveBeenCalled()
    })
  })

  describe('the CLI-native frame commands (dom/aria/inspect)', () => {
    it('routes dom to the AUT-frame reader with the top-level options and returns its exit code', async () => {
      vi.mocked(withResolvedAutFrame).mockResolvedValue(0)

      expect(await tap.start(['dom', '.foo'], { instance: 7 })).toBe(0)

      expect(withResolvedAutFrame).toHaveBeenCalledTimes(1)
      expect(vi.mocked(withResolvedAutFrame).mock.calls[0][0]).toEqual({ instance: 7 })
      // A native command never consults the running instance's schema.
      expect(resolveInstance).not.toHaveBeenCalled()
    })

    it('forwards the parsed selector and --max-chars to the DOM reader', async () => {
      let forwarded: unknown

      vi.mocked(withResolvedAutFrame).mockImplementation(async (_options, read) => {
        const callFunctionOn = vi.fn().mockResolvedValue({ result: { value: { html: '<html/>' } } })
        const session = {
          call: vi.fn(),
          sessionId: 'S1',
          client: {
            Page: { createIsolatedWorld: vi.fn().mockResolvedValue({ executionContextId: 1 }) },
            Runtime: { callFunctionOn },
          },
        } as unknown as TapSession

        await read(session, { frameId: 'f', url: 'u' } as AutFrame)
        forwarded = callFunctionOn.mock.calls[0][0].arguments

        return 0
      })

      await tap.start(['dom', '.btn', '--max-chars', '50'], {})

      // selector and the coerced --max-chars reach the extractor as call arguments.
      expect(forwarded).toEqual([{ value: '.btn' }, { value: 50 }])
    })

    it('rejects `inspect` with no selector, without reading the frame', async () => {
      expect(await tap.start(['inspect'], {})).toBe(1)
      expect(vi.mocked(console.error).mock.calls.flat().join(' ')).toContain(`missing required argument 'selector'`)
      expect(withResolvedAutFrame).not.toHaveBeenCalled()
    })

    it('rejects excess positionals for dom, without reading the frame', async () => {
      expect(await tap.start(['dom', '.a', '.b'], {})).toBe(1)
      expect(withResolvedAutFrame).not.toHaveBeenCalled()
    })

    it('rejects an option the command does not advertise, without reading the frame', async () => {
      expect(await tap.start(['aria', '--nope'], {})).toBe(1)
      expect(withResolvedAutFrame).not.toHaveBeenCalled()
    })

    it('prints per-command usage for `<command> --help` and exits 0, without reading the frame', async () => {
      for (const [name, heading] of [['dom', 'Usage: cypress tap dom'], ['aria', 'Usage: cypress tap aria'], ['inspect', 'Usage: cypress tap inspect']]) {
        logger.reset()

        expect(await tap.start([name, '--help'], {})).toBe(0)
        expect(logger.print()).toContain(heading)
      }

      expect(withResolvedAutFrame).not.toHaveBeenCalled()
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

    it('falls back to the baked-in CLI command help when no instance is found and help was wanted', async () => {
      failResolve(new CypressInstanceError('NO_INSTANCE', 'No running Cypress was found.'))

      expect(await tap.start(['--help'], {})).toBe(0)
      expect(logger.print()).toMatchInlineSnapshot(`
        "Usage: cypress tap [command] [args...] [options]

        Interacts with a running Cypress instance

        Options:
          --instance <pid>                target a specific running Cypress instance by
                                          its server process id (pid)
          --json                          print the raw JSON result instead of the
                                          human-readable rendering
          -h, --help                      display help for command

        Commands:
          instances [options]             list the running Cypress instances this CLI
                                          can reach
          status [options]                report where a running Cypress instance is
                                          in its lifecycle
          specs [options]                 list the specs the running Cypress instance
                                          can run
          run [options] <spec>            run (or rerun) a spec by its
                                          project-relative path
          dom [options] [selector]        read the app-under-test DOM as HTML: the
                                          whole page, or each element matching a
                                          selector (with its subtree)
          aria [options] [selector]       read the accessibility (ARIA) tree of the
                                          app-under-test frame, or the subtree at a
                                          selector
          inspect [options] <selector>    inspect the first element matching a
                                          selector: its tag, attributes, computed
                                          styles, box model, and accessibility node
          tests [options] [test]          list the tests of the active run and their
                                          state, or detail one by id
          commands [options]              list the command log entries of a test of
                                          the active run
          reporter [options]              render a test’s full reporter view: its
                                          routes, hooks, and command log
          pin [options] [test] [command]  pin a command’s DOM snapshot into the live
                                          app-under-test frame so the dom/aria/inspect
                                          commands can read it; pass --clear to release
        "
      `)
    })

    it('lists both native and schema commands when an unknown command is requested offline', async () => {
      failResolve(new CypressInstanceError('NO_INSTANCE', 'No running Cypress was found.'))

      expect(await tap.start(['instancs', '--help'], {})).toBe(1)

      const help = logger.print()

      expect(help).toContain('UNKNOWN_COMMAND')
      expect(help).toContain('"instancs" is not a command')
      expect(help).toContain('instances')
      expect(help).toContain('specs')
    })

    it('renders the baked-in per-command help when no instance is found', async () => {
      failResolve(new CypressInstanceError('NO_INSTANCE', 'No running Cypress was found.'))

      expect(await tap.start(['tests', '--help'], {})).toBe(0)
      expect(logger.print()).toMatchInlineSnapshot(`
        "Usage: cypress tap tests [options] [test]

        list the tests of the active run and their state, or detail one by id

        Arguments:
          test                 test id, as listed by the tests command

        Options:
          --attempt <attempt>  1-based attempt (attempt 1 = first run); defaults to the
                               latest
          --instance <pid>     target a specific running Cypress instance by its server
                               process id (pid)
          --json               print the raw JSON result instead of the human-readable
                               rendering
          -h, --help           display help for command
        "
      `)
    })

    it('falls back to generic help (exit 1) for a bare invocation with no instance found', async () => {
      failResolve(new CypressInstanceError('NO_INSTANCE', 'No running Cypress was found.'))

      expect(await tap.start([], {})).toBe(1)
      expect(logger.print()).toContain('Usage: cypress tap')
    })

    it('falls back to generic help for --help when an instance is up but has no browser', async () => {
      failResolve(new CypressInstanceError('NO_BROWSER_ATTACHED', 'Cypress is running (pid 4242, /projects/app), but no test browser is open. Open a browser in Cypress and try again.'))

      expect(await tap.start(['--help'], {})).toBe(0)
      expect(logger.print()).toContain('Usage: cypress tap')
      expect(logger.print()).not.toContain('NO_BROWSER_ATTACHED')
    })

    it('falls back to generic help for `<command> --help` when an instance is up but has no browser', async () => {
      failResolve(new CypressInstanceError('NO_BROWSER_ATTACHED', 'Cypress is running (pid 4242, /projects/app), but no test browser is open. Open a browser in Cypress and try again.'))

      expect(await tap.start(['run', '--help'], {})).toBe(0)
      expect(logger.print()).toContain('Usage: cypress tap')
      expect(logger.print()).not.toContain('NO_BROWSER_ATTACHED')
    })

    it('falls back to generic help for --help when the matched instance is stale', async () => {
      failResolve(new CypressInstanceError('STALE_INSTANCE', 'Cypress was previously running, but is no longer responding.'))

      expect(await tap.start(['--help'], {})).toBe(0)
      expect(logger.print()).toContain('Usage: cypress tap')
      expect(logger.print()).not.toContain('STALE_INSTANCE')
    })

    it('falls back to generic help (exit 1) for a bare invocation when an instance is up but has no browser', async () => {
      failResolve(new CypressInstanceError('NO_BROWSER_ATTACHED', 'Cypress is running (pid 4242, /projects/app), but no test browser is open. Open a browser in Cypress and try again.'))

      expect(await tap.start([], {})).toBe(1)
      expect(logger.print()).toContain('Usage: cypress tap')
      expect(logger.print()).not.toContain('NO_BROWSER_ATTACHED')
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
