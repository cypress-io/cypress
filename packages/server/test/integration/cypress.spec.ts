/* eslint-disable no-console */
import _ from 'lodash'
import path from 'path'
import EE from 'events'
import http from 'http'
import nock from 'nock'
import Bluebird from 'bluebird'
import electron from 'electron'
import { createRequire } from 'module'
import { stripVTControlCharacters as stripAnsi } from 'util'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import commitInfo from '../../lib/util/commit-info'
import Fixtures from '@tooling/system-tests'
import { normalizeStdout } from '@tooling/system-tests/lib/normalizeStdout'
import pkg from '@packages/root'
import * as detect from '@packages/launcher/lib/detect'
import * as launch from '@packages/launcher/lib/browsers'
import * as extension from '@packages/extension'
import { validation as v } from '@packages/config'
import * as argsUtil from '../../lib/util/args'
import { fs } from '../../lib/util/fs'
import * as ciProvider from '../../lib/util/ci_provider'
import * as settings from '../../lib/util/settings'
import * as Windows from '../../lib/gui/windows'
import interactiveMode from '../../lib/modes/interactive'
import modes from '../../lib/modes'
import * as runMode from '../../lib/modes/run'
import smokeTestMode from '../../lib/modes/smoke_test'
import pkgMode from '../../lib/modes/pkg'
import api from '../../lib/cloud/api'
import { getCwd as cwd } from '../../lib/cwd'
import user from '../../lib/cloud/user'
import { cache } from '../../lib/cache'
import * as errors from '../../lib/errors'
import errorsPkg from '@packages/errors'
import cypress from '../../lib/cypress'
import { ProjectBase } from '../../lib/project-base'
import { ServerBase } from '../../lib/server-base'
import * as reporter from '../../lib/reporter'
import browsers from '../../lib/browsers'
import * as videoCapture from '../../lib/video_capture'
import browserUtils from '../../lib/browsers/utils'
import chromeBrowser from '../../lib/browsers/chrome'
import electronBrowser from '../../lib/browsers/electron'
import { openProject } from '../../lib/open_project'
import * as env from '../../lib/util/env'
import * as system from '../../lib/util/system'
import * as appData from '../../lib/util/app_data'
import * as electronApp from '../../lib/util/electron-app'
import * as savedState from '../../lib/saved_state'
import { getCtx, clearCtx, setCtx, makeDataContext } from '../../lib/makeDataContext'
import { BrowserCriClient } from '../../lib/browsers/browser-cri-client'
import { cloudRecommendationMessage } from '../../lib/util/print-run'
import { GracefulExit } from '../../lib/util/graceful-exit'

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

// The snapshots are recorded at the 100 columns a CI host reports.
vi.mock('../../lib/util/terminal-size', () => {
  return { get: () => ({ columns: 100, rows: 24 }) }
})

vi.mock('electron', async () => {
  const { default: electronStub } = await import('../support/helpers/electron_stub')

  return { ...electronStub, default: electronStub }
})

const { Reporter } = reporter

// `GracefulExit.resetForTesting` refuses to clear its singleton without this.
const testGlobals = globalThis as { IS_TEST?: boolean, CY_TEST_MOCK?: Record<string, any> }

testGlobals.IS_TEST = true

const originalEnv = _.clone(process.env)

// lib/cypress.ts, lib/modes/index.ts, lib/modes/run.ts, lib/project-base.ts and
// lib/browsers/index.ts load these with bare `require()`s, which bypass vite's module
// graph; point them at the instances this spec spies on.
const requireCjs = createRequire(import.meta.url)
const requireFromLib = createRequire(requireCjs.resolve('../../lib/cypress'))
let seededModulePaths: string[] = []

const seedRequireCache = () => {
  const seeded: [string, unknown][] = [
    ['./errors', errors],
    ['./modes', modes],
    ['./modes/run', runMode],
    ['./modes/interactive', interactiveMode],
    ['./modes/smoke_test', smokeTestMode],
    ['./modes/pkg', pkgMode],
    ['./reporter', reporter],
    ['./browsers/chrome', chromeBrowser],
    ['./browsers/electron', electronBrowser],
    ['electron', electron],
  ]

  seededModulePaths = seeded.map(([specifier, moduleExports]) => {
    const modulePath = requireFromLib.resolve(specifier)

    requireCjs.cache[modulePath] = { exports: moduleExports, loaded: true } as unknown as NodeModule

    return modulePath
  })
}

// A top-level string matches as a substring, objects match the listed keys recursively,
// asymmetric matchers apply, anything else (nested strings included) is deep-equal.
const argMatches = (expectation: unknown, actual: unknown, nested = false): boolean => {
  if (expectation && typeof (expectation as any).asymmetricMatch === 'function') {
    return (expectation as any).asymmetricMatch(actual)
  }

  if (typeof expectation === 'string' && !nested) {
    return typeof actual === 'string' && actual.includes(expectation)
  }

  if (expectation && typeof expectation === 'object') {
    if (!actual || typeof actual !== 'object') {
      return false
    }

    return Object.keys(expectation).every((key) => argMatches(expectation[key], actual[key], true))
  }

  return _.isEqual(expectation, actual)
}

const calledWithMatch = (spy: unknown, ...expectations: unknown[]) => {
  return (spy as Mock).mock.calls.some((args) => {
    return expectations.every((expectation, i) => argMatches(expectation, args[i]))
  })
}

// Leading arguments must be deep-equal; trailing ones are ignored, since callers append optional args.
const calledWith = (spy: unknown, ...expected: unknown[]) => {
  return (spy as Mock).mock.calls.some((args) => {
    return expected.every((value, i) => _.isEqual(value, args[i]))
  })
}

const TYPICAL_BROWSERS = [
  {
    name: 'chrome',
    family: 'chromium',
    channel: 'stable',
    displayName: 'Chrome',
    version: '60.0.3112.101',
    path: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    majorVersion: '60',
  }, {
    name: 'chromium',
    family: 'chromium',
    channel: 'stable',
    displayName: 'Chromium',
    version: '49.0.2609.0',
    path: '/Users/bmann/Downloads/chrome-mac/Chromium.app/Contents/MacOS/Chromium',
    majorVersion: '49',
  }, {
    name: 'chrome',
    family: 'chromium',
    channel: 'canary',
    displayName: 'Canary',
    version: '62.0.3197.0',
    path: '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    majorVersion: '62',
  },
]

const ELECTRON_BROWSER = {
  name: 'electron',
  family: 'chromium',
  displayName: 'Electron',
  path: '',
  version: '99.101.1234',
  majorVersion: 99,
}

const previousCwd = process.cwd()

const processVersionsDescriptor = Object.getOwnPropertyDescriptor(process, 'versions')!

const consoleLog = () => console.log as unknown as Mock

const snapshotConsoleLogs = function () {
  const args = _
  .chain(consoleLog().mock.calls)
  .map((innerArgs) => {
    return innerArgs.join(' ')
  }).join('\n')
  .value()

  // our cwd() is currently the project
  // so must switch back to original
  process.chdir(previousCwd)

  const snap = normalizeStdout(stripAnsi(args))

  expect(snap).toMatchSnapshot()
}

function mockEE () {
  const ee = new EE() as any

  ee.kill = () => {
    // ughh, would be nice to test logic inside the launcher
    // that cleans up after the browser exit
    // like calling client.close() if available to let the
    // browser free any resources
    return ee.emit('exit')
  }

  ee.destroy = () => {
    return ee.emit('closed')
  }

  ee.isDestroyed = () => {
    return false
  }

  ee.loadURL = () => {}
  ee.focusOnWebView = () => {}
  ee.webContents = {
    getOSProcessId: vi.fn(),
    setUserAgent: vi.fn(),
    on: vi.fn(),
    session: {
      clearCache: vi.fn(() => Promise.resolve()),
      clearStorageData: vi.fn(() => Promise.resolve()),
      setProxy: vi.fn(() => Promise.resolve()),
      setUserAgent: vi.fn(),
      on: vi.fn(),
      removeListener: vi.fn(),
      webRequest: {
        onBeforeSendHeaders () {},
      },
    },
  }

  ee.maximize = vi.fn()
  ee.setSize = vi.fn()

  return ee
}

// Only 'ready' listeners are called, on the next tick
const stubAppReady = () => {
  vi.spyOn(electron.app, 'on').mockImplementation(((event, listener) => {
    if (event === 'ready') {
      process.nextTick(listener)
    }
  }) as any)
}

/**
 * `cypress.start` resolves only after graceful exit runs `clearCtx`, so
 * `openProject.getProject()` is null in a `.then` on that promise.
 * Register assertions that need `cfg` / `ProjectBase` in `assertWhileOpen`; it runs
 * when `openProject` emits `ready` (project fully opened), before the run finishes and exit runs.
 */
async function assertWithOpenProjectAfterReady (startPromise: Promise<unknown>, assertWhileOpen: (project: ProjectBase) => void | Promise<void>) {
  const whenReady = new Promise<void>((resolve, reject) => {
    openProject.once('ready', () => {
      Promise.resolve(assertWhileOpen(openProject.getProject()!))
      .then(resolve)
      .catch(reject)
    })
  })

  await Promise.all([whenReady, startPromise])
}

