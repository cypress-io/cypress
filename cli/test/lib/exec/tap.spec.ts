import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import logger from '../../../lib/logger'
import { RunnerDiscoveryError, listLiveRunners, resolveRunner } from '../../../lib/runner-instances'
import type { LiveRunnerState, ReadyRunnerState, RunnerSelection } from '../../../lib/runner-instances'
import { withTapSession } from '../../../lib/tap/tap-session'
import type { TapExecResult, TapSchema } from '../../../lib/tap/contract'
import { errors } from '../../../lib/errors'
import tap from '../../../lib/exec/tap'

// A known tap transport/handshake error, shaped exactly as throwTapError throws
// it: the mapped Cypress error in `details`, flagged `known`.
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

vi.mock('../../../lib/runner-instances', async (importActual) => {
  const actual = await importActual<typeof import('../../../lib/runner-instances')>()

  return {
    ...actual,
    listLiveRunners: vi.fn(),
    resolveRunner: vi.fn(),
  }
})

const schema: TapSchema = {
  protocolVersion: 1,
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

/**
 * Stand up a fake session: `getSchema` returns the given schema, `exec`
 * resolves the given envelope. Returns the `call` mock so tests can assert
 * the dispatch sequence and the forwarded args.
 */
const mockSession = (sessionSchema: unknown = schema, execOutcome: unknown = { ok: true, result: 'ok' } satisfies TapExecResult) => {
  const call = vi.fn(async (method: string) => {
    return method === 'getSchema' ? sessionSchema : execOutcome
  })

  vi.mocked(withTapSession).mockImplementation(async (_runner, fn) => fn({ call }))

  return call
}

const readyRunner = (overrides: Partial<ReadyRunnerState> = {}): ReadyRunnerState => ({
  schemaVersion: 1,
  pid: 4242,
  projectRoot: '/projects/app',
  serverPort: 49200,
  instanceId: 'inst-1',
  testingType: 'e2e',
  cdpBrowserWsUrl: 'ws://127.0.0.1:9222/devtools/browser/abc',
  ...overrides,
})

// Stub which runner `resolveRunner` lands on (and how it got there). The
// dispatch/help tests just need a target; the selection-specific tests override
// reason/candidateCount to exercise the banner.
const mockResolved = (overrides: Partial<RunnerSelection> = {}): RunnerSelection => {
  const selection: RunnerSelection = { runner: readyRunner(), reason: 'only', candidateCount: 1, ...overrides }

  vi.mocked(resolveRunner).mockResolvedValue(selection)

  return selection
}

describe('lib/exec/tap', () => {
  beforeEach(() => {
    vi.mocked(withTapSession).mockReset()
    vi.mocked(listLiveRunners).mockReset()
    vi.mocked(resolveRunner).mockReset()
    // A reachable instance by default; tests that exercise discovery failures
    // or the multi-instance banner override this.
    mockResolved()
    logger.reset()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    // commander writes its validation errors here before throwing (it predates
    // configureOutput); silence it and let tests assert on the spy.
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

      // The handshake always precedes the dispatch, over the same session.
      expect(call.mock.calls).toEqual([
        ['getSchema'],
        ['exec', ['health', {}, {}]],
      ])
    })

    it('forwards positional args to exec as raw strings keyed by param name, without interpreting them', async () => {
      const call = mockSession(schema, { ok: true, result: { status: 'started' } })

      expect(await tap.start(['run', 'cypress/e2e/a.cy.js'], {})).toBe(0)

      expect(call).toHaveBeenCalledWith('exec', ['run', { spec: 'cypress/e2e/a.cy.js' }, {}])
    })

    it('forwards parsed options to exec as raw strings, without interpreting them', async () => {
      const call = mockSession(schema, { ok: true, result: { status: 'started' } })

      // The unknown top-level flags fall through as operands (allowUnknownOption
      // on `cypress tap`) and are parsed by the schema-built subcommand here.
      expect(await tap.start(['run', 'cypress/e2e/a.cy.js', '--browser', 'chrome', '--headed'], {})).toBe(0)

      expect(call).toHaveBeenCalledWith('exec', ['run', { spec: 'cypress/e2e/a.cy.js' }, { browser: 'chrome', headed: 'true' }])
    })

    it('rejects an option the command does not advertise, without reaching exec', async () => {
      const call = mockSession()

      expect(await tap.start(['run', 'cypress/e2e/a.cy.js', '--nope'], {})).toBe(1)
      expect(vi.mocked(console.error).mock.calls.flat().join(' ')).toContain(`unknown option '--nope'`)
      // The handshake was the only call — exec never ran.
      expect(call.mock.calls).toEqual([['getSchema']])
    })

    it('prints non-string results as readable JSON', async () => {
      mockSession(schema, { ok: true, result: { status: 'ok', browsers: 2 } })

      expect(await tap.start(['health'], {})).toBe(0)
      expect(JSON.parse(logger.print())).toEqual({ status: 'ok', browsers: 2 })
    })

    it('resolves the target from --instance and the cwd, then opens a session against it', async () => {
      mockSession()
      const { runner } = mockResolved()

      await tap.start(['health'], { instance: 1234 })

      // The cwd is only a tiebreak the resolver falls back to among several live
      // runners; an explicit --instance pins the choice.
      expect(resolveRunner).toHaveBeenCalledWith({ instance: 1234, cwd: process.cwd() })
      // The session is opened against whatever runner the resolver chose.
      expect(vi.mocked(withTapSession).mock.calls[0][0]).toBe(runner)
    })

    it('resolves with just the cwd tiebreak when --instance is absent', async () => {
      mockSession()

      await tap.start(['health'], {})

      expect(resolveRunner).toHaveBeenCalledWith({ instance: undefined, cwd: process.cwd() })
    })

    it('renders an app-side domain failure (ok: false) with its code and exits 1', async () => {
      // A command that satisfies commander but is rejected app-side — e.g. a
      // type the CLI never coerces (the running instance is authoritative).
      const call = mockSession(schema, {
        ok: false,
        code: 'INVALID_ARGUMENTS',
        message: '<spec> must be a string over the wire, but number was given.',
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
  })

  describe('commander validates the command against the live schema', () => {
    it('rejects a command the instance does not advertise, without reaching exec', async () => {
      const call = mockSession()

      expect(await tap.start(['bogus'], {})).toBe(1)
      // commander prints the message to stderr (console.error) in text mode.
      expect(vi.mocked(console.error).mock.calls.flat().join(' ')).toContain(`unknown command 'bogus'`)
      // The handshake was the only call — exec never ran.
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
      mockResolved({ runner: readyRunner({ pid: 7777, projectRoot: '/projects/app' }) })

      expect(await tap.start(['--help'], {})).toBe(0)
      // Basic info about the instance every command here would target, one fact
      // per indented line.
      expect(logger.print()).toContain('Target:\n  /projects/app\n  v15.0.0\n  pid:7777')
    })

    it('lists the CLI-native instances command at the top of the overview commands', async () => {
      mockSession()

      expect(await tap.start(['--help'], {})).toBe(0)
      const help = logger.print()

      // instances precedes the schema-derived commands in the Commands list.
      expect(help).toContain('instances')
      expect(help.indexOf('instances')).toBeLessThan(help.indexOf('health'))
    })

    it('notes which instance was auto-selected when several were live', async () => {
      mockSession()
      mockResolved({ runner: readyRunner({ pid: 7777 }), reason: 'arbitrary', candidateCount: 3 })

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
      // The per-command help is fronted by the same instance banner.
      expect(logger.print()).toContain('Target:\n  /projects/app\n  v15.0.0')
      expect(call.mock.calls).toEqual([['getSchema']])
    })

    it('fails when help is requested for a command the instance does not advertise', async () => {
      mockSession()

      expect(await tap.start(['bogus', '--help'], {})).toBe(1)
      expect(logger.print()).toContain('UNKNOWN_COMMAND')
      expect(logger.print()).toContain('is not a command')
    })
  })

  describe('the CLI-native instances command', () => {
    const liveRunner = (overrides: Partial<LiveRunnerState> = {}): LiveRunnerState => ({
      schemaVersion: 1,
      pid: 54321,
      projectRoot: '/projects/app',
      serverPort: 49200,
      instanceId: 'inst-1',
      testingType: 'e2e',
      cdpBrowserWsUrl: 'ws://127.0.0.1:9222/devtools/browser/abc',
      ...overrides,
    })

    it('renders the live runners as a JSON summary and exits 0, without opening a session', async () => {
      vi.mocked(listLiveRunners).mockResolvedValue([
        liveRunner({ pid: 111, projectRoot: '/projects/app', serverPort: 49200, cdpBrowserWsUrl: 'ws://x' }),
        liveRunner({ pid: 222, projectRoot: '/projects/other', serverPort: 49201, cdpBrowserWsUrl: null }),
      ])

      expect(await tap.start(['instances'], {})).toBe(0)
      expect(JSON.parse(logger.print())).toEqual([
        { pid: 111, projectRoot: '/projects/app', serverPort: 49200, browserAttached: true },
        { pid: 222, projectRoot: '/projects/other', serverPort: 49201, browserAttached: false },
      ])

      // instances enumerates discovery — it never connects to an instance.
      expect(withTapSession).not.toHaveBeenCalled()
    })

    it('renders an empty array when no runner is live', async () => {
      vi.mocked(listLiveRunners).mockResolvedValue([])

      expect(await tap.start(['instances'], {})).toBe(0)
      expect(JSON.parse(logger.print())).toEqual([])
    })

    it('forwards --instance as the discovery filter', async () => {
      vi.mocked(listLiveRunners).mockResolvedValue([])

      await tap.start(['instances'], { instance: 1234 })

      expect(listLiveRunners).toHaveBeenCalledWith({ instance: 1234 })
    })

    it('lists every live runner when --instance is absent', async () => {
      vi.mocked(listLiveRunners).mockResolvedValue([])

      await tap.start(['instances'], {})

      expect(listLiveRunners).toHaveBeenCalledWith({ instance: undefined })
    })

    it('prints instances usage for `instances --help` and exits 0, without enumerating', async () => {
      expect(await tap.start(['instances', '--help'], {})).toBe(0)
      expect(logger.print()).toContain('Usage: cypress tap instances')
      expect(listLiveRunners).not.toHaveBeenCalled()
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
      mockSession({ ...schema, protocolVersion: 2 })

      expect(await tap.start(['health'], {})).toBe(1)
      expect(logger.print()).toContain('requires a more recent CLI')
    })
  })

  describe('failure rendering', () => {
    // Discovery (which instance to target) is resolveRunner's job; the session
    // transport (CDP) is withTapSession's. The two error sources are mocked at
    // their respective seams.
    const failResolve = (err: unknown) => vi.mocked(resolveRunner).mockRejectedValue(err)
    const failSession = (err: unknown) => vi.mocked(withTapSession).mockRejectedValue(err)

    it('renders discovery errors with their code and exits 1', async () => {
      failResolve(new RunnerDiscoveryError('NO_DISCOVERY_FILE', 'No running Cypress was found.'))

      expect(await tap.start(['health'], {})).toBe(1)
      expect(logger.print()).toBe('NO_DISCOVERY_FILE: No running Cypress was found.')
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
      failResolve(new RunnerDiscoveryError('NO_DISCOVERY_FILE', 'No running Cypress was found.'))

      expect(await tap.start(['--help'], {})).toBe(0)
      expect(logger.print()).toContain('Usage: cypress tap')
      expect(logger.print()).toContain('discovered from the running Cypress instance')
    })

    it('falls back to generic help (exit 1) for a bare invocation with no instance found', async () => {
      failResolve(new RunnerDiscoveryError('NO_DISCOVERY_FILE', 'No running Cypress was found.'))

      expect(await tap.start([], {})).toBe(1)
      expect(logger.print()).toContain('Usage: cypress tap')
    })

    it('still surfaces the discovery error when an actual command was requested', async () => {
      failResolve(new RunnerDiscoveryError('NO_DISCOVERY_FILE', 'No running Cypress was found.'))

      expect(await tap.start(['health'], {})).toBe(1)
      expect(logger.print()).toContain('NO_DISCOVERY_FILE')
    })

    it('rethrows unexpected errors for the generic CLI error path', async () => {
      const unexpected = new Error('boom')

      failResolve(unexpected)

      await expect(tap.start(['health'], {})).rejects.toBe(unexpected)
    })
  })
})
