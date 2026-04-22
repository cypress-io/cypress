import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest'
import chalk from 'chalk'
import { Console } from 'console'

import inspect from '../../../lib/tasks/inspect'
import {
  Instance,
  InstanceDiscoveryError,
  readInstances,
  resolveInstance,
} from '../../../lib/util/instance-discovery'

vi.mock('../../../lib/util/instance-discovery', () => {
  return {
    InstanceDiscoveryError: class extends Error {
      code: 'NO_INSTANCE' | 'AMBIGUOUS_INSTANCE'
      instances?: Instance[]
      constructor (code: 'NO_INSTANCE' | 'AMBIGUOUS_INSTANCE', message: string, instances?: Instance[]) {
        super(message)
        this.name = 'InstanceDiscoveryError'
        this.code = code
        if (instances) {
          this.instances = instances
        }
      }
    },
    readInstances: vi.fn(),
    resolveInstance: vi.fn(),
  }
})

const makeInstance = (overrides: Partial<Instance> = {}): Instance => {
  return {
    pid: 54321,
    port: 58931,
    token: 'tok-54321',
    projectRoot: '/Users/me/code/my-app',
    projectHash: 'hash',
    cypressVersion: '15.0.0',
    startedAt: '2026-04-22T15:40:12.000Z',
    descriptorPath: '/tmp/54321.json',
    ...overrides,
  }
}

const SNAPSHOT = {
  pid: 54321,
  cypressVersion: '15.0.0',
  projectRoot: '/Users/me/code/my-app',
  testingType: 'e2e',
  browserStatus: 'open',
  activeBrowser: {
    name: 'chrome',
    displayName: 'Chrome',
    channel: 'stable',
    family: 'chromium',
    version: '120.0.0',
  },
  appRoute: 'SPEC_LIST',
  activeRun: null,
  specCount: 42,
}