let ctx

describe('lib/cypress', () => {
  let todosPath: string
  let pristinePath: string
  let noScaffolding: string
  let recordPath: string
  let pluginConfig: string
  let pluginBrowser: string
  let idsPath: string

  const expectExitWith = (code: number) => {
    expect(calledWith(process.exit, code)).toBe(true)
  }

  // returns error object
  const expectExitWithErr = (type: string, msg1?: string, msg2?: string) => {
    expect(calledWithMatch(errors.log, { type }), 'error was logged').toBe(true)
    expect(calledWith(process.exit, 1), 'process.exit was called').toBe(true)

    const err = vi.mocked(errors.log).mock.calls[0][0] as any

    if (msg1) {
      expect(stripAnsi(err.message), 'error text').toContain(msg1)
    }

    if (msg2) {
      expect(stripAnsi(err.message), 'second error text').toContain(msg2)
    }

    return err
  }

  beforeAll(() => {
    seedRequireCache()
  })

  afterAll(() => {
    for (const modulePath of seededModulePaths) {
      delete requireCjs.cache[modulePath]
    }
  })

  beforeEach(async () => {
    GracefulExit.resetForTesting()
    await clearCtx()
    setCtx(makeDataContext({} as Parameters<typeof makeDataContext>[0]))

    nock.disableNetConnect()
    nock.enableNetConnect(/localhost/)

    ctx = getCtx()
    process.chdir(previousCwd)

    await cache.remove()

    Fixtures.scaffold()
    todosPath = Fixtures.projectPath('todos')
    pristinePath = Fixtures.projectPath('pristine')
    noScaffolding = Fixtures.projectPath('no-scaffolding')
    recordPath = Fixtures.projectPath('record')
    pluginConfig = Fixtures.projectPath('plugin-config')
    pluginBrowser = Fixtures.projectPath('plugin-browser')
    idsPath = Fixtures.projectPath('ids')

    // force cypress to call directly into main without
    // spawning a separate process
    vi.spyOn(videoCapture, 'start').mockResolvedValue({} as any)
    vi.spyOn(electronApp, 'isRunning').mockReturnValue(true)
    vi.spyOn(extension, 'setHostAndPath').mockResolvedValue(undefined as any)
    vi.spyOn(detect, 'detect').mockImplementation((() => Bluebird.resolve([...TYPICAL_BROWSERS])) as any)
    vi.spyOn(process, 'exit').mockImplementation((() => undefined) as any)
    vi.spyOn(ServerBase.prototype, 'reset').mockImplementation(() => undefined)
    const originalWarning = errorsPkg.warning

    vi.spyOn(errorsPkg, 'warning').mockImplementation(((type, ...args) => {
      if (type === 'INVOKED_BINARY_OUTSIDE_NPM_MODULE') {
        return null
      }

      return originalWarning(type, ...args)
    }) as any)

    vi.spyOn(errors, 'warning').mockImplementation(((type, ...args) => errorsPkg.warning(type, ...args)) as any)

    vi.spyOn(errors, 'log')
    vi.spyOn(errors, 'logException')
    vi.spyOn(console, 'log')

    // to make sure our Electron browser mock object passes validation during tests
    Object.defineProperty(process, 'versions', {
      ...processVersionsDescriptor,
      value: {
        ...processVersionsDescriptor.value,
        chrome: ELECTRON_BROWSER.version,
        electron: '123.45.6789',
      },
    })
  })

  afterEach(async () => {
    try {
      // make sure every project
      // we spawn is closed down
      await openProject.close()
    } catch (e) {
      // ...
    }

    Fixtures.remove()
    delete testGlobals.CY_TEST_MOCK

    try {
      await getCtx()._reset()
    } catch (e) {
      console.error('CAUGHT ERROR calling ctx._reset:', e)
    }
    await clearCtx()

    Object.defineProperty(process, 'versions', processVersionsDescriptor)
    vi.restoreAllMocks()

    nock.cleanAll()
    nock.enableNetConnect()

    process.env = _.clone(originalEnv)
  })

  describe('test browsers', () => {
    // sanity checks to make sure the browser objects we pass during tests
    // all pass the internal validation function
    it('has valid browsers', () => {
      expect(v.isValidBrowserList('browsers', TYPICAL_BROWSERS)).toBe(true)
    })

    it('has valid electron browser', () => {
      expect(v.isValidBrowserList('browsers', [ELECTRON_BROWSER])).toBe(true)
    })

    it('allows browser major to be a number', () => {
      const browser = {
        name: 'Edge Beta',
        family: 'chromium',
        displayName: 'Edge Beta',
        version: '80.0.328.2',
        path: '/some/path',
        majorVersion: 80,
      }

      expect(v.isValidBrowserList('browsers', [browser])).toBe(true)
    })

    it('validates returned list', () => {
      return browserUtils.getBrowsers().then((list) => {
        expect(v.isValidBrowserList('browsers', list)).toBe(true)
      })
    })
  })

  describe('error handling', () => {
    it('exits if config cannot be parsed', () => {
      return cypress.start(['--config', 'xyz'])
      .then(() => {
        const err = expectExitWithErr('COULD_NOT_PARSE_ARGUMENTS')

        expect(stripAnsi(err.message)).toMatchSnapshot()
      })
    })

    it('exits if env cannot be parsed', () => {
      return cypress.start(['--env', 'a123'])
      .then(() => {
        const err = expectExitWithErr('COULD_NOT_PARSE_ARGUMENTS')

        expect(stripAnsi(err.message)).toMatchSnapshot()
      })
    })

    it('exits if reporter options cannot be parsed', () => {
      return cypress.start(['--reporterOptions', 'nonono'])
      .then(() => {
        const err = expectExitWithErr('COULD_NOT_PARSE_ARGUMENTS')

        expect(stripAnsi(err.message)).toMatchSnapshot()
      })
    })
  })

  describe('invalid config', () => {
    beforeEach(async () => {
      const win = {
        on: vi.fn(),
        webContents: {
          on: vi.fn(),
        },
      }

      await clearCtx()
      stubAppReady()
      vi.spyOn(Windows, 'open').mockResolvedValue(win as any)
    })

    it('shows warning if config is not valid', () => {
      return cypress.start(['--config=test=false', '--cwd=/foo/bar'])
      .then(() => {
        expect(calledWith(errors.warning, 'INVALID_CONFIG_OPTION')).toBe(true)
        expect(calledWithMatch(console.log, 'The following configuration option is invalid:')).toBe(true)
        expect(calledWithMatch(console.log, `test`)).toBe(true)
        expect(calledWithMatch(console.log, 'https://on.cypress.io/configuration')).toBe(true)
      })
    })

    it('shows warning when multiple config are not valid', () => {
      return cypress.start(['--config=test=false,foo=bar', '--cwd=/foo/bar'])
      .then(() => {
        expect(calledWith(errors.warning, 'INVALID_CONFIG_OPTION')).toBe(true)
        expect(calledWithMatch(console.log, 'The following configuration options are invalid:')).toBe(true)
        expect(calledWithMatch(console.log, 'test')).toBe(true)
        expect(calledWithMatch(console.log, 'foo')).toBe(true)
        expect(calledWithMatch(console.log, 'https://on.cypress.io/configuration')).toBe(true)

        snapshotConsoleLogs()
      })
    })

    it('does not show warning if config is valid', () => {
      return cypress.start(['--config=trashAssetsBeforeRuns=false'])
      .then(() => {
        expect(calledWith(errors.warning, 'INVALID_CONFIG_OPTION')).toBe(false)
      })
    })
  })

  describe('--run-project', () => {
    beforeEach(async () => {
      await clearCtx()

      stubAppReady()
      testGlobals.CY_TEST_MOCK = {
        waitForSocketConnection: true,
        listenForProjectEnd: { stats: { failures: 0 } },
      }

      vi.spyOn(browsers, 'open').mockImplementation(() => undefined as any)
      vi.spyOn(browsers, 'connectToNewSpec').mockImplementation(() => undefined as any)
      vi.spyOn(commitInfo, 'commitInfo').mockResolvedValue({
        branch: 'test-branch',
        message: 'test message',
        email: 'test@example.com',
        author: 'Test Author',
        sha: 'abc123',
        timestamp: 1234567890,
        remote: 'remoteOrigin',
      } as any)
    })

    describe('cloud recommendation message', () => {
      it('gets logged when in CI and there is a failure', () => {
        const relativePath = path.relative(cwd(), todosPath)

        vi.spyOn(ciProvider, 'getIsCi').mockReturnValue(true)
        delete process.env.CYPRESS_COMMERCIAL_RECOMMENDATIONS
        testGlobals.CY_TEST_MOCK!.listenForProjectEnd = { stats: { failures: 1 } }

        return cypress.start([`--run-project=${todosPath}`, `--spec=${relativePath}/tests/test1.js`]).then(() => {
          expect(calledWith(console.log, cloudRecommendationMessage)).toBe(true)

          snapshotConsoleLogs()
        })
      })

      it('does not get logged if CYPRESS_COMMERCIAL_RECOMMENDATIONS is set to 0', () => {
        const relativePath = path.relative(cwd(), todosPath)

        vi.spyOn(ciProvider, 'getIsCi').mockReturnValue(true)
        process.env.CYPRESS_COMMERCIAL_RECOMMENDATIONS = '0'
        testGlobals.CY_TEST_MOCK!.listenForProjectEnd = { stats: { failures: 1 } }

        return cypress.start([`--run-project=${todosPath}`, `--spec=${relativePath}/tests/test1.js`]).then(() => {
          expect(calledWith(console.log, cloudRecommendationMessage)).toBe(false)
        })
      })

      it('does not get logged if all tests pass', () => {
        const relativePath = path.relative(cwd(), todosPath)

        vi.spyOn(ciProvider, 'getIsCi').mockReturnValue(true)
        delete process.env.CYPRESS_COMMERCIAL_RECOMMENDATIONS
        testGlobals.CY_TEST_MOCK!.listenForProjectEnd = { stats: { failures: 0 } }

        return cypress.start([`--run-project=${todosPath}`, `--spec=${relativePath}/tests/test1.js`]).then(() => {
          expect(calledWith(console.log, cloudRecommendationMessage)).toBe(false)
        })
      })

      it('does not get logged if not running in CI', () => {
        const relativePath = path.relative(cwd(), todosPath)

        vi.spyOn(ciProvider, 'getIsCi').mockReturnValue(undefined as any)
        delete process.env.CYPRESS_COMMERCIAL_RECOMMENDATIONS
        testGlobals.CY_TEST_MOCK!.listenForProjectEnd = { stats: { failures: 1 } }

        return cypress.start([`--run-project=${todosPath}`, `--spec=${relativePath}/tests/test1.js`]).then(() => {
          expect(calledWith(console.log, cloudRecommendationMessage)).toBe(false)
        })
      })
    })

    it('runs project headlessly and exits with exit code 0', () => {
      return cypress.start([`--run-project=${todosPath}`])
      .then(() => {
        expect(calledWithMatch(browsers.open, ELECTRON_BROWSER)).toBe(true)
        expectExitWith(0)
      })
    })

    it('sets --headed false if --headless', () => {
      vi.spyOn(cypress, 'startInMode')

      return cypress.start([`--run-project=${todosPath}`, '--headless'])
      .then(() => {
        expect(calledWithMatch(browsers.open, ELECTRON_BROWSER)).toBe(true)
        expectExitWith(0)

        // check how --headless option sets --headed
        expect(cypress.startInMode).toHaveBeenCalledTimes(1)
        expect(calledWith(cypress.startInMode, 'run')).toBe(true)
        const startInModeOptions = vi.mocked(cypress.startInMode).mock.calls[0][1]

        expect(startInModeOptions).toMatchObject({
          headless: true,
          headed: false,
        })
      })
    })

    it('rejects if both --headed and --headless are true', async () => {
      await expect(
        cypress.start([`--run-project=${todosPath}`, '--headless', '--headed']),
      ).rejects.toThrow('Impossible options: both headless and headed are true')
    })

    describe('strips --', () => {
      beforeEach(() => {
        vi.spyOn(argsUtil, 'toObject')
      })

      it('strips leading', () => {
        return cypress.start(['--', `--run-project=${todosPath}`])
        .then(() => {
          expect(calledWith(argsUtil.toObject, [`--run-project=${todosPath}`])).toBe(true)
          expect(calledWithMatch(browsers.open, ELECTRON_BROWSER)).toBe(true)
          expectExitWith(0)
        })
      })

      it('strips in the middle', () => {
        return cypress.start([`--run-project=${todosPath}`, '--', '--browser=electron'])
        .then(() => {
          expect(calledWith(argsUtil.toObject, [`--run-project=${todosPath}`, '--browser=electron'])).toBe(true)
          expect(calledWithMatch(browsers.open, ELECTRON_BROWSER)).toBe(true)
          expectExitWith(0)
        })
      })
    })

    it('runs project headlessly and exits with exit code 10', () => {
      testGlobals.CY_TEST_MOCK!.runSpecs = { totalFailed: 10 }

      return cypress.start([`--run-project=${todosPath}`])
      .then(() => {
        expectExitWith(10)
      })
    })

    it('exits with code 112 for cloud API failures when posix-exit-codes is enabled', () => {
      // Mock cloud API to fail with a 504 error
      vi.spyOn(api, 'createRun').mockRejectedValue({
        statusCode: 504,
        message: 'Gateway timeout',
      })

      return cypress.start([
        `--run-project=${todosPath}`,
        '--record',
        '--key=test-key',
        '--posix-exit-codes',
      ])
      .then(() => {
        expectExitWith(112)
      })
    })

    it('exits with code 1 for parallel cloud API failures when posix-exit-codes is enabled', () => {
      // Mock cloud API to fail with a 500 error
      vi.spyOn(api, 'createRun').mockRejectedValue({
        statusCode: 500,
        message: 'Cloud service unavailable',
      })

      return cypress.start([
        `--run-project=${todosPath}`,
        '--record',
        '--key=test-key',
        '--parallel',
        '--ci-build-id=test-build-id',
        '--posix-exit-codes',
      ])
      .then(() => {
        expectExitWith(1)
      })
    })

    it('does not add project to the global cache', () => {
      return cache.getProjectRoots()
      .then((projects) => {
        // no projects in the cache
        expect(projects.length).toBe(0)

        return cypress.start([`--run-project=${todosPath}`])
      }).then(() => {
        return cache.getProjectRoots()
      }).then((projects) => {
        // still not projects
        expect(projects.length).toBe(0)
      })
    })

    it('runs project by relative spec and exits with status 0', () => {
      const relativePath = path.relative(cwd(), todosPath)

      return cypress.start([
        `--run-project=${todosPath}`,
        `--spec=${relativePath}/tests/test2.js`,
      ])
      .then(() => {
        expect(calledWithMatch(browsers.open, ELECTRON_BROWSER, {
          url: 'http://localhost:8888/__/#/specs/runner?file=tests/test2.js',
        })).toBe(true)

        expectExitWith(0)
      })
    })

    it('runs project by specific spec with default configuration', () => {
      return cypress.start([`--run-project=${idsPath}`, `--spec=${idsPath}/**/*qux*`, '--config', 'port=2020'])
      .then(() => {
        expect(calledWithMatch(browsers.open, ELECTRON_BROWSER, { url: 'http://localhost:2020/__/#/specs/runner?file=cypress/e2e/qux.cy.js' })).toBe(true)
        expect(browsers.open).toHaveBeenCalledTimes(1)
        expectExitWith(0)
      })
    })

    it('runs project by specific absolute spec and exits with status 0', () => {
      return cypress.start([`--run-project=${todosPath}`, `--spec=${todosPath}/tests/test2.js`])
      .then(() => {
        expect(calledWithMatch(browsers.open, ELECTRON_BROWSER, { url: 'http://localhost:8888/__/#/specs/runner?file=tests/test2.js' })).toBe(true)
        expectExitWith(0)
      })
    })

    it('runs project by limiting spec files via config.e2e.specPattern string glob pattern', () => {
      return cypress.start([`--run-project=${todosPath}`, `--config={"e2e":{"specPattern":"${todosPath}/tests/test2.js"}}`])
      .then(() => {
        expect(calledWithMatch(browsers.open, ELECTRON_BROWSER, { url: 'http://localhost:8888/__/#/specs/runner?file=tests/test2.js' })).toBe(true)
        expectExitWith(0)
      })
    })

    it('runs project by limiting spec files via config.e2e.specPattern as a JSON array of string glob patterns', () => {
      return cypress.start([`--run-project=${todosPath}`, '--config={"e2e":{"specPattern":["**/test2.js","**/test1.js"]}}'])
      .then(() => {
        expect(calledWithMatch(browsers.open, ELECTRON_BROWSER, { url: 'http://localhost:8888/__/#/specs/runner?file=tests/test2.js' })).toBe(true)
      }).then(() => {
        expect(calledWithMatch(browsers.open, ELECTRON_BROWSER, { url: 'http://localhost:8888/__/#/specs/runner?file=tests/test1.js' })).toBe(true)
        expectExitWith(0)
      })
    })

    it('does not scaffold when headless and exits with error when no existing project', () => {
      const ensureDoesNotExist = function (inspection, index) {
        if (!inspection.isRejected()) {
          throw new Error(`File or folder was scaffolded at index: ${index}`)
        }

        expect(inspection.reason()).toHaveProperty('code', 'ENOENT')
      }

      return Bluebird.all([
        fs.statAsync(path.join(pristinePath, 'cypress')).reflect(),
        fs.statAsync(path.join(pristinePath, 'cypress.config.js')).reflect(),
      ])
      .each(ensureDoesNotExist).then(() => {
        return cypress.start([`--run-project=${pristinePath}`])
      }).then(() => {
        return Bluebird.all([
          fs.statAsync(path.join(pristinePath, 'cypress')).reflect(),
          fs.statAsync(path.join(pristinePath, 'cypress.config.js')).reflect(),
        ])
      })
    })

    it('runs project headed and displays gui', () => {
      return cypress.start([`--run-project=${todosPath}`, '--headed'])
      .then(() => {
        expect(calledWithMatch(browsers.open, ELECTRON_BROWSER, {
          proxyServer: 'http://localhost:8888',
          browser: {
            isHeadless: false,
          },
        })).toBe(true)

        expectExitWith(0)
      })
    })

    it('turns on reporting', () => {
      vi.spyOn(Reporter, 'create')

      return cypress.start([`--run-project=${todosPath}`])
      .then(() => {
        expect(calledWith(Reporter.create, 'spec')).toBe(true)
        expectExitWith(0)
      })
    })

    it('can change the reporter to nyan', () => {
      vi.spyOn(Reporter, 'create')

      return cypress.start([`--run-project=${todosPath}`, '--reporter=nyan'])
      .then(() => {
        expect(calledWith(Reporter.create, 'nyan')).toBe(true)
        expectExitWith(0)
      })
    })

    it('can change the reporter with cypress.config.js', async () => {
      vi.spyOn(Reporter, 'create')

      return cypress.start([`--run-project=${idsPath}`, `--config-file=${idsPath}/cypress.dot-reporter.config.js`])
      .then(() => {
        expect(calledWith(Reporter.create, 'dot')).toBe(true)
        expectExitWith(0)
      })
    })

    it('runs tests even when user isn\'t logged in', () => {
      return user.set({})
      .then(() => {
        return cypress.start([`--run-project=${todosPath}`])
      }).then(() => {
        expectExitWith(0)
      })
    })

    it('logs warning when projectId and key but no record option', () => {
      return cypress.start([`--run-project=${todosPath}`, '--key=asdf'])
      .then(() => {
        expect(calledWith(errors.warning, 'PROJECT_ID_AND_KEY_BUT_MISSING_RECORD_OPTION', 'abc123')).toBe(true)
        expect(calledWithMatch(console.log, 'You also provided your Record Key, but you did not pass the')).toBe(true)
        expect(calledWithMatch(console.log, 'cypress run --record')).toBe(true)
        expect(calledWithMatch(console.log, 'https://on.cypress.io/recording-project-runs')).toBe(true)
      })
    })

    it('logs warning when removing old browser profiles fails', () => {
      const err = new Error('foo')

      vi.spyOn(browsers, 'removeOldProfiles').mockRejectedValue(err)

      return cypress.start([`--run-project=${todosPath}`])
      .then(() => {
        expect(calledWith(errors.warning, 'CANNOT_REMOVE_OLD_BROWSER_PROFILES', err)).toBe(true)
        expect(calledWithMatch(console.log, 'Warning: We failed to remove old browser profiles from previous runs.')).toBe(true)
        expect(calledWithMatch(console.log, err.message)).toBe(true)
      })
    })

    it('does not log warning when no projectId', () => {
      return cypress.start([`--run-project=${pristinePath}`, '--key=asdf'])
      .then(() => {
        expect(calledWith(errors.warning, 'PROJECT_ID_AND_KEY_BUT_MISSING_RECORD_OPTION', 'abc123')).toBe(false)
        expect(calledWithMatch(console.log, 'cypress run --key <record_key>')).toBe(false)
      })
    })

    it('does not log warning when projectId but --record false', () => {
      return cypress.start([`--run-project=${todosPath}`, '--key=asdf', '--record=false'])
      .then(() => {
        expect(calledWith(errors.warning, 'PROJECT_ID_AND_KEY_BUT_MISSING_RECORD_OPTION', 'abc123')).toBe(false)
        expect(calledWithMatch(console.log, 'cypress run --key <record_key>')).toBe(false)
      })
    })

    it(`logs error when supportFile doesn't exist`, () => {
      return settings.writeForTesting(idsPath, { e2e: { supportFile: '/does/not/exist' } })
      .then(() => {
        return cypress.start([`--run-project=${idsPath}`])
      })
      .then(() => {
        expectExitWithErr('SUPPORT_FILE_NOT_FOUND', `Your supportFile is missing or invalid: /does/not/exist`)
      })
    })

    it('logs error when browser cannot be found', () => {
      vi.mocked(browsers.open).mockRestore()

      return cypress.start([`--run-project=${idsPath}`, '--browser=foo'])
      .then(() => {
        expectExitWithErr('BROWSER_NOT_FOUND_BY_NAME')

        // get all the error args
        const argsSet = vi.mocked(errors.log).mock.calls

        const found1 = _.find(argsSet, (args) => {
          return _.find(args, (arg: any) => {
            return arg.message && stripAnsi(arg.message).includes(
              `Browser: foo was not found on your system or is not supported by Cypress.`,
            )
          })
        })

        expect(found1, `foo should not be found`).toBeTruthy()

        const found2 = _.find(argsSet, (args) => {
          return _.find(args, (arg: any) => {
            return arg.message && stripAnsi(arg.message).includes(
              'Cypress supports the following browsers:',
            )
          })
        })

        expect(found2, 'supported browsers should be listed').toBeTruthy()

        const found3 = _.find(argsSet, (args) => {
          return _.find(args, (arg: any) => {
            return arg.message && stripAnsi(arg.message).includes(
              'Available browsers found on your system are:\n - chrome\n - chromium\n - chrome:canary\n - electron',
            )
          })
        })

        expect(found3, 'browser names should be listed').toBeTruthy()
      })
    })

    describe('no specs found', () => {
      it('logs error and exits when spec file was specified and does not exist', () => {
        const cwd = process.cwd()

        return cypress.start([
          `--cwd=${cwd}`,
          `--run-project=${todosPath}`,
          '--spec=path/to/spec',
        ])
        .then(() => {
          // includes the search spec
          expectExitWithErr('NO_SPECS_FOUND', 'We searched for specs matching this glob pattern:')
          // includes the project path
          expectExitWithErr('NO_SPECS_FOUND', path.join(cwd, 'path/to/spec'))
        })
      })

      it('logs error and exits when spec file was specified and does not exist using ../ pattern', () => {
        const cwd = process.cwd()

        return cypress.start([
          `--cwd=${cwd}`,
          `--run-project=${todosPath}`,
          '--spec=../path/to/spec',
        ])
        .then(() => {
          // includes the search spec
          expectExitWithErr('NO_SPECS_FOUND', 'We searched for specs matching this glob pattern:')
          // includes the project path
          expectExitWithErr('NO_SPECS_FOUND', path.join(cwd, '../path/to/spec'))
        })
      })

      it('logs error and exits when spec file was specified with glob and does not exist using ../ pattern', () => {
        const cwd = process.cwd()

        return cypress.start([
          `--cwd=${cwd}`,
          `--run-project=${todosPath}`,
          '--spec=../path/to/**/*',
        ])
        .then(() => {
          // includes the search spec
          expectExitWithErr('NO_SPECS_FOUND', 'We searched for specs matching this glob pattern:')
          // includes the project path
          expectExitWithErr('NO_SPECS_FOUND', path.join(cwd, '../path/to/**/*'))
        })
      })

      it('logs error and exits when spec absolute file was specified and does not exist', () => {
        return cypress.start([
          `--run-project=${todosPath}`,
          `--spec=/path/to/spec`,
        ])
        .then(() => {
          // includes folder name + path to the spec
          const err = expectExitWithErr('NO_SPECS_FOUND', `/path/to/spec`)

          expect(stripAnsi(err.message)).not.toContain(todosPath)
        })
      })

      it('logs error and exits when no specs were found at all', () => {
        return cypress.start([
          `--run-project=${todosPath}`,
          '--spec=/this/does/not/exist/**/*',
        ])
        .then(() => {
          expectExitWithErr('NO_SPECS_FOUND', 'We searched for specs matching this glob pattern')
          expectExitWithErr('NO_SPECS_FOUND', 'this/does/not/exist/**/*')
        })
      })
    })

    it('logs error and exits when project has cypress.config.js syntax error', () => {
      return fs.writeFileAsync(`${todosPath}/cypress.config.js`, `module.exports = {`)
      .then(() => {
        return cypress.start([`--run-project=${todosPath}`])
      }).then(() => {
        expectExitWithErr('CONFIG_FILE_REQUIRE_ERROR', todosPath)
      })
    })

    it('logs error and exits when project has cypress.env.json syntax error', () => {
      return fs.writeFileAsync(`${todosPath}/cypress.env.json`, '{\'foo\': \'bar}')
      .then(() => {
        return cypress.start([`--run-project=${todosPath}`])
      }).then(() => {
        expectExitWithErr('ERROR_READING_FILE', todosPath)
      })
    })

    it('logs error and exits when project has invalid cypress.config.js values', () => {
      return settings.writeForTesting(todosPath, { baseUrl: 'localhost:9999' })
      .then(() => {
        return cypress.start([`--run-project=${todosPath}`])
      }).then(() => {
        expectExitWithErr('CONFIG_VALIDATION_ERROR', 'cypress.config.js')
      })
    })

    it('logs error and exits when project has invalid config values from the CLI', () => {
      return cypress.start([
        `--run-project=${todosPath}`,
        '--config=baseUrl=localhost:9999',
      ])
      .then(() => {
        expectExitWithErr('CONFIG_VALIDATION_ERROR', 'localhost:9999')
        expectExitWithErr('CONFIG_VALIDATION_ERROR', 'An invalid configuration value was set.')
      })
    })

    it('logs error and exits when project has invalid config values from env vars', () => {
      process.env.CYPRESS_BASE_URL = 'localhost:9999'

      return cypress.start([`--run-project=${todosPath}`])
      .then(() => {
        delete process.env.CYPRESS_BASE_URL
        expectExitWithErr('CONFIG_VALIDATION_ERROR', 'localhost:9999')
        expectExitWithErr('CONFIG_VALIDATION_ERROR', 'An invalid configuration value was set.')
      })
    })

    it('logs warning and continues when CYPRESS_env is set to a non-object value', () => {
      process.env.CYPRESS_env = 'invalid-string'

      return cypress.start([`--run-project=${todosPath}`])
      .then(() => {
        delete process.env.CYPRESS_env
        expect(calledWith(errorsPkg.warning, 'INVALID_CYPRESS_ENV_OVERRIDE', 'env', 'invalid-string')).toBe(true)
        expect(calledWithMatch(console.log, 'CYPRESS_env')).toBe(true)
        expect(calledWithMatch(console.log, 'must be a valid JSON object')).toBe(true)
        expect(calledWithMatch(console.log, '--env')).toBe(true)
        expectExitWith(0)
      })
    })

    // TODO: make sure we have integration tests around this
    // for headed projects!
    // also make sure we test the rest of the integration functionality
    // for headed errors! <-- not unit tests, but integration tests!
    // this test is skipped because its failure causes websocket integration tests to fail.
    // this test should be revisited, as the error it's asserting on probably can never be
    // actually thrown by Cypress.
    // eslint-disable-next-line vitest/no-disabled-tests
    it.skip('logs error and exits when project folder has read permissions only and cannot write cypress.config.js', () => {
      // Root can write all things at all times, and `chmod 555` does not restrict writes on
      // Windows, so this only asserts anything for a non-root POSIX user.
      let euid

      try {
        // `process.geteuid` is absent on Windows and can fail elsewhere
        // @see https://github.com/cypress-io/cypress/issues/17415
        // eslint-disable-next-line no-restricted-properties
        euid = process.geteuid?.()
      } catch {
        euid = undefined
      }

      if (euid === undefined || euid === 0) {
        return
      }

      const permissionsPath = path.resolve('./permissions')
      const cypressConfig = path.join(permissionsPath, 'cypress.config.js')

      return fs.mkdirAsync(permissionsPath)
      .then(() => {
        return fs.outputFileAsync(cypressConfig, 'module.exports = { e2e: { supportFile: false } }')
      }).then(() => {
        // read only
        return fs.chmodAsync(permissionsPath, '555')
      }).then(() => {
        return cypress.start([`--run-project=${permissionsPath}`])
      }).then(() => {
        return fs.chmodAsync(permissionsPath, '777')
      }).then(() => {
        expectExitWithErr('ERROR_WRITING_FILE', permissionsPath)
      }).finally(() => {
        return fs.rmdir(permissionsPath, { recursive: true })
      })
    })

    it('logs error and exits when reporter does not exist', () => {
      return cypress.start([`--run-project=${todosPath}`, '--reporter', 'foobarbaz'])
      .then(() => {
        expectExitWithErr('INVALID_REPORTER_NAME', 'foobarbaz')
      })
    })

    describe('state', () => {
      let statePath: string

      beforeEach(() => {
        return appData.remove()
        .then(() => {
          return savedState.formStatePath(todosPath)
        }).then((statePathStart) => {
          statePath = appData.projectsPath(statePathStart)
        })
      })

      it('does not save project state', () => {
        return assertWithOpenProjectAfterReady(
          cypress.start([`--run-project=${todosPath}`, `--spec=${todosPath}/tests/test2.js`]),
          (project) => {
            // this should not save the project's state
            // because its a noop in 'cypress run' mode
            return project.saveState()
          },
        ).then(() => {
          expectExitWith(0)

          return fs.statAsync(statePath)
          .then(() => {
            throw new Error(`saved state should not exist but it did here: ${statePath}`)
          }).catch({ code: 'ENOENT' }, () => {})
        })
      })
    })

    describe('morgan', () => {
      it('sets morgan to false', () => {
        return assertWithOpenProjectAfterReady(
          cypress.start([`--run-project=${todosPath}`]),
          (project) => {
            expect(project.cfg.morgan).toBe(false)
          },
        ).then(() => {
          expectExitWith(0)
        })
      })
    })

    describe('config overrides', () => {
      beforeEach(() => {
        delete process.env.CYPRESS_COMMERCIAL_RECOMMENDATIONS
      })

      it('can override default values', () => {
        return assertWithOpenProjectAfterReady(
          cypress.start([`--run-project=${todosPath}`, '--config=requestTimeout=1234,videoCompression=true']),
          (project) => {
            const { cfg } = project as any

            expect(cfg.videoCompression).toBe(true)
            expect(cfg.requestTimeout).toBe(1234)

            expect(cfg.resolved.videoCompression).toStrictEqual({
              value: true,
              from: 'cli',
            })

            expect(cfg.resolved.requestTimeout).toStrictEqual({
              value: 1234,
              from: 'cli',
            })
          },
        ).then(() => {
          expectExitWith(0)
        })
      })

      it('can override values in plugins', () => {
        return assertWithOpenProjectAfterReady(
          cypress.start([
            `--run-project=${pluginConfig}`, '--config=requestTimeout=1234,videoCompression=true',
            '--env=foo=foo,bar=bar',
          ]),
          (project) => {
            const { cfg } = project as any

            expect(cfg.videoCompression).toBe(20)
            expect(cfg.defaultCommandTimeout).toBe(500)
            expect(cfg.env).toStrictEqual({
              foo: 'bar',
              bar: 'bar',
            })

            expect(cfg.resolved.videoCompression).toStrictEqual({
              value: 20,
              from: 'plugin',
            })

            expect(cfg.resolved.requestTimeout).toStrictEqual({
              value: 1234,
              from: 'cli',
            })

            expect(cfg.resolved.env.foo).toStrictEqual({
              value: 'bar',
              from: 'plugin',
            })

            expect(cfg.resolved.env.bar).toStrictEqual({
              value: 'bar',
              from: 'cli',
            })
          },
        ).then(() => {
          expectExitWith(0)
        })
      })
    })

    describe('plugins', () => {
      beforeEach(() => {
        vi.mocked(browsers.open).mockRestore()

        const ee = mockEE()

        vi.spyOn(launch, 'launch').mockReturnValue(ee)
        vi.spyOn(Windows, 'create').mockReturnValue(ee)
      })

      describe('before:browser:launch', () => {
        it('chrome', () => {
          // during testing, do not try to connect to the remote interface or
          // use the Chrome remote interface client
          const criClient = {
            on: vi.fn(),
            off: vi.fn(),
            send: vi.fn((command: string) => {
              return command === 'Page.getFrameTree' ? Promise.resolve({ frameTree: { frame: { id: 'main-frame' } } }) : undefined
            }),
          }

          const browserCriClient = {
            attachToTargetUrl: vi.fn(() => Promise.resolve(criClient)),
            close: vi.fn(() => Promise.resolve()),
            getWebSocketDebuggerUrl: vi.fn(() => 'ws://debugger'),
          }

          const cdpAutomation = {
            _handlePausedRequests: vi.fn(() => Promise.resolve()),
            _listenForFrameTreeChanges: vi.fn(),
          }

          vi.spyOn(chromeBrowser, '_writeExtension').mockResolvedValue(undefined as any)

          vi.spyOn(BrowserCriClient, 'create').mockResolvedValue(browserCriClient as any)
          // the "returns(resolves)" stub is due to curried method
          // it accepts URL to visit and then waits for actual CRI client reference
          // and only then navigates to that URL
          vi.spyOn(chromeBrowser, '_navigateUsingCRI').mockResolvedValue(undefined as any)
          vi.spyOn(chromeBrowser, '_handleDownloads').mockResolvedValue(undefined as any)
          vi.spyOn(chromeBrowser, '_recordVideo').mockResolvedValue(undefined as any)

          vi.spyOn(chromeBrowser, '_setAutomation').mockReturnValue(cdpAutomation as any)

          vi.spyOn(ProjectBase.prototype, 'resetBrowserState').mockResolvedValue(undefined as any)

          const createCdpFetchNetworkRuntime = vi.spyOn(ServerBase.prototype, 'createCdpFetchNetworkRuntime')

          return cypress.start([
            `--run-project=${pluginBrowser}`,
            '--browser=chrome',
          ])
          .then(() => {
            const args = vi.mocked(launch.launch).mock.calls[0] as any[]

            // when we work with the browsers we set a few extra flags
            const chrome = _.find(TYPICAL_BROWSERS, { name: 'chrome' })
            const launchedChrome = _.defaults({}, chrome, {
              isHeadless: true,
              isHeaded: false,
            })

            expect(args[0], 'found and used Chrome').toStrictEqual(launchedChrome)

            const browserArgs = args[3]

            expect(browserArgs.slice(0, 4), 'first 4 custom launch arguments to Chrome').toStrictEqual([
              'chrome', 'foo', 'bar', 'baz',
            ])

            expectExitWith(0)

            expect(chromeBrowser._navigateUsingCRI).toHaveBeenCalledTimes(1)
            expect(chromeBrowser._setAutomation).toHaveBeenCalledTimes(1)
            expect(chromeBrowser._recordVideo).not.toHaveBeenCalled()

            expect(BrowserCriClient.create).toHaveBeenCalledTimes(1)
            expect(browserCriClient.attachToTargetUrl).toHaveBeenCalledTimes(1)

            // chrome launches on the browser (CDP) network path, where the Fetch
            // runtime installed from onPageCriClientReady pauses requests instead
            expect(createCdpFetchNetworkRuntime).toHaveBeenCalledTimes(1)
            expect(cdpAutomation._handlePausedRequests).not.toHaveBeenCalled()
            expect(cdpAutomation._listenForFrameTreeChanges).toHaveBeenCalledTimes(1)
          })
        })

        it('electron', () => {
          // during testing, do not try to connect to the remote interface or
          // use the Chrome remote interface client
          const criClient = {
            on: vi.fn(),
            off: vi.fn(),
            send: vi.fn((command: string) => {
              return command === 'Page.getFrameTree' ? Promise.resolve({ frameTree: { frame: { id: 'main-frame' } } }) : undefined
            }),
          }

          const browserCriClient = {
            attachToTargetUrl: vi.fn(() => Promise.resolve(criClient)),
            currentlyAttachedTarget: criClient,
            currentlyAttachedProtocolTarget: criClient,
            close: vi.fn(() => Promise.resolve()),
            getWebSocketDebuggerUrl: vi.fn(() => 'ws://debugger'),
          }

          vi.spyOn(BrowserCriClient, 'create').mockResolvedValue(browserCriClient as any)

          vi.mocked(videoCapture.start).mockReturnValue(undefined as any)

          return cypress.start([
            `--run-project=${pluginBrowser}`,
            '--browser=electron',
          ])
          .then(() => {
            expect(calledWithMatch(Windows.create, pluginBrowser, {
              browser: 'electron',
              foo: 'bar',
              onNewWindow: expect.any(Function),
            })).toBe(true)

            expect(BrowserCriClient.create).toHaveBeenCalledTimes(1)
            expect(browserCriClient.attachToTargetUrl).toHaveBeenCalledTimes(1)

            expectExitWith(0)
          })
        })
      })
    })

    describe('--port', () => {
      beforeEach(() => {
        testGlobals.CY_TEST_MOCK!.listenForProjectEnd = { stats: { failures: 0 } }
      })

      it('can change the default port to 5544', () => {
        const listen = vi.spyOn(http.Server.prototype, 'listen')
        const open = vi.spyOn(ServerBase.prototype, 'open')

        return assertWithOpenProjectAfterReady(
          cypress.start([`--run-project=${todosPath}`, '--port=5544']),
          (project) => {
            expect(project.cfg.port).toBe(5544)
          },
        ).then(() => {
          expect(calledWith(listen, 5544)).toBe(true)
          expect(calledWithMatch(open, { port: 5544 })).toBe(true)
          expectExitWith(0)
        })
      })

      it('logs error and exits when port is in use', async () => {
        vi.spyOn(ProjectBase.prototype, 'getAutomation').mockReturnValue({ use: () => {} } as any)
        const server = Bluebird.promisifyAll(http.createServer())

        try {
          await server.listenAsync(5544, '127.0.0.1')
          await cypress.start([`--run-project=${todosPath}`, '--port=5544'])

          expectExitWithErr('PORT_IN_USE_SHORT', '5544')
        } finally {
          await new Promise((resolve) => server.close(resolve))
        }
      })
    })

    describe('--env', () => {
      beforeEach(() => {
        process.env = _.omit(process.env, 'CYPRESS_DEBUG')
        delete process.env.CYPRESS_COMMERCIAL_RECOMMENDATIONS

        testGlobals.CY_TEST_MOCK!.listenForProjectEnd = { stats: { failures: 0 } }
      })

      it('can set specific environment variables', () => {
        return assertWithOpenProjectAfterReady(
          cypress.start([
            `--run-project=${todosPath}`,
            '--video=false',
            '--env',
            'version=0.12.1,foo=bar,host=http://localhost:8888,baz=quux=dolor',
          ]),
          (project) => {
            expect(project.cfg.env).toStrictEqual({
              version: '0.12.1',
              foo: 'bar',
              host: 'http://localhost:8888',
              baz: 'quux=dolor',
            })
          },
        ).then(() => {
          expectExitWith(0)
        })
      })

      it('parses environment variables with empty values', () => {
        return assertWithOpenProjectAfterReady(
          cypress.start([
            `--run-project=${todosPath}`,
            '--video=false',
            '--env=FOO=,BAR=,BAZ=ipsum',
          ]),
          (project) => {
            expect(project.cfg.env).toStrictEqual({
              FOO: '',
              BAR: '',
              BAZ: 'ipsum',
            })
          },
        ).then(() => {
          expectExitWith(0)
        })
      })
    })

    describe('--config-file', () => {
      it(`with a custom config file fails when it doesn't exist`, () => {
        const filename = 'abcdefgh.test.js'

        return fs.statAsync(path.join(todosPath, filename))
        .then(() => {
          throw new Error(`${filename} should not exist`)
        }).catch({ code: 'ENOENT' }, () => {
          return cypress.start([
            `--run-project=${todosPath}`,
            '--no-run-mode',
            '--config-file',
            filename,
          ]).then(() => {
            expectExitWithErr('CONFIG_FILE_NOT_FOUND', filename, todosPath)
          })
        })
      })
    })
  })

  // most record mode logic is covered in e2e tests.
  // we only need to cover the edge cases / warnings
  describe('--record', () => {
    let projectId: string

    beforeEach(async () => {
      await clearCtx()

      vi.spyOn(api, 'sendPreflight').mockResolvedValue(undefined as any)
      vi.spyOn(api, 'createRun').mockResolvedValue(undefined as any)

      api.setPreflightResult({ encrypt: false, apiUrl: 'http://localhost:1234' })

      vi.spyOn(api, 'createInstance')
      .mockResolvedValue(undefined as any)
      .mockResolvedValueOnce({
        spec: 'cypress/e2e/app.cy.js',
        runs: [{}],
        runId: '1',
        claimedInstances: 1,
        totalInstances: 1,
        groupId: 1,
        platform: 'linux',
        machineId: 1,
      } as any)
      .mockResolvedValueOnce({
        spec: null,
        runs: [{}],
        runId: '1',
        claimedInstances: 1,
        totalInstances: 1,
        groupId: 1,
        platform: 'linux',
        machineId: 1,
      } as any)

      stubAppReady()
      vi.spyOn(browsers, 'open').mockImplementation(() => undefined as any)

      testGlobals.CY_TEST_MOCK = {
        waitForSocketConnection: true,
        waitForBrowserToConnect: true,
        waitForTestsToFinishRunning: {
          stats: {
            tests: 1,
            passes: 2,
            failures: 3,
            pending: 4,
            skipped: 5,
            wallClockDuration: 6,
          },
          tests: [],
          hooks: [],
          video: 'path/to/video',
          screenshots: [],
          config: {},
          spec: {},
        },
      }

      // make sure we have no user object
      await user.set({})

      // Hardcoded so we don't need to create a project to source the config
      projectId = 'abc123'

      vi.mocked(browsers.open).mockRestore()

      const ee = mockEE()

      vi.spyOn(launch, 'launch').mockReturnValue(ee)
      vi.spyOn(Windows, 'create').mockReturnValue(ee)
    })

    afterEach(() => {
      api.resetPreflightResult()
    })

    it('uses process.env.CYPRESS_PROJECT_ID', () => {
      vi.spyOn(env, 'get').mockImplementation(((key) => key === 'CYPRESS_PROJECT_ID' ? projectId : undefined) as any)

      return cypress.start([
        '--cwd=/foo/bar',
        `--run-project=${noScaffolding}`,
        '--record',
        '--key=token-123',
      ])
      .then(() => {
        expect(calledWithMatch(api.createRun, { projectId })).toBe(true)
        expect(errors.warning).not.toHaveBeenCalled()
        expectExitWith(3)
      })
    })

    it('uses process.env.CYPRESS_RECORD_KEY', () => {
      const envValues = {
        CYPRESS_PROJECT_ID: 'foo-project-123',
        CYPRESS_RECORD_KEY: 'token',
      }

      vi.spyOn(env, 'get').mockImplementation(((key) => envValues[key]) as any)

      return cypress.start([
        '--cwd=/foo/bar',
        `--run-project=${noScaffolding}`,
        '--record',
      ])
      .then(() => {
        expect(calledWithMatch(api.createRun, {
          projectId: 'foo-project-123',
          recordKey: 'token',
        })).toBe(true)

        expect(errors.warning).not.toHaveBeenCalled()
        expectExitWith(3)
      })
    })

    it('errors and exits when using --group but ciBuildId could not be generated', () => {
      vi.spyOn(ciProvider, 'provider').mockReturnValue(null as any)
      vi.spyOn(ciProvider, 'detectableCiBuildIdProviders').mockReturnValue(['circle', 'githubActions'] as any)

      return cypress.start([
        `--run-project=${recordPath}`,
        '--record',
        '--key=token-123',
        '--group=e2e-tests',
      ])
      .then(() => {
        expectExitWithErr('INDETERMINATE_CI_BUILD_ID')

        return snapshotConsoleLogs()
      })
    })

    it('errors and exits when using --parallel but ciBuildId could not be generated', () => {
      vi.spyOn(ciProvider, 'provider').mockReturnValue(null as any)
      vi.spyOn(ciProvider, 'detectableCiBuildIdProviders').mockReturnValue(['circle', 'githubActions'] as any)

      return cypress.start([
        `--run-project=${recordPath}`,
        '--record',
        '--key=token-123',
        '--parallel',
      ])
      .then(() => {
        expectExitWithErr('INDETERMINATE_CI_BUILD_ID')

        return snapshotConsoleLogs()
      })
    })

    it('errors and exits when using --parallel and --group but ciBuildId could not be generated', () => {
      vi.spyOn(ciProvider, 'provider').mockReturnValue(null as any)
      vi.spyOn(ciProvider, 'detectableCiBuildIdProviders').mockReturnValue(['circle', 'githubActions'] as any)

      return cypress.start([
        `--run-project=${recordPath}`,
        '--record',
        '--key=token-123',
        '--group=e2e-tests-chrome',
        '--parallel',
      ])
      .then(() => {
        expectExitWithErr('INDETERMINATE_CI_BUILD_ID')

        return snapshotConsoleLogs()
      })
    })

    it('errors and exits when using --ci-build-id with no group or parallelization', () => {
      return cypress.start([
        `--run-project=${recordPath}`,
        '--record',
        '--key=token-123',
        '--ci-build-id=ciBuildId123',
      ])
      .then(() => {
        expectExitWithErr('INCORRECT_CI_BUILD_ID_USAGE')

        return snapshotConsoleLogs()
      })
    })

    it('errors and exits when using --ci-build-id without recording', () => {
      return cypress.start([
        `--run-project=${recordPath}`,
        '--ci-build-id=ciBuildId123',
      ])
      .then(() => {
        expectExitWithErr('RECORD_PARAMS_WITHOUT_RECORDING')

        return snapshotConsoleLogs()
      })
    })

    it('errors and exits when using --group without recording', () => {
      return cypress.start([
        `--run-project=${recordPath}`,
        '--group=e2e-tests',
      ])
      .then(() => {
        expectExitWithErr('RECORD_PARAMS_WITHOUT_RECORDING')

        return snapshotConsoleLogs()
      })
    })

    it('errors and exits when using --parallel without recording', () => {
      return cypress.start([
        `--run-project=${recordPath}`,
        '--parallel',
      ])
      .then(() => {
        expectExitWithErr('RECORD_PARAMS_WITHOUT_RECORDING')

        return snapshotConsoleLogs()
      })
    })

    it('errors and exits when using --tag without recording', () => {
      return cypress.start([
        `--run-project=${recordPath}`,
        '--tag=nightly',
      ])
      .then(() => {
        expectExitWithErr('RECORD_PARAMS_WITHOUT_RECORDING')

        return snapshotConsoleLogs()
      })
    })

    it('errors and exits when using --group and --parallel without recording', () => {
      return cypress.start([
        `--run-project=${recordPath}`,
        '--tag=nightly',
        '--group=electron-smoke-tests',
        '--parallel',
      ])
      .then(() => {
        expectExitWithErr('RECORD_PARAMS_WITHOUT_RECORDING')

        return snapshotConsoleLogs()
      })
    })

    it('errors and exits when using --auto-cancel-after-failures without recording', () => {
      return cypress.start([
        `--run-project=${recordPath}`,
        '--auto-cancel-after-failures=4',
      ])
      .then(() => {
        expectExitWithErr('RECORD_PARAMS_WITHOUT_RECORDING')

        return snapshotConsoleLogs()
      })
    })

    it('does not truncate a really long Cypress Cloud url', () => {
      vi.mocked(api.createRun).mockResolvedValue({
        warnings: [],
        runUrl: `http://cloud.cypress.io/this-is-a${'-long'.repeat(50)}-url`,
      } as any)

      return cypress.start([
        `--run-project=${recordPath}`,
        '--record',
        '--key=token-123',
        '--group=electron-smoke-tests',
        '--ciBuildId=ciBuildId123',
      ])
      .then(() => {
        return snapshotConsoleLogs()
      })
    })

    it('errors and exits when group name is not unique and explicitly passed ciBuildId', () => {
      const err = new Error() as any

      err.statusCode = 422
      err.error = {
        code: 'RUN_GROUP_NAME_NOT_UNIQUE',
        payload: {
          runUrl: 'https://cloud.cypress.io/runs/12345',
        },
      }

      vi.mocked(api.createRun).mockRejectedValue(err)

      return cypress.start([
        `--run-project=${recordPath}`,
        '--record',
        '--key=token-123',
        '--group=electron-smoke-tests',
        '--ciBuildId=ciBuildId123',
      ])
      .then(() => {
        expectExitWithErr('CLOUD_RUN_GROUP_NAME_NOT_UNIQUE')

        return snapshotConsoleLogs()
      })
    })

    it('errors and exits when parallel group params are different', () => {
      vi.spyOn(system, 'info').mockReturnValue({
        osName: 'darwin',
        osVersion: 'v1',
      } as any)

      vi.spyOn(browsers, 'ensureAndGetByNameOrPath').mockResolvedValue({
        version: '59.1.2.3',
        displayName: 'Electron',
      } as any)

      const err = new Error() as any

      err.statusCode = 422
      err.error = {
        code: 'PARALLEL_GROUP_PARAMS_MISMATCH',
        payload: {
          runUrl: 'https://cloud.cypress.io/runs/12345',
          differentParams: {
            browserName: {
              detected: 'Chrome',
              expected: 'Electron',
            },
            browserVersion: {
              detected: '65',
              expected: '64',
            },
          },
          differentSpecs: [
            'cypress/integration/foo_spec.js',
          ],
        },
      }

      vi.mocked(api.createRun).mockRejectedValue(err)

      return cypress.start([
        `--run-project=${recordPath}`,
        '--record',
        '--key=token-123',
        '--parallel',
        '--group=electron-smoke-tests',
        '--ciBuildId=ciBuildId123',
      ])
      .then(() => {
        expectExitWithErr('CLOUD_PARALLEL_GROUP_PARAMS_MISMATCH')

        return snapshotConsoleLogs()
      })
    })

    it('errors and exits when parallel is not allowed', () => {
      const err = new Error() as any

      err.statusCode = 422
      err.error = {
        code: 'PARALLEL_DISALLOWED',
        payload: {
          runUrl: 'https://cloud.cypress.io/runs/12345',
        },
      }

      vi.mocked(api.createRun).mockRejectedValue(err)

      return cypress.start([
        `--run-project=${recordPath}`,
        '--record',
        '--key=token-123',
        '--parallel',
        '--group=electron-smoke-tests',
        '--ciBuildId=ciBuildId123',
      ])
      .then(() => {
        expectExitWithErr('CLOUD_PARALLEL_DISALLOWED')

        return snapshotConsoleLogs()
      })
    })

    it('errors and exits when parallel is required', () => {
      const err = new Error() as any

      err.statusCode = 422
      err.error = {
        code: 'PARALLEL_REQUIRED',
        payload: {
          runUrl: 'https://cloud.cypress.io/runs/12345',
        },
      }

      vi.mocked(api.createRun).mockRejectedValue(err)

      return cypress.start([
        `--run-project=${recordPath}`,
        '--record',
        '--key=token-123',
        '--parallel',
        '--tag=nightly',
        '--group=electron-smoke-tests',
        '--ciBuildId=ciBuildId123',
        '--auto-cancel-after-failures=4',
      ])
      .then(() => {
        expectExitWithErr('CLOUD_PARALLEL_REQUIRED')

        return snapshotConsoleLogs()
      })
    })

    it('errors and exits when run is already complete', () => {
      const err = new Error() as any

      err.statusCode = 422
      err.error = {
        code: 'ALREADY_COMPLETE',
        payload: {
          runUrl: 'https://cloud.cypress.io/runs/12345',
        },
      }

      vi.mocked(api.createRun).mockRejectedValue(err)

      return cypress.start([
        `--run-project=${recordPath}`,
        '--record',
        '--key=token-123',
        '--tag=nightly',
        '--group=electron-smoke-tests',
        '--ciBuildId=ciBuildId123',
        '--auto-cancel-after-failures=4',
      ])
      .then(() => {
        expectExitWithErr('CLOUD_ALREADY_COMPLETE')

        return snapshotConsoleLogs()
      })
    })

    it('errors and exits when run is stale', () => {
      const err = new Error() as any

      err.statusCode = 422
      err.error = {
        code: 'STALE_RUN',
        payload: {
          runUrl: 'https://cloud.cypress.io/runs/12345',
        },
      }

      vi.mocked(api.createRun).mockRejectedValue(err)

      return cypress.start([
        `--run-project=${recordPath}`,
        '--record',
        '--key=token-123',
        '--parallel',
        '--tag=nightly',
        '--group=electron-smoke-tests',
        '--ciBuildId=ciBuildId123',
        '--auto-cancel-after-failures=4',
      ])
      .then(() => {
        expectExitWithErr('CLOUD_STALE_RUN')

        return snapshotConsoleLogs()
      })
    })

    it('errors and exits when auto cancel mismatch', () => {
      const err = new Error() as any

      err.statusCode = 422
      err.error = {
        code: 'AUTO_CANCEL_MISMATCH',
        payload: {
          runUrl: 'https://cloud.cypress.io/runs/12345',
        },
      }

      vi.mocked(api.createRun).mockRejectedValue(err)

      return cypress.start([
        `--run-project=${recordPath}`,
        '--record',
        '--key=token-123',
        '--tag=nightly',
        '--group=electron-smoke-tests',
        '--ciBuildId=ciBuildId123',
        '--auto-cancel-after-failures=4',
      ])
      .then(() => {
        expectExitWithErr('CLOUD_AUTO_CANCEL_MISMATCH')

        return snapshotConsoleLogs()
      })
    })

    describe('cloud recommendation message', () => {
      it('does not display if --record is passed', () => {
        vi.spyOn(ciProvider, 'getIsCi').mockReturnValue(true)
        delete process.env.CYPRESS_COMMERCIAL_RECOMMENDATIONS
        testGlobals.CY_TEST_MOCK!.listenForProjectEnd = { stats: { failures: 1 } }

        return cypress.start([
          `--run-project=${recordPath}`,
          '--record',
          '--key=token-123',
          '--group=electron-smoke-tests',
          '--ciBuildId=ciBuildId123',
          '--auto-cancel-after-failures=4',
        ])
        .then(() => {
          expect(calledWith(console.log, cloudRecommendationMessage)).toBe(false)
        })
      })
    })
  })

  describe('--return-pkg', () => {
    beforeEach(() => {
      consoleLog().mockReset().mockImplementation(() => {})
    })

    it('logs package.json and exits', () => {
      return cypress.start(['--return-pkg'])
      .then(() => {
        expect(calledWithMatch(console.log, '{"name":"cypress"')).toBe(true)
        expectExitWith(0)
      })
    })
  })

  describe('--version', () => {
    beforeEach(() => {
      consoleLog().mockReset().mockImplementation(() => {})
    })

    it('logs version and exits', () => {
      return cypress.start(['--version'])
      .then(() => {
        expect(calledWith(console.log, pkg.version)).toBe(true)
        expectExitWith(0)
      })
    })
  })

  describe('--smoke-test', () => {
    beforeEach(() => {
      consoleLog().mockReset().mockImplementation(() => {})
    })

    it('logs pong value and exits', () => {
      return cypress.start(['--smoke-test', '--ping=abc123'])
      .then(() => {
        expect(calledWith(console.log, 'abc123')).toBe(true)
        expectExitWith(0)
      })
    })
  })

  describe('interactive', () => {
    beforeEach(async () => {
      const win = {
        on: vi.fn(),
        webContents: {
          on: vi.fn(),
        },
      }

      await clearCtx()

      stubAppReady()
      vi.spyOn(Windows, 'open').mockResolvedValue(win as any)
      vi.spyOn(ServerBase.prototype, 'startWebsockets').mockImplementation(() => undefined as any)
      vi.spyOn(electron.ipcMain, 'on').mockImplementation(() => undefined as any)
    })

    it('passes options to interactiveMode.ready', () => {
      vi.spyOn(interactiveMode, 'ready').mockImplementation(() => undefined as any)

      return cypress.start(['--updating', '--port=2121', '--config=pageLoadTimeout=1000'])
      .then(() => {
        expect(calledWithMatch(interactiveMode.ready, {
          updating: true,
          config: {
            port: 2121,
            pageLoadTimeout: 1000,
          },
        })).toBe(true)
      })
    })

    // TODO: fix failing test https://github.com/cypress-io/cypress/issues/23149
    // eslint-disable-next-line vitest/no-disabled-tests
    it.skip('passes filtered options to Project#open and sets cli config', async () => {
      const open = vi.spyOn(ServerBase.prototype, 'open').mockResolvedValue([] as any)

      vi.spyOn(interactiveMode, 'ready').mockImplementation(() => undefined as any)

      process.env.CYPRESS_FILE_SERVER_FOLDER = 'foo'
      process.env.CYPRESS_BASE_URL = 'http://localhost'
      process.env.CYPRESS_port = '2222'
      process.env.CYPRESS_responseTimeout = '5555'
      process.env.CYPRESS_watch_for_file_changes = 'false'

      setCtx(makeDataContext({} as Parameters<typeof makeDataContext>[0]))

      await ctx.actions.project.setCurrentProjectAndTestingTypeForTestSetup(todosPath)

      return user.set({ name: 'brian', authToken: 'auth-token-123' })
      .then(() => ctx.lifecycleManager.getFullInitialConfig())
      .then((json) => {
        // this should be overridden by the env argument
        json.baseUrl = 'http://localhost:8080'

        // "pick" out the list of properties that cannot exist on the root level so we can re-add them on the "e2e" object
        // TODO: refactor this part of the test, this is silly and a holdover from pre-split-config
        const { experimentalOriginDependencies, supportFile, specPattern, excludeSpecPattern, baseUrl, slowTestThreshold, testIsolation, ...rest } = json

        return settings.writeForTesting(todosPath, { ...rest, e2e: { experimentalOriginDependencies, baseUrl, supportFile, specPattern, testIsolation, excludeSpecPattern } })
      }).then(async () => {
        await clearCtx()

        return cypress.start([
          '--port=2121',
          '--config',
          'pageLoadTimeout=1000',
          '--foo=bar',
          '--env=baz=baz',
        ])
      }).then(() => {
        const options = vi.mocked(interactiveMode.ready).mock.calls[0][0]

        return openProject.create(todosPath, { ...options, testingType: 'e2e' }, [] as any)
      }).then(() => {
        const projectOptions = openProject.getProject()!.options as any

        expect(projectOptions.port).toBe(2121)
        expect(projectOptions.pageLoadTimeout).toBe(1000)
        expect(projectOptions.report).toBe(false)
        expect(projectOptions.env).toStrictEqual({ baz: 'baz' })

        expect(open).toHaveBeenCalled()

        const cfg = open.mock.calls[0][0] as any

        expect(cfg.fileServerFolder).toBe(path.join(todosPath, 'foo'))
        expect(cfg.pageLoadTimeout).toBe(1000)
        expect(cfg.port).toBe(2121)
        expect(cfg.baseUrl).toBe('http://localhost')
        expect(cfg.watchForFileChanges).toBe(false)
        expect(cfg.responseTimeout).toBe(5555)
        expect(cfg.env.baz).toBe('baz')
        expect(cfg.env).not.toHaveProperty('fileServerFolder')
        expect(cfg.env).not.toHaveProperty('port')
        expect(cfg.env).not.toHaveProperty('BASE_URL')
        expect(cfg.env).not.toHaveProperty('watchForFileChanges')
        expect(cfg.env).not.toHaveProperty('responseTimeout')

        expect(cfg.resolved.fileServerFolder).toStrictEqual({
          value: 'foo',
          from: 'env',
        })

        expect(cfg.resolved.pageLoadTimeout).toStrictEqual({
          value: 1000,
          from: 'cli',
        })

        expect(cfg.resolved.port).toStrictEqual({
          value: 2121,
          from: 'cli',
        })

        expect(cfg.resolved.baseUrl).toStrictEqual({
          value: 'http://localhost',
          from: 'env',
        })

        expect(cfg.resolved.watchForFileChanges).toStrictEqual({
          value: false,
          from: 'env',
        })

        expect(cfg.resolved.responseTimeout).toStrictEqual({
          value: 5555,
          from: 'env',
        })

        expect(cfg.resolved.env.baz).toStrictEqual({
          value: 'baz',
          from: 'cli',
        })
      })
    })
  })

  describe('--cwd', () => {
    beforeEach(async () => {
      await clearCtx()

      vi.mocked(errors.warning).mockRestore()
      stubAppReady()
      vi.spyOn(interactiveMode, 'ready').mockResolvedValue(undefined as any)
      vi.spyOn(errors, 'warning')
    })

    it('shows warning if Cypress has been started directly', () => {
      return cypress.start().then(() => {
        expect(calledWith(errors.warning, 'INVOKED_BINARY_OUTSIDE_NPM_MODULE')).toBe(true)
        expect(calledWithMatch(console.log, 'It looks like you are running the Cypress binary directly.')).toBe(true)
        expect(calledWithMatch(console.log, 'https://on.cypress.io/installing-cypress')).toBe(true)
      })
    })

    it('does not show warning if finds --cwd', () => {
      return cypress.start(['--cwd=/foo/bar']).then(() => {
        expect(errors.warning).not.toHaveBeenCalled()
      })
    })
  })

  describe('no args', () => {
    beforeEach(async () => {
      await clearCtx()
      stubAppReady()
      vi.spyOn(interactiveMode, 'ready').mockResolvedValue(undefined as any)
    })

    it('runs interactiveMode and does not exit', () => {
      return cypress.start().then(() => {
        expect(interactiveMode.ready).toHaveBeenCalledTimes(1)
      })
    })
  })
})
