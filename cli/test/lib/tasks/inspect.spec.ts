import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest'
import chalk from 'chalk'
import { Console } from 'console'

import inspect, { buildSpecTree, renderSpecTree } from '../../../lib/tasks/inspect'
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
    it('specs, text → renders as an ASCII tree', async () => {
      vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            currentProject: {
              specs: [
                { relative: 'cypress/e2e/a.cy.ts', absolute: '/p/cypress/e2e/a.cy.ts', specType: 'integration' },
                { relative: 'cypress/e2e/auth/login.cy.ts', absolute: '/p/cypress/e2e/auth/login.cy.ts', specType: 'integration' },
                { relative: 'cypress/e2e/b.cy.ts', absolute: '/p/cypress/e2e/b.cy.ts', specType: 'integration' },
              ],
            },
          },
        }),
      })

      const out = createStdoutCapture()

      await inspect.specs({})

      const lines = out().split('\n').filter(Boolean)

      expect(lines).toEqual([
        '└── cypress/',
        '    └── e2e/',
        '        ├── auth/',
        '        │   └── login.cy.ts',
        '        ├── a.cy.ts',
        '        └── b.cy.ts',
      ])
    })

    it('empty spec list, text → prints nothing', async () => {
      vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: { currentProject: { specs: [] } } }),
      })

      const out = createStdoutCapture()

      await inspect.specs({})

      expect(out()).toEqual('')
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

  describe('buildSpecTree / renderSpecTree', () => {
    it('builds a tree from nested paths', () => {
      const tree = buildSpecTree([
        'cypress/e2e/a.cy.ts',
        'cypress/e2e/auth/login.cy.ts',
      ])

      const cypress = tree.children.get('cypress')
      const e2e = cypress?.children.get('e2e')
      const auth = e2e?.children.get('auth')

      expect(cypress).toBeDefined()
      expect(e2e?.children.has('a.cy.ts')).toBe(true)
      expect(auth?.children.has('login.cy.ts')).toBe(true)
    })

    it('drops empty segments (leading slashes, doubled slashes)', () => {
      const tree = buildSpecTree(['/cypress//e2e/a.cy.ts', ''])

      expect(Array.from(tree.children.keys())).toEqual(['cypress'])
      expect(tree.children.get('cypress')?.children.get('e2e')?.children.has('a.cy.ts')).toBe(true)
    })

    it('renders an empty tree as no lines', () => {
      expect(renderSpecTree(buildSpecTree([]))).toEqual([])
    })

    it('renders a single spec at the root', () => {
      expect(renderSpecTree(buildSpecTree(['spec.cy.ts']))).toEqual(['└── spec.cy.ts'])
    })

    it('sorts directories before files, alpha within each group', () => {
      const lines = renderSpecTree(buildSpecTree([
        'z-root.cy.ts',
        'a-root.cy.ts',
        'beta/one.cy.ts',
        'alpha/one.cy.ts',
      ]))

      expect(lines).toEqual([
        '├── alpha/',
        '│   └── one.cy.ts',
        '├── beta/',
        '│   └── one.cy.ts',
        '├── a-root.cy.ts',
        '└── z-root.cy.ts',
      ])
    })

    it('uses correct connectors for nested last-child branches', () => {
      const lines = renderSpecTree(buildSpecTree([
        'a/b/c.cy.ts',
        'a/b/d.cy.ts',
        'a/e.cy.ts',
      ]))

      expect(lines).toEqual([
        '└── a/',
        '    ├── b/',
        '    │   ├── c.cy.ts',
        '    │   └── d.cy.ts',
        '    └── e.cy.ts',
      ])
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

  describe('.run', () => {
    const PROJECT_ROOT = '/Users/me/code/my-app'
    const SPECS = [
      { relative: 'cypress/e2e/foo.cy.ts', absolute: `${PROJECT_ROOT}/cypress/e2e/foo.cy.ts` },
      { relative: 'cypress/e2e/bar.cy.ts', absolute: `${PROJECT_ROOT}/cypress/e2e/bar.cy.ts` },
      { relative: 'cypress/e2e/nested/foo.cy.ts', absolute: `${PROJECT_ROOT}/cypress/e2e/nested/foo.cy.ts` },
    ]

    const RUN_SPEC_RESPONSE = {
      __typename: 'RunSpecResponse',
      testingType: 'e2e',
      browser: { name: 'chrome', displayName: 'Chrome', channel: 'stable', family: 'chromium', version: '120' },
      spec: { relative: 'cypress/e2e/bar.cy.ts', absolute: `${PROJECT_ROOT}/cypress/e2e/bar.cy.ts`, name: 'bar.cy.ts' },
    }

    const mockProjectSpecs = (projectRoot: string | null, specs = SPECS): void => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: { currentProject: projectRoot === null ? null : { projectRoot, specs } },
        }),
      })
    }

    const mockRunSpecSuccess = (): void => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { runSpec: RUN_SPEC_RESPONSE } }),
      })
    }

    it('no instance → exit 2', async () => {
      vi.mocked(resolveInstance).mockRejectedValue(
        new InstanceDiscoveryError('NO_INSTANCE', 'No running Cypress instances found.'),
      )

      const err = createStderrCapture()

      await inspect.run({ spec: 'foo.cy.ts' })

      expect(err()).toContain('No running Cypress instances found.')
      expect(processExitSpy).toHaveBeenCalledWith(2)
    })

    it('missing spec argument → stderr + exit 1', async () => {
      const err = createStderrCapture()

      await inspect.run({})

      expect(err()).toContain('Missing required argument: <spec>')
      expect(processExitSpy).toHaveBeenCalledWith(1)
    })

    it('no project loaded → stderr + exit 1', async () => {
      vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
      mockProjectSpecs(null)

      const err = createStderrCapture()

      await inspect.run({ spec: 'foo.cy.ts' })

      expect(err()).toContain('No project loaded')
      expect(processExitSpy).toHaveBeenCalledWith(1)
    })

    it('absolute path found in specs → mutation called with that absolute path', async () => {
      vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
      mockProjectSpecs(PROJECT_ROOT)
      mockRunSpecSuccess()

      const out = createStdoutCapture()

      await inspect.run({ spec: `${PROJECT_ROOT}/cypress/e2e/bar.cy.ts` })

      expect(fetchSpy).toHaveBeenCalledTimes(2)
      const mutationCall = fetchSpy.mock.calls[1]
      const body = JSON.parse(mutationCall[1].body)

      expect(body.variables).toEqual({ specPath: `${PROJECT_ROOT}/cypress/e2e/bar.cy.ts` })
      expect(out()).toContain('Launched cypress/e2e/bar.cy.ts')
    })

    it('absolute path NOT in specs → exit 1', async () => {
      vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
      mockProjectSpecs(PROJECT_ROOT)

      const err = createStderrCapture()

      await inspect.run({ spec: '/some/other/path/x.cy.ts' })

      expect(err()).toContain('No such spec: /some/other/path/x.cy.ts')
      expect(processExitSpy).toHaveBeenCalledWith(1)
    })

    it('relative path resolved against projectRoot → mutation with correct absolute', async () => {
      vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
      mockProjectSpecs(PROJECT_ROOT)
      mockRunSpecSuccess()

      await inspect.run({ spec: 'cypress/e2e/bar.cy.ts' })

      const mutationCall = fetchSpy.mock.calls[1]
      const body = JSON.parse(mutationCall[1].body)

      expect(body.variables).toEqual({ specPath: `${PROJECT_ROOT}/cypress/e2e/bar.cy.ts` })
    })

    it('relative path not in specs → exit 1', async () => {
      vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
      mockProjectSpecs(PROJECT_ROOT)

      const err = createStderrCapture()

      await inspect.run({ spec: 'some/path/missing.cy.ts' })

      expect(err()).toContain('No such spec: some/path/missing.cy.ts')
      expect(processExitSpy).toHaveBeenCalledWith(1)
    })

    it('unique basename match → mutation with correct absolute', async () => {
      vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
      mockProjectSpecs(PROJECT_ROOT, [
        { relative: 'cypress/e2e/uniq.cy.ts', absolute: `${PROJECT_ROOT}/cypress/e2e/uniq.cy.ts` },
        { relative: 'cypress/e2e/other.cy.ts', absolute: `${PROJECT_ROOT}/cypress/e2e/other.cy.ts` },
      ])

      mockRunSpecSuccess()

      await inspect.run({ spec: 'uniq.cy.ts' })

      const mutationCall = fetchSpy.mock.calls[1]
      const body = JSON.parse(mutationCall[1].body)

      expect(body.variables).toEqual({ specPath: `${PROJECT_ROOT}/cypress/e2e/uniq.cy.ts` })
    })

    it('ambiguous basename (2 matches) → stderr lists both, exit 1', async () => {
      vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
      mockProjectSpecs(PROJECT_ROOT)

      const err = createStderrCapture()

      await inspect.run({ spec: 'foo.cy.ts' })

      const stderr = err()

      expect(stderr).toContain('Ambiguous spec \'foo.cy.ts\'')
      expect(stderr).toContain('cypress/e2e/foo.cy.ts')
      expect(stderr).toContain('cypress/e2e/nested/foo.cy.ts')
      expect(processExitSpy).toHaveBeenCalledWith(1)
    })

    it('basename with no match → exit 1', async () => {
      vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
      mockProjectSpecs(PROJECT_ROOT)

      const err = createStderrCapture()

      await inspect.run({ spec: 'missing.cy.ts' })

      expect(err()).toContain('No spec matching: missing.cy.ts')
      expect(processExitSpy).toHaveBeenCalledWith(1)
    })

    it('mutation error response → propagates as thrown error', async () => {
      vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
      mockProjectSpecs(PROJECT_ROOT)
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ errors: [{ message: 'runSpec failed' }] }),
      })

      await expect(inspect.run({ spec: 'bar.cy.ts' })).rejects.toThrow('runSpec failed')
    })

    it('success text → "Launched <relative>"', async () => {
      vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
      mockProjectSpecs(PROJECT_ROOT)
      mockRunSpecSuccess()

      const out = createStdoutCapture()

      await inspect.run({ spec: 'bar.cy.ts' })

      expect(out()).toContain('Launched cypress/e2e/bar.cy.ts')
    })

    it('success json → printed mutation result', async () => {
      vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
      mockProjectSpecs(PROJECT_ROOT)
      mockRunSpecSuccess()

      const out = createStdoutCapture()

      await inspect.run({ spec: 'bar.cy.ts', json: true })

      const parsed = JSON.parse(out())

      expect(parsed).toEqual(RUN_SPEC_RESPONSE)
    })

    it('--instance <pid> forwarded to resolveInstance', async () => {
      vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
      mockProjectSpecs(PROJECT_ROOT)
      mockRunSpecSuccess()

      await inspect.run({ spec: 'bar.cy.ts', instance: '12345' })

      expect(resolveInstance).toHaveBeenCalledWith('12345')
    })
  })

  describe('.switch', () => {
    const queueSnapshotResponses = (snapshots: any[]): void => {
      for (const snapshot of snapshots) {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ data: { inspectSnapshot: snapshot } }),
        })
      }
    }

    const mockMutationOk = (payload: any = { switchTestingTypeAndRelaunch: true }): void => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: payload }),
      })
    }

    it('no instance → exit 2', async () => {
      vi.mocked(resolveInstance).mockRejectedValue(
        new InstanceDiscoveryError('NO_INSTANCE', 'No running Cypress instances found.'),
      )

      const err = createStderrCapture()

      await inspect.switch({ mode: 'e2e' })

      expect(err()).toContain('No running Cypress instances found.')
      expect(processExitSpy).toHaveBeenCalledWith(2)
    })

    it('missing mode → stderr + exit 1', async () => {
      const err = createStderrCapture()

      await inspect.switch({})

      expect(err()).toContain('Missing required argument: <mode>')
      expect(processExitSpy).toHaveBeenCalledWith(1)
    })

    it('invalid mode → stderr + exit 1', async () => {
      const err = createStderrCapture()

      await inspect.switch({ mode: 'bogus' })

      expect(err()).toContain('Invalid testing type \'bogus\'')
      expect(processExitSpy).toHaveBeenCalledWith(1)
    })

    it('e2e default → switchTestingTypeAndRelaunch called; poll sees open → exit 0', async () => {
      vi.useFakeTimers()

      try {
        vi.mocked(resolveInstance).mockResolvedValue(makeInstance())

        mockMutationOk()
        queueSnapshotResponses([
          { ...SNAPSHOT, browserStatus: 'opening', testingType: 'e2e' },
          { ...SNAPSHOT, browserStatus: 'open', testingType: 'e2e' },
        ])

        const out = createStdoutCapture()

        const p = inspect.switch({ mode: 'e2e' })

        await vi.advanceTimersByTimeAsync(500)
        await vi.advanceTimersByTimeAsync(500)
        await p

        const mutationCall = fetchSpy.mock.calls[0]
        const mutationBody = JSON.parse(mutationCall[1].body)

        expect(mutationBody.query).toContain('switchTestingTypeAndRelaunch')
        expect(mutationBody.variables).toEqual({ testingType: 'e2e' })

        const stdout = out()

        expect(stdout).toContain('switched testing type to e2e')
        expect(stdout).toContain('browser: chrome (open)')
      } finally {
        vi.useRealTimers()
      }
    })

    it('component default → switchTestingTypeAndRelaunch called', async () => {
      vi.useFakeTimers()

      try {
        vi.mocked(resolveInstance).mockResolvedValue(makeInstance())

        mockMutationOk()
        queueSnapshotResponses([
          { ...SNAPSHOT, browserStatus: 'open', testingType: 'component' },
        ])

        const p = inspect.switch({ mode: 'component' })

        await vi.advanceTimersByTimeAsync(500)
        await p

        const mutationCall = fetchSpy.mock.calls[0]
        const mutationBody = JSON.parse(mutationCall[1].body)

        expect(mutationBody.query).toContain('switchTestingTypeAndRelaunch')
        expect(mutationBody.variables).toEqual({ testingType: 'component' })
      } finally {
        vi.useRealTimers()
      }
    })

    it('--no-relaunch → setAndLoadCurrentTestingType called, no polling', async () => {
      vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
      mockMutationOk({ setAndLoadCurrentTestingType: { __typename: 'Query' } })

      const out = createStdoutCapture()

      await inspect.switch({ mode: 'e2e', noRelaunch: true })

      // Only the mutation call — no polling snapshots.
      expect(fetchSpy).toHaveBeenCalledTimes(1)
      const body = JSON.parse(fetchSpy.mock.calls[0][1].body)

      expect(body.query).toContain('setAndLoadCurrentTestingType')
      expect(body.variables).toEqual({ testingType: 'e2e' })
      expect(out()).toContain('switched testing type to e2e')
    })

    it('poll timeout after --timeout 100 ms while status stays opening → exit 124', async () => {
      vi.useFakeTimers()

      try {
        vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
        mockMutationOk()

        // Every poll returns 'opening' — will never settle.
        fetchSpy.mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              inspectSnapshot: { ...SNAPSHOT, browserStatus: 'opening', testingType: 'e2e' },
            },
          }),
        })

        const err = createStderrCapture()

        const p = inspect.switch({ mode: 'e2e', timeout: 100 })

        // Advance past one poll interval; still opening, deadline exceeded.
        await vi.advanceTimersByTimeAsync(500)
        await p

        expect(err()).toContain('Timed out after 100ms')
        expect(processExitSpy).toHaveBeenCalledWith(124)
      } finally {
        vi.useRealTimers()
      }
    })

    it('text output final line matches design doc example', async () => {
      vi.useFakeTimers()

      try {
        vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
        mockMutationOk()
        queueSnapshotResponses([
          { ...SNAPSHOT, browserStatus: 'open', testingType: 'e2e' },
        ])

        const out = createStdoutCapture()

        const p = inspect.switch({ mode: 'e2e' })

        await vi.advanceTimersByTimeAsync(500)
        await p

        const lines = out().split('\n').filter(Boolean)

        expect(lines[lines.length - 2]).toEqual('switched testing type to e2e')
        expect(lines[lines.length - 1]).toEqual('browser: chrome (open)')
      } finally {
        vi.useRealTimers()
      }
    })

    it('json output is final snapshot', async () => {
      vi.useFakeTimers()

      try {
        vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
        mockMutationOk()
        const finalSnapshot = { ...SNAPSHOT, browserStatus: 'open', testingType: 'e2e' }

        queueSnapshotResponses([finalSnapshot])

        const out = createStdoutCapture()

        const p = inspect.switch({ mode: 'e2e', json: true })

        await vi.advanceTimersByTimeAsync(500)
        await p

        const parsed = JSON.parse(out())

        expect(parsed).toEqual(finalSnapshot)
      } finally {
        vi.useRealTimers()
      }
    })

    it('--instance <pid> forwarded to resolveInstance', async () => {
      vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
      mockMutationOk({ setAndLoadCurrentTestingType: { __typename: 'Query' } })

      await inspect.switch({ mode: 'e2e', noRelaunch: true, instance: '12345' })

      expect(resolveInstance).toHaveBeenCalledWith('12345')
    })
  })

  describe('.command', () => {
    const STUDIO_TEST_ID = 'r1'

    const makeCommand = (overrides: any = {}) => ({
      id: 'l3',
      name: 'get',
      message: '.foo',
      state: 'passed',
      type: 'parent',
      testId: STUDIO_TEST_ID,
      displayName: null,
      number: 3,
      snapshotCount: 2,
      hasSnapshot: true,
      hasConsoleProps: true,
      timeout: 4000,
      numElements: 1,
      visible: true,
      groupLevel: 0,
      group: null,
      alias: null,
      aliasType: null,
      referencesAlias: null,
      hookId: null,
      error: null,
      wallClockStartedAt: '2026-04-22T00:00:00.000Z',
      ...overrides,
    })

    const withCommands = (commands: any[], overrides: any = {}) => ({
      ...SNAPSHOT,
      studioActiveTestId: STUDIO_TEST_ID,
      activeRun: {
        specPath: '/path/to/project/foo.cy.ts',
        startedAt: '2026-04-22T00:00:00.000Z',
        endedAt: null,
        status: 'finished',
        tests: [{ testId: STUDIO_TEST_ID, title: 't', titlePath: ['t'], state: 'passed', duration: 10, currentRetry: 0, error: null }],
        stats: { passed: 1, failed: 0, pending: 0, skipped: 0, total: 1 },
        commands,
      },
      ...overrides,
    })

    const mockSnapshotOnce = (snapshot: any): void => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { inspectSnapshot: snapshot } }),
      })
    }

    const mockMutation = (payload: any): void => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: payload }),
      })
    }

    describe('.commandList', () => {
      it('not in Studio → stderr + exit 1', async () => {
        vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
        mockSnapshotResponse({ ...SNAPSHOT, studioActiveTestId: null })

        const err = createStderrCapture()

        await inspect.commandList({})

        expect(err()).toContain('Not in Studio mode')
        expect(processExitSpy).toHaveBeenCalledWith(1)
      })

      it('no commands → text notice', async () => {
        vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
        mockSnapshotResponse(withCommands([]))

        const out = createStdoutCapture()

        await inspect.commandList({})

        expect(out()).toContain('no commands')
      })

      it('--json returns the raw commands array', async () => {
        vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
        const cmd = makeCommand()

        mockSnapshotResponse(withCommands([cmd]))

        const out = createStdoutCapture()

        await inspect.commandList({ json: true })

        expect(JSON.parse(out())).toEqual([cmd])
      })

      it('text output includes enriched columns (snapshots, elements)', async () => {
        vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
        mockSnapshotResponse(withCommands([makeCommand({ snapshotCount: 2, numElements: 1 })]))

        const out = createStdoutCapture()

        await inspect.commandList({})

        const text = out()

        expect(text).toContain('SNAPS')
        expect(text).toContain('ELEMS')
        expect(text).toContain('get')
      })
    })

    describe('.commandCurrent', () => {
      const mockPinnedResponse = (payload: any): void => {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ data: { inspectSnapshot: payload } }),
        })
      }

      it('not in Studio → stderr + exit 1', async () => {
        vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
        mockPinnedResponse({ studioActiveTestId: null, pinnedCommand: null })

        const err = createStderrCapture()

        await inspect.commandCurrent({})

        expect(err()).toContain('Not in Studio mode')
        expect(processExitSpy).toHaveBeenCalledWith(1)
      })

      it('nothing pinned → stderr + exit 1', async () => {
        vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
        mockPinnedResponse({ studioActiveTestId: STUDIO_TEST_ID, pinnedCommand: null })

        const err = createStderrCapture()

        await inspect.commandCurrent({})

        expect(err()).toContain('No command is pinned')
        expect(processExitSpy).toHaveBeenCalledWith(1)
      })

      it('--json returns the full pinned payload', async () => {
        vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
        const cmd = makeCommand()
        const pinned = { testId: STUDIO_TEST_ID, logId: cmd.id, consolePropsJson: '{"Command":"get"}', command: cmd }

        mockPinnedResponse({ studioActiveTestId: STUDIO_TEST_ID, pinnedCommand: pinned })

        const out = createStdoutCapture()

        await inspect.commandCurrent({ json: true })

        expect(JSON.parse(out())).toEqual(pinned)
      })

      it('text output includes command metadata and parsed consoleProps', async () => {
        vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
        const cmd = makeCommand({ alias: 'foo', aliasType: 'dom', numElements: 2 })

        mockPinnedResponse({
          studioActiveTestId: STUDIO_TEST_ID,
          pinnedCommand: { testId: STUDIO_TEST_ID, logId: cmd.id, consolePropsJson: '{"Command":"get","Elements":2}', command: cmd },
        })

        const out = createStdoutCapture()

        await inspect.commandCurrent({})

        const text = out()

        expect(text).toContain('Command:')
        expect(text).toContain('get')
        expect(text).toContain('Elements:  2')
        expect(text).toContain('Alias:     foo')
        expect(text).toContain('Console props:')
        expect(text).toContain('"Command": "get"')
      })
    })

    describe('.commandPin', () => {
      it('missing selector → stderr + exit 1', async () => {
        const err = createStderrCapture()

        await inspect.commandPin({})

        expect(err()).toContain('Missing required argument: <selector>')
        expect(processExitSpy).toHaveBeenCalledWith(1)
      })

      it('not in Studio → stderr + exit 1', async () => {
        vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
        mockSnapshotResponse({ ...SNAPSHOT, studioActiveTestId: null })

        const err = createStderrCapture()

        await inspect.commandPin({ selector: '3' })

        expect(err()).toContain('Not in Studio mode')
        expect(processExitSpy).toHaveBeenCalledWith(1)
      })

      it('selector by number → fires mutation with resolved logId', async () => {
        vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
        const cmd = makeCommand({ id: 'lx', number: 3 })

        mockSnapshotOnce(withCommands([cmd]))
        mockMutation({ inspectPinCommand: { logId: 'lx' } })

        await inspect.commandPin({ selector: '3' })

        const mutationCall = fetchSpy.mock.calls[1]
        const body = JSON.parse(mutationCall[1].body)

        expect(body.variables).toEqual({ logId: 'lx' })
      })

      it('unknown selector → stderr + exit 1', async () => {
        vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
        mockSnapshotResponse(withCommands([makeCommand()]))

        const err = createStderrCapture()

        await inspect.commandPin({ selector: 'nonexistent' })

        expect(err()).toContain('No command matching')
        expect(processExitSpy).toHaveBeenCalledWith(1)
      })

      it('server error code → stderr + exit 1', async () => {
        vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
        const cmd = makeCommand()

        mockSnapshotOnce(withCommands([cmd]))
        mockMutation({ inspectPinCommand: { code: 'SPEC_RUNNING', detailMessage: 'spec is still running' } })

        const err = createStderrCapture()

        await inspect.commandPin({ selector: cmd.id })

        expect(err()).toContain('SPEC_RUNNING')
        expect(err()).toContain('spec is still running')
        expect(processExitSpy).toHaveBeenCalledWith(1)
      })
    })

    describe('.commandUnpin', () => {
      it('fires the unpin mutation', async () => {
        vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
        mockMutation({ inspectUnpinCommand: true })

        await inspect.commandUnpin({})

        expect(fetchSpy).toHaveBeenCalledTimes(1)
        const body = JSON.parse(fetchSpy.mock.calls[0][1].body)

        expect(body.query).toContain('inspectUnpinCommand')
      })
    })

    describe('.commandInfo', () => {
      it('missing selectors → stderr + exit 1', async () => {
        const err = createStderrCapture()

        await inspect.commandInfo({})

        expect(err()).toContain('Missing required argument: <selector>')
        expect(processExitSpy).toHaveBeenCalledWith(1)
      })

      it('empty selectors array → stderr + exit 1', async () => {
        const err = createStderrCapture()

        await inspect.commandInfo({ selectors: [] })

        expect(err()).toContain('Missing required argument: <selector>')
        expect(processExitSpy).toHaveBeenCalledWith(1)
      })

      it('not in Studio → stderr + exit 1', async () => {
        vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
        mockSnapshotResponse({ ...SNAPSHOT, studioActiveTestId: null })

        const err = createStderrCapture()

        await inspect.commandInfo({ selectors: ['3'] })

        expect(err()).toContain('Not in Studio mode')
        expect(processExitSpy).toHaveBeenCalledWith(1)
      })

      it('no commands on the Studio test → stderr + exit 1', async () => {
        vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
        mockSnapshotResponse(withCommands([]))

        const err = createStderrCapture()

        await inspect.commandInfo({ selectors: ['3'] })

        expect(err()).toContain('No commands on the current Studio test')
        expect(processExitSpy).toHaveBeenCalledWith(1)
      })

      it('unknown selector → exits via resolveCommand stderr', async () => {
        vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
        mockSnapshotResponse(withCommands([makeCommand()]))

        const err = createStderrCapture()

        await inspect.commandInfo({ selectors: ['nonexistent'] })

        expect(err()).toContain('No command matching')
        expect(processExitSpy).toHaveBeenCalledWith(1)
      })

      it('single selector → queries with single logId and prints detail', async () => {
        vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
        const cmd = makeCommand({ id: 'log-7', number: 3, name: 'visit', message: '/' })

        mockSnapshotOnce(withCommands([cmd]))
        mockMutation({
          inspectCommandInfo: {
            items: [{ command: cmd, consolePropsJson: '{"Command":"visit"}' }],
          },
        })

        const out = createStdoutCapture()

        await inspect.commandInfo({ selectors: ['3'] })

        const queryCall = fetchSpy.mock.calls[1]
        const body = JSON.parse(queryCall[1].body)

        expect(body.variables).toEqual({ logIds: ['log-7'] })
        expect(out()).toContain('Command:')
        expect(out()).toContain('visit')
        expect(out()).toContain('"Command": "visit"')
      })

      it('multiple selectors → dedupes and preserves request order', async () => {
        vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
        const a = makeCommand({ id: 'log-a', number: 1, name: 'visit' })
        const b = makeCommand({ id: 'log-b', number: 2, name: 'get' })

        mockSnapshotOnce(withCommands([a, b]))
        mockMutation({
          inspectCommandInfo: {
            items: [
              { command: b, consolePropsJson: null },
              { command: a, consolePropsJson: null },
            ],
          },
        })

        await inspect.commandInfo({ selectors: ['get', 'visit', 'log-a'] })

        const queryCall = fetchSpy.mock.calls[1]
        const body = JSON.parse(queryCall[1].body)

        expect(body.variables).toEqual({ logIds: ['log-b', 'log-a'] })
      })

      it('JSON output → always an array of { command, consolePropsJson }', async () => {
        vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
        const cmd = makeCommand({ id: 'log-x' })

        mockSnapshotOnce(withCommands([cmd]))
        mockMutation({
          inspectCommandInfo: {
            items: [{ command: cmd, consolePropsJson: null }],
          },
        })

        const out = createStdoutCapture()

        await inspect.commandInfo({ selectors: [cmd.id], json: true })

        const parsed = JSON.parse(out())

        expect(Array.isArray(parsed)).toBe(true)
        expect(parsed).toHaveLength(1)
        expect(parsed[0]).toHaveProperty('command')
        expect(parsed[0]).toHaveProperty('consolePropsJson')
      })

      it('server error code → stderr + exit 1', async () => {
        vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
        const cmd = makeCommand()

        mockSnapshotOnce(withCommands([cmd]))
        mockMutation({ inspectCommandInfo: { code: 'LOG_NOT_FOUND', detailMessage: 'Unknown log id(s): log-z' } })

        const err = createStderrCapture()

        await inspect.commandInfo({ selectors: [cmd.id] })

        expect(err()).toContain('LOG_NOT_FOUND')
        expect(err()).toContain('Unknown log id(s)')
        expect(processExitSpy).toHaveBeenCalledWith(1)
      })

      it('does not fire the pin mutation', async () => {
        vi.mocked(resolveInstance).mockResolvedValue(makeInstance())
        const cmd = makeCommand({ id: 'log-7' })

        mockSnapshotOnce(withCommands([cmd]))
        mockMutation({
          inspectCommandInfo: {
            items: [{ command: cmd, consolePropsJson: null }],
          },
        })

        await inspect.commandInfo({ selectors: [cmd.id] })

        const allCalls = fetchSpy.mock.calls.map((c) => JSON.parse(c[1].body).query).join('\n')

        expect(allCalls).not.toContain('inspectPinCommand')
        expect(allCalls).not.toContain('inspectUnpinCommand')
      })
    })
  })
})