describe('lib/tasks/inspect', () => {
  const createStdoutCapture = (): (() => string) => {
    const logs: string[] = []
    const originalOut = process.stdout.write.bind(process.stdout)

    vi.spyOn(process.stdout, 'write').mockImplementation((payload: any) => {
      logs.push(payload as string)

      return originalOut(payload)
    })

    return (): string => logs.join('')
  }

  const createStderrCapture = (): (() => string) => {
    const logs: string[] = []

    vi.spyOn(process.stderr, 'write').mockImplementation((payload: any) => {
      logs.push(payload as string)

      return true
    })

    return (): string => logs.join('')
  }

  let processExitSpy: any
  let fetchSpy: any
  let originalConsole: Console
  let previousChalkLevel: 0 | 1 | 2 | 3

  beforeEach(() => {
    previousChalkLevel = chalk.level
    // Disable color so assertions on table text are stable.
    chalk.level = 0

    vi.resetAllMocks()

    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(((_code?: number) => {
      // Swallow — tests assert on the spy, don't actually exit.
      return undefined as never
    }) as any)

    originalConsole = globalThis.console
    globalThis.console = new Console(process.stdout, process.stderr)

    fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
  })

  afterEach(() => {
    globalThis.console = originalConsole
    chalk.level = previousChalkLevel
    vi.unstubAllGlobals()
  })

  const mockSnapshotResponse = (snapshot: any = SNAPSHOT): void => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { inspectSnapshot: snapshot } }),
    })
  }

  describe('.list', () => {
    it('0 instances, text → stderr message + exit 2', async () => {
      vi.mocked(readInstances).mockResolvedValue([])

      const err = createStderrCapture()

      await inspect.list({})

      expect(err()).toEqual('No running Cypress instances.\n')
      expect(processExitSpy).toHaveBeenCalledWith(2)
    })

    it('0 instances, json → stdout [] + exit 0', async () => {
      vi.mocked(readInstances).mockResolvedValue([])

      const out = createStdoutCapture()

      await inspect.list({ json: true })

      expect(out()).toEqual('[]\n')
      expect(processExitSpy).toHaveBeenCalledWith(0)
    })

    it('1 instance, text → table row includes MODE + BROWSER from snapshot', async () => {
      vi.mocked(readInstances).mockResolvedValue([makeInstance()])
      mockSnapshotResponse()

      const out = createStdoutCapture()

      await inspect.list({})

      const stdout = out()

      expect(stdout).toContain('54321')
      expect(stdout).toContain('58931')
      expect(stdout).toContain('/Users/me/code/my-app')
      expect(stdout).toContain('e2e')
      expect(stdout).toContain('chrome (open)')
    })

    it('1 instance, json → stripped array (no token, no descriptorPath)', async () => {
      vi.mocked(readInstances).mockResolvedValue([makeInstance()])
      mockSnapshotResponse()

      const out = createStdoutCapture()

      await inspect.list({ json: true })

      const parsed = JSON.parse(out())

      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed).toHaveLength(1)
      expect(parsed[0]).not.toHaveProperty('token')
      expect(parsed[0]).not.toHaveProperty('descriptorPath')
      expect(parsed[0].pid).toBe(54321)
      expect(parsed[0].snapshot.testingType).toBe('e2e')
      expect(processExitSpy).toHaveBeenCalledWith(0)
    })

    it('2 instances, one snapshot errors → dashes for that row, other row intact', async () => {
      const a = makeInstance()
      const b = makeInstance({
        pid: 99999,
        port: 60122,
        token: 'tok-99999',
        projectRoot: '/Users/me/code/other-app',
      })

      vi.mocked(readInstances).mockResolvedValue([a, b])

      fetchSpy
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { inspectSnapshot: SNAPSHOT } }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      })

      const out = createStdoutCapture()

      await inspect.list({})

      const stdout = out()

      expect(stdout).toContain('54321')
      expect(stdout).toContain('99999')
      expect(stdout).toContain('e2e')
      expect(stdout).toContain('chrome (open)')
      // second row — dashes for MODE and BROWSER
      const rowBIdx = stdout.indexOf('99999')
      const rowBSlice = stdout.slice(rowBIdx)

      expect(rowBSlice).toContain('—')
    })

    it('snapshot call uses correct endpoint + header', async () => {
      vi.mocked(readInstances).mockResolvedValue([makeInstance()])
      mockSnapshotResponse()

      createStdoutCapture()

      await inspect.list({ json: true })

      expect(fetchSpy).toHaveBeenCalledTimes(1)
      const [url, init] = fetchSpy.mock.calls[0]

      expect(url).toBe('http://127.0.0.1:58931/__inspect/graphql')
      expect(init.method).toBe('POST')
      expect(init.headers['X-Cypress-Inspect-Token']).toBe('tok-54321')
      expect(init.headers['Content-Type']).toBe('application/json')
    })
  })

  describe('.status', () => {
    it('no instance → stderr + exit 2', async () => {
      vi.mocked(resolveInstance).mockRejectedValue(
        new InstanceDiscoveryError('NO_INSTANCE', 'No running Cypress instances found.'),
      )

      const err = createStderrCapture()

      await inspect.status({})

      expect(err()).toContain('No running Cypress instances found.')
      expect(processExitSpy).toHaveBeenCalledWith(2)
    })

    it('ambiguous → stderr with pid list + exit 2', async () => {
      const a = makeInstance()
      const b = makeInstance({ pid: 99999, projectRoot: '/b' })

      vi.mocked(resolveInstance).mockRejectedValue(
        new InstanceDiscoveryError('AMBIGUOUS_INSTANCE', 'Multiple', [a, b]),
      )

      const err = createStderrCapture()

      await inspect.status({})

      const stderr = err()

      expect(stderr).toContain('Multiple instances running. Pass --instance <pid>')
      expect(stderr).toContain('54321')
      expect(stderr).toContain('99999')
      expect(processExitSpy).toHaveBeenCalledWith(2)
    })

    it('success, text → full block with all fields', async () => {
      vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
      mockSnapshotResponse()

      const out = createStdoutCapture()

      await inspect.status({})

      const stdout = out()

      expect(stdout).toContain('Project:        /Users/me/code/my-app')
      expect(stdout).toContain('Testing type:   e2e')
      expect(stdout).toContain('Browser:        chrome (open)')
      expect(stdout).toContain('App route:      SPEC_LIST')
      expect(stdout).toContain('Specs:          42')
      expect(stdout).toContain('Active run:     —')
    })

    it('success, json → full snapshot object', async () => {
      vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
      mockSnapshotResponse()

      const out = createStdoutCapture()

      await inspect.status({ json: true })

      const parsed = JSON.parse(out())

      expect(parsed).toEqual(SNAPSHOT)
      expect(processExitSpy).toHaveBeenCalledWith(0)
    })

    it('--instance 12345 forwarded to resolveInstance', async () => {
      vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
      mockSnapshotResponse()

      createStdoutCapture()

      await inspect.status({ instance: '12345', json: true })

      expect(resolveInstance).toHaveBeenCalledWith('12345')
    })
  })

  describe('.specs', () => {
    it('3 specs, text → 3 lines of relative paths', async () => {
      vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            currentProject: {
              specs: [
                { relative: 'cypress/e2e/a.cy.ts', absolute: '/p/cypress/e2e/a.cy.ts', specType: 'integration' },
                { relative: 'cypress/e2e/b.cy.ts', absolute: '/p/cypress/e2e/b.cy.ts', specType: 'integration' },
                { relative: 'cypress/e2e/c.cy.ts', absolute: '/p/cypress/e2e/c.cy.ts', specType: 'integration' },
              ],
            },
          },
        }),
      })

      const out = createStdoutCapture()

      await inspect.specs({})

      const lines = out().split('\n').filter(Boolean)

      expect(lines).toEqual([
        'cypress/e2e/a.cy.ts',
        'cypress/e2e/b.cy.ts',
        'cypress/e2e/c.cy.ts',
      ])
    })

    it('3 specs, json → array with relative, absolute, specType', async () => {
      vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
      const specs = [
        { relative: 'a.cy.ts', absolute: '/p/a.cy.ts', specType: 'integration' },
        { relative: 'b.cy.ts', absolute: '/p/b.cy.ts', specType: 'integration' },
        { relative: 'c.cy.ts', absolute: '/p/c.cy.ts', specType: 'integration' },
      ]

      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: { currentProject: { specs } } }),
      })

      const out = createStdoutCapture()

      await inspect.specs({ json: true })

      const parsed = JSON.parse(out())

      expect(parsed).toEqual(specs)
      expect(processExitSpy).toHaveBeenCalledWith(0)
    })

    it('currentProject null → stderr + exit 1', async () => {
      vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: { currentProject: null } }),
      })

      const err = createStderrCapture()

      await inspect.specs({})

      expect(err()).toContain('No project loaded')
      expect(processExitSpy).toHaveBeenCalledWith(1)
    })
  })

  describe('GraphQL client', () => {
    it('non-2xx response → throws', async () => {
      vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({}),
      })

      await expect(inspect.status({})).rejects.toThrow(/status 401/)
    })

    it('GraphQL errors array → throws with first error message', async () => {
      vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ errors: [{ message: 'boom' }, { message: 'ignored' }] }),
      })

      await expect(inspect.status({})).rejects.toThrow('boom')
    })
  })
})
