import fs from 'fs'
import fsExtra from 'fs-extra'
import _ from 'lodash'
import nock from 'nock'
import { createRequire } from 'module'
import electron from 'electron'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { run } from '../../lib/modes/run'
import type { ProjectConfigIpc as ProjectConfigIpcType } from '@packages/data-context/src/data/ProjectConfigIpc'
import type { FileDataSource as FileDataSourceType } from '@packages/data-context/src/sources/FileDataSource'
import browserUtils from '../../lib/browsers'
import { fs as fsUtil } from '../../lib/util/fs'
import { clearCtx, getCtx, makeDataContext, setCtx } from '../../lib/makeDataContext'
import { OpenProject } from '../../lib/open_project'
import { ProjectBase } from '../../lib/project-base'
import { ServerBase } from '../../lib/server-base'
import devServer from '../../lib/plugins/dev-server'
import * as errors from '../../lib/errors'
import { EarlyExitTerminator } from '../../lib/util/graceful_crash_handling'
import { GracefulExit } from '../../lib/util/graceful-exit'
import { cache } from '../../lib/cache'

// Its handlers read a second data-context instance that never sees `setCtx`.
// No test here drives GraphQL over HTTP or a socket.
vi.mock('@packages/data-context/graphql/makeGraphQLServer', () => {
  return {
    makeGraphQLServer: async () => 4444,
    graphqlWS: vi.fn(),
    tapGraphQLHTTP: vi.fn(),
    handleGraphQLSocketRequest: vi.fn(),
    handleRunnerGraphQLSocketRequest: vi.fn(),
  }
})

vi.mock('electron', async () => {
  const { default: electronStub } = await import('../support/helpers/electron_stub')

  return { ...electronStub, default: electronStub }
})

// `GracefulExit.resetForTesting` refuses to clear its singleton without this.
const testGlobals = globalThis as { IS_TEST?: boolean, CY_TEST_MOCK?: Record<string, any> }

testGlobals.IS_TEST = true

const requireCjs = createRequire(import.meta.url)

// vite hands `@packages/data-context` to node's own loader, so the classes the run uses
// come from node's module cache, not from a vite import of their source files.
const { ProjectConfigIpc } = requireCjs('@packages/data-context/src/data/ProjectConfigIpc') as { ProjectConfigIpc: typeof ProjectConfigIpcType }
const { FileDataSource } = requireCjs('@packages/data-context/src/sources/FileDataSource') as { FileDataSource: typeof FileDataSourceType }

// lib/modes/run.ts reaches `electron` with a bare `require()`, which bypasses vite's module graph.
const electronPath = createRequire(requireCjs.resolve('../../lib/modes/run')).resolve('electron')

const originalEnv = _.clone(process.env)

describe('lib/modes/run', () => {
  let ctx
  let specs = ['foo.cy.ts', 'bar.cy.ts', 'baz.cy.ts']
  let options: Record<string, any>

  // paths each stubbed lookup answers for; any other path gets `undefined`
  let accessiblePaths: Set<string>
  let directoryPaths: Set<string>
  let existingPaths: Set<string>
  let globResults: Map<string, string[]>

  beforeAll(() => {
    requireCjs.cache[electronPath] = { exports: electron, loaded: true } as unknown as NodeModule
  })

  afterAll(() => {
    delete requireCjs.cache[electronPath]
  })

  beforeEach(async () => {
    GracefulExit.resetForTesting()
    await clearCtx()
    setCtx(makeDataContext({} as Parameters<typeof makeDataContext>[0]))

    nock.disableNetConnect()
    nock.enableNetConnect(/localhost/)

    await cache.remove()

    process.env.CYPRESS_INTERNAL_BROWSER_CONNECT_TIMEOUT = '2000'
    specs = ['foo.cy.ts', 'bar.cy.ts', 'baz.cy.ts']

    options = {
      autoCancelAfterFailures: undefined,
      browser: 'chrome',
      ciBuildId: undefined,
      exit: false,
      group: undefined,
      headed: false,
      key: undefined,
      onError: (err: Error) => undefined,
      outputPath: '',
      parallel: undefined,
      passWithNoTests: false,
      projectRoot: '/path/to/project/root',
      quiet: false,
      record: false,
      socketId: 'foobarbaz',
      spec: specs,
      tag: undefined,
      testingType: 'e2e',
      webSecurity: true,
    }

    const mockedRelativeSupportFilePath = 'cypress/support/e2e.js'

    const chromeStable = {
      displayName: 'Chrome',
      name: 'chrome',
      channel: 'stable',
      version: '12.34.56',
      majorVersion: '12',
      family: 'chromium',
      path: '/path/to/google-chrome',
    }

    const foundBrowsers = [
      chromeStable,
    ]

    accessiblePaths = new Set([options.projectRoot])
    directoryPaths = new Set([options.projectRoot])
    existingPaths = new Set([`${options.projectRoot}/${mockedRelativeSupportFilePath}`])
    globResults = new Map([
      [`${options.projectRoot}|cypress/support/e2e.{js,jsx,ts,tsx}`, [`${options.projectRoot}/${mockedRelativeSupportFilePath}`]],
    ])

    vi.spyOn(browserUtils, 'get').mockResolvedValue(foundBrowsers as any)
    vi.spyOn(browserUtils, 'removeOldProfiles').mockResolvedValue(undefined as any)

    vi.spyOn(fsUtil, 'access').mockImplementation(((p) => {
      return accessiblePaths.has(p) ? Promise.resolve() : undefined
    }) as any)

    vi.spyOn(process, 'chdir').mockImplementation(() => undefined)
    vi.spyOn(fs, 'statSync').mockImplementation(((p) => {
      return directoryPaths.has(p) ? { isDirectory: () => true } : undefined
    }) as any)

    vi.spyOn(fsExtra, 'pathExists').mockImplementation(((p) => {
      return existingPaths.has(p) ? Promise.resolve(true) : undefined
    }) as any)

    // mock the project config IPC loadConfig to avoid communicating over sub processes, which will not work here since we are mocking the directory
    vi.spyOn(ProjectConfigIpc.prototype, 'loadConfig').mockImplementation(() => {
      return Promise.resolve({
        requires: [],
        initialConfig: '{}',
      } as any)
    })

    vi.spyOn(FileDataSource.prototype, 'getFilesByGlob').mockImplementation(((cwd, glob) => {
      const result = globResults.get(`${cwd}|${glob}`)

      return result ? Promise.resolve(result) : undefined
    }) as any)

    ctx = getCtx()

    ctx.coreData.machineBrowsers = Promise.resolve(foundBrowsers)
    ctx.project._specs = specs

    // mock the websocket connection
    testGlobals.CY_TEST_MOCK = {
      waitForSocketConnection: true,
      listenForProjectEnd: { stats: { failures: 0 } },
    }
  })

  afterEach(async () => {
    delete testGlobals.CY_TEST_MOCK

    await getCtx()._reset()
    await clearCtx()
    vi.restoreAllMocks()

    nock.cleanAll()
    nock.enableNetConnect()

    process.env = _.clone(originalEnv)
  })

  it('recovers when the browser is closed unexpectedly by not sending "shouldLaunchNewTab" on newly created browser instances (creates the CRI client in the actual implementation)', async () => {
    let launchAttemptOfBarSpec = 0

    vi.spyOn(OpenProject.prototype, 'launch').mockImplementation(((_browser, spec, browserOpts) => {
      switch (spec as unknown as string) {
        case 'foo.cy.ts':
          // should be a fresh launch of the browser, so shouldLaunchNewTab should be false
          expect(browserOpts.shouldLaunchNewTab).toBe(false)
          // pass the first spec

          return Promise.resolve()
        case 'bar.cy.ts':
          launchAttemptOfBarSpec++
          if (launchAttemptOfBarSpec === 1) {
            // we are on our first launch of the browser. We are going to mock
            // the browser unexpectedly closing out of our control
            expect(ctx.coreData.didBrowserPreviouslyHaveUnexpectedExit).toBe(false)
            // since this is not the first spec launched in the browser, we should launch with a new tab and NOT a new browser instance
            expect(browserOpts.shouldLaunchNewTab).toBe(true)

            // mock unexpected close of browser in second spec
            // return nothing as this promise should never resolve
            ctx.coreData.didBrowserPreviouslyHaveUnexpectedExit = true

            return new Promise(((resolve) => {
              // never resolves as we are mocking the browser unexpectedly closing
            }))
          }

          // assume we are second launch attempt or later. We should have detected that the browser
          // previously exited and that we need to recreate everything related to the instance, so
          // shouldLaunchNewTab should be false
          expect(ctx.coreData.didBrowserPreviouslyHaveUnexpectedExit).toBe(false)
          expect(browserOpts.shouldLaunchNewTab).toBe(false)

          return Promise.resolve()
        case 'baz.cy.ts':
          return Promise.resolve()
        default:
          return Promise.resolve()
      }
    }) as any)

    await run(options, Promise.resolve())
  })

  it('reuses the browsers the data context detected instead of detecting them again', async () => {
    vi.spyOn(OpenProject.prototype, 'launch').mockResolvedValue(undefined as any)

    await run(options, Promise.resolve())

    expect(browserUtils.get).not.toHaveBeenCalled()
  })

  it('falls back to cwd when projectRoot is unset', async () => {
    const fallbackRoot = '/path/to/cwd/fallback'
    const mockedRelativeSupportFilePath = 'cypress/support/e2e.js'

    options = {
      ...options,
      projectRoot: undefined,
      cwd: fallbackRoot,
    }

    accessiblePaths.add(fallbackRoot)
    directoryPaths.add(fallbackRoot)
    existingPaths.add(`${fallbackRoot}/${mockedRelativeSupportFilePath}`)
    globResults.set(`${fallbackRoot}|cypress/support/e2e.{js,jsx,ts,tsx}`, [`${fallbackRoot}/${mockedRelativeSupportFilePath}`])

    vi.spyOn(OpenProject.prototype, 'launch').mockResolvedValue(undefined as any)

    await run(options, Promise.resolve())

    expect(vi.mocked(fsUtil.access).mock.calls.some(([p]) => p === fallbackRoot)).toBe(true)
  })

  it('completes successfully when no specs are found and passWithNoTests is true', async () => {
    specs = []
    ctx.project._specs = []
    options = { ...options, spec: [], passWithNoTests: true }

    const result = await run(options, Promise.resolve())

    expect(Object.prototype.toString.call(result)).toBe('[object Object]')
  })

  it('retries launching the browser when FIREFOX_COULD_NOT_CONNECT is thrown', async () => {
    let launchAttempt = 0

    vi.spyOn(OpenProject.prototype, 'launch').mockImplementation(((_browser, _spec, _browserOpts) => {
      launchAttempt++

      // Reject the first launch with FIREFOX_COULD_NOT_CONNECT to simulate the
      // transient BiDi-not-ready failure. Subsequent attempts succeed so the
      // retry path can complete.
      if (launchAttempt === 1) {
        return Promise.reject(errors.get('FIREFOX_COULD_NOT_CONNECT', new Error('No connection to WebDriver Bidi was established')))
      }

      return Promise.resolve()
    }) as any)

    await run(options, Promise.resolve())

    // Initial launch + retry for the first spec, then a successful launch per
    // remaining spec — assert we retried at least once past the initial failure.
    expect(launchAttempt).toBeGreaterThan(1)
  })

  // like the real listenForProjectEnd, the first spec doesn't end until it exits early
  function endFirstSpecOnEarlyExit (launches: unknown[]) {
    const firstSpecEnded = Promise.withResolvers<unknown>()
    const exitEarly = EarlyExitTerminator.prototype.exitEarly

    vi.spyOn(EarlyExitTerminator.prototype, 'exitEarly').mockImplementation(function (this: EarlyExitTerminator, err) {
      exitEarly.call(this, err)
      firstSpecEnded.resolve({ stats: { failures: 1 } })
    })

    // each spec's results are read before that spec launches
    Object.defineProperty(testGlobals.CY_TEST_MOCK, 'listenForProjectEnd', {
      get: () => launches.length === 0 ? firstSpecEnded.promise : { stats: { failures: 0 } },
    })
  }

  it('launches a fresh browser for the next spec when the browser never connected', async () => {
    const launches: { spec: string, shouldLaunchNewTab: boolean }[] = []

    endFirstSpecOnEarlyExit(launches)

    vi.spyOn(OpenProject.prototype, 'launch').mockImplementation(((_browser, spec, browserOpts) => {
      launches.push({ spec: spec as unknown as string, shouldLaunchNewTab: browserOpts.shouldLaunchNewTab })

      if (spec as unknown as string === 'foo.cy.ts') {
        return Promise.reject(errors.get('FIREFOX_COULD_NOT_CONNECT', new Error('No connection to WebDriver Bidi was established')))
      }

      return Promise.resolve()
    }) as any)

    await run(options, Promise.resolve())

    expect(launches.filter(({ spec }) => spec === 'foo.cy.ts')).toHaveLength(3)
    expect(launches.find(({ spec }) => spec === 'bar.cy.ts')?.shouldLaunchNewTab).toBe(false)
    expect(launches.find(({ spec }) => spec === 'baz.cy.ts')?.shouldLaunchNewTab).toBe(true)
  })

  it('launches a fresh browser for the next spec when the browser crashed', async () => {
    const launches: { spec: string, shouldLaunchNewTab: boolean }[] = []

    endFirstSpecOnEarlyExit(launches)

    vi.spyOn(OpenProject.prototype, 'launch').mockImplementation(((_browser, spec, browserOpts) => {
      launches.push({ spec: spec as unknown as string, shouldLaunchNewTab: browserOpts.shouldLaunchNewTab })

      if (spec as unknown as string === 'foo.cy.ts') {
        browserOpts.onError(errors.get('BROWSER_CRASHED', 'Edge', null, 'SIGTRAP'))
      }

      return Promise.resolve()
    }) as any)

    await run(options, Promise.resolve())

    expect(launches.find(({ spec }) => spec === 'bar.cy.ts')?.shouldLaunchNewTab).toBe(false)
    expect(launches.find(({ spec }) => spec === 'baz.cy.ts')?.shouldLaunchNewTab).toBe(true)
  })

  describe('experimentalSingleTabRunMode', () => {
    // In single-tab run mode the browser tab is intentionally kept open between
    // specs, so the default per-tab teardown (which closes the tab and then calls
    // project.server.reset()) is skipped. We still need to reset the server's
    // network/proxy state between specs so it does not leak across specs and cause
    // rare, order-dependent failures. See cypress-io/cypress#24146.
    beforeEach(() => {
      const componentSupportFile = `${options.projectRoot}/cypress/support/component.js`

      // component testing resolves the component support file (not the e2e one)
      globResults.set(`${options.projectRoot}|cypress/support/component.{js,jsx,ts,tsx}`, [componentSupportFile])

      // config resolves the support file by checking that it exists on disk
      existingPaths.add(componentSupportFile)

      // load a component testing config
      vi.mocked(ProjectConfigIpc.prototype.loadConfig).mockImplementation(() => {
        return Promise.resolve({
          requires: [],
          initialConfig: JSON.stringify({
            component: {
              specPattern: '**/*.cy.ts',
            },
          }),
        } as any)
      })

      // enable experimentalSingleTabRunMode on the resolved config the run reads from
      const realGetConfig = ProjectBase.prototype.getConfig

      vi.spyOn(ProjectBase.prototype, 'getConfig').mockImplementation(function (this: ProjectBase) {
        const config = realGetConfig.call(this)

        config.experimentalSingleTabRunMode = true

        return config
      })

      // component testing starts a dev server to derive config.baseUrl; stub it so the
      // run can proceed without standing up a real bundler/dev server
      vi.spyOn(devServer, 'start').mockResolvedValue({ port: 1234, close: () => {} } as any)

      // component testing requires config.baseUrl (normally the dev server URL). Inject
      // one into the config the server opens with, and skip the live connectivity check
      // so the real server can open in the harness without a listening dev server.
      vi.spyOn(ServerBase.prototype as any, '_retryBaseUrlCheck').mockResolvedValue(undefined)
      const realServerOpen = ServerBase.prototype.open

      vi.spyOn(ServerBase.prototype, 'open').mockImplementation(function (this: ServerBase<any>, config, openOptions) {
        config.baseUrl = config.baseUrl || 'http://localhost:1234'

        return realServerOpen.call(this, config, openOptions)
      })

      // we're exercising the per-spec teardown (waitForTestsToFinishRunning), not the
      // browser connection, so short-circuit waiting for the browser to connect
      testGlobals.CY_TEST_MOCK!.waitForBrowserToConnect = true
    })

    it('resets server network state between specs so state does not leak across the shared tab', async () => {
      // record the order of teardown operations across the spec run so we can assert
      // that a server reset happens between specs (not only on the final spec)
      const teardownOrder: string[] = []

      vi.spyOn(ServerBase.prototype, 'destroyAut').mockImplementation(() => {
        teardownOrder.push('destroyAut')

        return Promise.resolve()
      })

      vi.spyOn(ServerBase.prototype, 'reset').mockImplementation(() => {
        teardownOrder.push('reset')
      })

      options = { ...options, testingType: 'component' }

      await run(options, Promise.resolve())

      // 3 specs run in a single tab: the AUT is destroyed after each of the 2
      // non-last specs (the last spec closes the tab instead)
      expect(teardownOrder.filter((op) => op === 'destroyAut'), 'AUT destroyed after each non-last spec').toHaveLength(2)

      // the server is reset after every spec, including *between* specs. Before the
      // fix, single-tab mode skipped the reset between specs, so reset only ran once
      // (on the final spec) and this ordering would instead be:
      //   ['destroyAut', 'destroyAut', 'reset']
      expect(teardownOrder.slice(0, 4), 'server reset runs between specs in single-tab mode').toStrictEqual([
        'destroyAut',
        'reset',
        'destroyAut',
        'reset',
      ])
    })
  })
})
