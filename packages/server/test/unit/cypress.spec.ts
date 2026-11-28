/* eslint-disable no-console */

import _ from 'lodash'
import path from 'path'
import EE from 'events'
import http from 'http'
import Promise from 'bluebird'
import nock from 'nock'
import { createRequire } from 'module'
import { stripVTControlCharacters as stripAnsi } from 'util'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import electron from 'electron'
import Fixtures from '@tooling/system-tests'
import { normalizeStdout } from '@tooling/system-tests/lib/normalizeStdout'
import pkg from '@packages/root'
import * as detect from '@packages/launcher/lib/detect'
import * as launch from '@packages/launcher/lib/browsers'
import extension from '@packages/extension'
import { validation as v } from '@packages/config'
import * as errorsPkg from '@packages/errors'
import commitInfo from '../../lib/util/commit-info'
import * as argsUtil from '../../lib/util/args'
import { fs } from '../../lib/util/fs'
import * as ciProvider from '../../lib/util/ci_provider'
import * as settings from '../../lib/util/settings'
import * as Windows from '../../lib/gui/windows'
import interactiveMode from '../../lib/modes/interactive'
import modes from '../../lib/modes'
import * as runMode from '../../lib/modes/run'
import api from '../../lib/cloud/api'
import { getCwd as cwd } from '../../lib/cwd'
import user from '../../lib/cloud/user'
import { cache } from '../../lib/cache'
import * as errors from '../../lib/errors'
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
import * as terminalSize from '../../lib/util/terminal-size'
import * as savedState from '../../lib/saved_state'
import { getCtx, clearCtx, setCtx, makeDataContext } from '../../lib/makeDataContext'
import { hasCtx } from '@packages/data-context'
import { BrowserCriClient } from '../../lib/browsers/browser-cri-client'
import { cloudRecommendationMessage } from '../../lib/util/print-run'
import { GracefulExit } from '../../lib/util/graceful-exit'
import { callsMatching, callsStartingWith, expectCalledWith, expectCalledWithMatch, expectNotCalledWith, expectNotCalledWithMatch } from '../support/helpers/sinon_calls'

const electronStub = vi.hoisted(() => {
  return require('../support/helpers/electron_stub')
})

vi.mock('electron', () => {
  return { ...electronStub, default: electronStub }
})

// A second copy of the GraphQL schema in this worker trips `graphql`'s duplicate-realm check.
vi.mock('@packages/data-context/graphql/schema', () => {
  return { graphqlSchema: {} }
})

vi.mock('@packages/data-context/graphql', () => {
  return { remoteSchemaWrapped: {} }
})

// No test here talks to the GraphQL endpoints.
vi.mock('@packages/data-context/graphql/makeGraphQLServer', () => {
  return {
    makeGraphQLServer: async () => 4444,
    graphqlWS: () => undefined,
    tapGraphQLHTTP: () => undefined,
    handleGraphQLSocketRequest: () => undefined,
    handleRunnerGraphQLSocketRequest: () => undefined,
  }
})

// `lib/cypress.ts`, `lib/modes` and `lib/browsers` load these with a bare `require()`,
// which skips vite's module graph and `vi.mock`; give it the instances spied on here.
const requireFromLib = createRequire(path.join(__dirname, '../../lib/cypress.ts'))
const cjsSeeds = {
  'electron': electronStub,
  './errors': errors,
  './modes': modes,
  './modes/run': runMode,
  './modes/interactive': interactiveMode,
  './util/args': argsUtil,
  './reporter': reporter,
  './browsers': { default: browsers },
  './browsers/chrome': chromeBrowser,
  './browsers/electron': electronBrowser,
}

for (const [request, exports] of Object.entries(cjsSeeds)) {
  requireFromLib.cache[requireFromLib.resolve(request)] = { exports, loaded: true } as unknown as NodeModule
}

// `GracefulExit.resetForTesting` refuses to clear its singleton without this.
globalThis.IS_TEST = true

const originalEnv = _.clone(process.env)

const processVersions = process.versions

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

const snapshotConsoleLogs = function (name) {
  const args = _
  .chain(vi.mocked(console.log).mock.calls)
  .map((innerArgs) => {
    return innerArgs.join(' ')
  }).join('\n')
  .value()

  // our cwd() is currently the project
  // so must switch back to original
  process.chdir(previousCwd)

  const snap = normalizeStdout(stripAnsi(args))

  return expect(snap).toMatchSnapshot(name)
}

const stubElectronAppReady = () => {
  vi.spyOn(electron.app, 'on').mockImplementation(((event: string, cb: () => void) => {
    if (event === 'ready') {
      setImmediate(cb)
    }

    return undefined
  }) as any)
}

function mockEE () {
  const ee: any = new EE()

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
      clearCache: vi.fn(async () => {}),
      clearStorageData: vi.fn(async () => {}),
      setProxy: vi.fn(async () => {}),
      setUserAgent: vi.fn(),
      on: vi.fn(),
      removeListener: vi.fn(),
      webRequest: {
        onBeforeSendHeaders () {},
      },
    },
  }

  ee.maximize = vi.fn
  ee.setSize = vi.fn

  return ee
}

/**
 * `cypress.start` resolves only after graceful exit runs `clearCtx`, so
 * `openProject.getProject()` is null in a `.then` on that promise.
 * Register assertions that need `cfg` / `ProjectBase` in `assertWhileOpen`; it runs
 * when `openProject` emits `ready` (project fully opened), before the run finishes and exit runs.
 *
 * @param {Promise<unknown>} startPromise - return value of `cypress.start(...)`
 * @param {(project: import('../../lib/project-base').ProjectBase) => void | Promise<void>} assertWhileOpen
 * @returns {Promise<void>}
 */
async function assertWithOpenProjectAfterReady (startPromise, assertWhileOpen) {
  const whenReady = new Promise((resolve, reject) => {
    openProject.once('ready', () => {
      Promise.resolve(assertWhileOpen(openProject.getProject()))
      .then(resolve)
      .catch(reject)
    })
  })

  await Promise.all([whenReady, startPromise])
}

const expectExitWith = (code) => {
  expectCalledWith(process.exit, code)
}

// returns error object
const expectExitWithErr = (type, msg1?, msg2?) => {
  expect(callsMatching(errors.log, { type }), 'error was logged').not.toHaveLength(0)
  expect(callsStartingWith(process.exit, 1), 'process.exit was called').not.toHaveLength(0)

  const err = vi.mocked(errors.log).mock.calls[0][0]

  if (msg1) {
    expect(stripAnsi(err.message), 'error text').toContain(msg1)
  }

  if (msg2) {
    expect(stripAnsi(err.message), 'second error text').toContain(msg2)
  }

  return err
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

  beforeEach(async function () {
    GracefulExit.resetForTesting()
    await clearCtx()
    setCtx(makeDataContext({} as Parameters<typeof makeDataContext>[0]))

    if (!nock.isActive()) {
      nock.activate()
    }

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
    vi.spyOn(extension, 'setHostAndPath').mockResolvedValue(undefined)
    vi.spyOn(detect, 'detect').mockResolvedValue([...TYPICAL_BROWSERS] as any)
    vi.spyOn(process, 'exit').mockImplementation((() => undefined) as any)
    vi.spyOn(ServerBase.prototype, 'reset').mockImplementation(() => undefined)
    const originalWarning = errorsPkg.default.warning

    vi.spyOn(errorsPkg.default, 'warning').mockImplementation((type, ...args) => {
      if (type === 'INVOKED_BINARY_OUTSIDE_NPM_MODULE') {
        return null
      }

      return originalWarning(type, ...args)
    })

    vi.spyOn(errors, 'warning').mockImplementation((type, ...args) => errorsPkg.default.warning(type, ...args))

    vi.spyOn(errors, 'log')
    vi.spyOn(errors, 'logException')
    vi.spyOn(console, 'log')

    // The snapshots hold the 100 columns forced under `CI`, which the vitest env drops.
    vi.spyOn(terminalSize, 'get').mockReturnValue({ columns: 100, rows: 24 })

    // to make sure our Electron browser mock object passes validation during tests
    Object.defineProperty(process, 'versions', { configurable: true, value: {
      ...processVersions,
      chrome: ELECTRON_BROWSER.version,
      electron: '123.45.6789',
    } })
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
    delete globalThis['CY_TEST_MOCK']

    if (hasCtx()) {
      await getCtx()._reset()
    }

    await clearCtx()
    vi.restoreAllMocks()
    Object.defineProperty(process, 'versions', { configurable: true, value: processVersions })

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

  describe('error handling', function () {
    it('exits if config cannot be parsed', function () {
      return cypress.start(['--config', 'xyz'])
      .then(() => {
        const err = expectExitWithErr('COULD_NOT_PARSE_ARGUMENTS')

        expect(stripAnsi(err.message)).toMatchSnapshot('could not parse config error')
      })
    })

    it('exits if env cannot be parsed', function () {
      return cypress.start(['--env', 'a123'])
      .then(() => {
        const err = expectExitWithErr('COULD_NOT_PARSE_ARGUMENTS')

        expect(stripAnsi(err.message)).toMatchSnapshot('could not parse env error')
      })
    })

    it('exits if reporter options cannot be parsed', function () {
      return cypress.start(['--reporterOptions', 'nonono'])
      .then(() => {
        const err = expectExitWithErr('COULD_NOT_PARSE_ARGUMENTS')

        expect(stripAnsi(err.message)).toMatchSnapshot('could not parse reporter options error')
      })
    })
  })

  describe('invalid config', function () {
    beforeEach(async function () {
      const win = {
        on: vi.fn(),
        webContents: {
          on: vi.fn(),
        },
      }

      await clearCtx()
      stubElectronAppReady()
      vi.spyOn(Windows, 'open').mockResolvedValue(win as any)
    })

    it('shows warning if config is not valid', function () {
      return cypress.start(['--config=test=false', '--cwd=/foo/bar'])
      .then(() => {
        expectCalledWith(errors.warning, 'INVALID_CONFIG_OPTION')
        expectCalledWithMatch(console.log, 'The following configuration option is invalid:')
        expectCalledWithMatch(console.log, `test`)
        expectCalledWithMatch(console.log, 'https://on.cypress.io/configuration')
      })
    })

    it('shows warning when multiple config are not valid', function () {
      return cypress.start(['--config=test=false,foo=bar', '--cwd=/foo/bar'])
      .then(() => {
        expectCalledWith(errors.warning, 'INVALID_CONFIG_OPTION')
        expectCalledWithMatch(console.log, 'The following configuration options are invalid:')
        expectCalledWithMatch(console.log, 'test')
        expectCalledWithMatch(console.log, 'foo')
        expectCalledWithMatch(console.log, 'https://on.cypress.io/configuration')

        snapshotConsoleLogs('INVALID_CONFIG_OPTION')
      })
    })

    it('does not show warning if config is valid', function () {
      return cypress.start(['--config=trashAssetsBeforeRuns=false'])
      .then(() => {
        expectNotCalledWith(errors.warning, 'INVALID_CONFIG_OPTION')
      })
    })
  })

  describe('--run-project', () => {
    beforeEach(async () => {
      await clearCtx()

      stubElectronAppReady()
      globalThis.CY_TEST_MOCK = {
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
      it('gets logged when in CI and there is a failure', function () {
        const relativePath = path.relative(cwd(), todosPath)

        vi.spyOn(ciProvider, 'getIsCi').mockReturnValue(true)
        delete process.env.CYPRESS_COMMERCIAL_RECOMMENDATIONS
        globalThis.CY_TEST_MOCK.listenForProjectEnd = { stats: { failures: 1 } }

        return cypress.start([`--run-project=${todosPath}`, `--spec=${relativePath}/tests/test1.js`]).then(() => {
          expectCalledWith(console.log, cloudRecommendationMessage)

          snapshotConsoleLogs('CLOUD_RECOMMENDATION_MESSAGE')
        })
      })

      it('does not get logged if CYPRESS_COMMERCIAL_RECOMMENDATIONS is set to 0', function () {
        const relativePath = path.relative(cwd(), todosPath)

        vi.spyOn(ciProvider, 'getIsCi').mockReturnValue(true)
        process.env.CYPRESS_COMMERCIAL_RECOMMENDATIONS = '0'
        globalThis.CY_TEST_MOCK.listenForProjectEnd = { stats: { failures: 1 } }

        return cypress.start([`--run-project=${todosPath}`, `--spec=${relativePath}/tests/test1.js`]).then(() => {
          expectNotCalledWith(console.log, cloudRecommendationMessage)
        })
      })

      it('does not get logged if all tests pass', function () {
        const relativePath = path.relative(cwd(), todosPath)

        vi.spyOn(ciProvider, 'getIsCi').mockReturnValue(true)
        delete process.env.CYPRESS_COMMERCIAL_RECOMMENDATIONS
        globalThis.CY_TEST_MOCK.listenForProjectEnd = { stats: { failures: 0 } }

        return cypress.start([`--run-project=${todosPath}`, `--spec=${relativePath}/tests/test1.js`]).then(() => {
          expectNotCalledWith(console.log, cloudRecommendationMessage)
        })
      })

      it('does not get logged if not running in CI', function () {
        const relativePath = path.relative(cwd(), todosPath)

        vi.spyOn(ciProvider, 'getIsCi').mockReturnValue(undefined as any)
        delete process.env.CYPRESS_COMMERCIAL_RECOMMENDATIONS
        globalThis.CY_TEST_MOCK.listenForProjectEnd = { stats: { failures: 1 } }

        return cypress.start([`--run-project=${todosPath}`, `--spec=${relativePath}/tests/test1.js`]).then(() => {
          expectNotCalledWith(console.log, cloudRecommendationMessage)
        })
      })
    })

    it('runs project headlessly and exits with exit code 0', function () {
      return cypress.start([`--run-project=${todosPath}`])
      .then(() => {
        expectCalledWithMatch(browsers.open, ELECTRON_BROWSER)
        expectExitWith(0)
      })
    })

    it('sets --headed false if --headless', function () {
      vi.spyOn(cypress, 'startInMode')

      return cypress.start([`--run-project=${todosPath}`, '--headless'])
      .then(() => {
        expectCalledWithMatch(browsers.open, ELECTRON_BROWSER)
        expectExitWith(0)

        // check how --headless option sets --headed
        expect(cypress.startInMode).toHaveBeenCalledTimes(1)
        expectCalledWith(cypress.startInMode, 'run')
        const startInModeOptions = vi.mocked(cypress.startInMode).mock.calls[0][1]

        expect(startInModeOptions).toMatchObject({
          headless: true,
          headed: false,
        })
      })
    })

    it('rejects if both --headed and --headless are true', function () {
      return expect(
        cypress.start([`--run-project=${todosPath}`, '--headless', '--headed']),
      ).rejects.toThrow('Impossible options: both headless and headed are true')
    })

    describe('strips --', () => {
      beforeEach(() => {
        vi.spyOn(argsUtil, 'toObject')
      })

      it('strips leading', function () {
        return cypress.start(['--', `--run-project=${todosPath}`])
        .then(() => {
          expectCalledWith(argsUtil.toObject, [`--run-project=${todosPath}`])
          expectCalledWithMatch(browsers.open, ELECTRON_BROWSER)
          expectExitWith(0)
        })
      })

      it('strips in the middle', function () {
        return cypress.start([`--run-project=${todosPath}`, '--', '--browser=electron'])
        .then(() => {
          expectCalledWith(argsUtil.toObject, [`--run-project=${todosPath}`, '--browser=electron'])
          expectCalledWithMatch(browsers.open, ELECTRON_BROWSER)
          expectExitWith(0)
        })
      })
    })

    it('runs project headlessly and exits with exit code 10', function () {
      globalThis.CY_TEST_MOCK.runSpecs = { totalFailed: 10 }

      return cypress.start([`--run-project=${todosPath}`])
      .then(() => {
        expectExitWith(10)
      })
    })

    it('exits with code 112 for cloud API failures when posix-exit-codes is enabled', function () {
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

    it('exits with code 1 for parallel cloud API failures when posix-exit-codes is enabled', function () {
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

    it('does not add project to the global cache', function () {
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

    it('runs project by relative spec and exits with status 0', function () {
      const relativePath = path.relative(cwd(), todosPath)

      return cypress.start([
        `--run-project=${todosPath}`,
        `--spec=${relativePath}/tests/test2.js`,
      ])
      .then(() => {
        expectCalledWithMatch(browsers.open, ELECTRON_BROWSER, {
          url: 'http://localhost:8888/__/#/specs/runner?file=tests/test2.js',
        })

        expectExitWith(0)
      })
    })

    it('runs project by specific spec with default configuration', function () {
      return cypress.start([`--run-project=${idsPath}`, `--spec=${idsPath}/**/*qux*`, '--config', 'port=2020'])
      .then(() => {
        expectCalledWithMatch(browsers.open, ELECTRON_BROWSER, { url: 'http://localhost:2020/__/#/specs/runner?file=cypress/e2e/qux.cy.js' })
        expect(browsers.open).toHaveBeenCalledTimes(1)
        expectExitWith(0)
      })
    })

    it('runs project by specific absolute spec and exits with status 0', function () {
      return cypress.start([`--run-project=${todosPath}`, `--spec=${todosPath}/tests/test2.js`])
      .then(() => {
        expectCalledWithMatch(browsers.open, ELECTRON_BROWSER, { url: 'http://localhost:8888/__/#/specs/runner?file=tests/test2.js' })
        expectExitWith(0)
      })
    })

    it('runs project by limiting spec files via config.e2e.specPattern string glob pattern', function () {
      return cypress.start([`--run-project=${todosPath}`, `--config={"e2e":{"specPattern":"${todosPath}/tests/test2.js"}}`])
      .then(() => {
        expectCalledWithMatch(browsers.open, ELECTRON_BROWSER, { url: 'http://localhost:8888/__/#/specs/runner?file=tests/test2.js' })
        expectExitWith(0)
      })
    })

    it('runs project by limiting spec files via config.e2e.specPattern as a JSON array of string glob patterns', function () {
      return cypress.start([`--run-project=${todosPath}`, '--config={"e2e":{"specPattern":["**/test2.js","**/test1.js"]}}'])
      .then(() => {
        expectCalledWithMatch(browsers.open, ELECTRON_BROWSER, { url: 'http://localhost:8888/__/#/specs/runner?file=tests/test2.js' })
      }).then(() => {
        expectCalledWithMatch(browsers.open, ELECTRON_BROWSER, { url: 'http://localhost:8888/__/#/specs/runner?file=tests/test1.js' })
        expectExitWith(0)
      })
    })

    it('does not scaffold when headless and exits with error when no existing project', function () {
      const ensureDoesNotExist = function (inspection, index) {
        if (!inspection.isRejected()) {
          throw new Error(`File or folder was scaffolded at index: ${index}`)
        }

        expect(inspection.reason()).toHaveProperty('code', 'ENOENT')
      }

      return Promise.all([
        fs.statAsync(path.join(pristinePath, 'cypress')).reflect(),
        fs.statAsync(path.join(pristinePath, 'cypress.config.js')).reflect(),
      ])
      .each(ensureDoesNotExist).then(() => {
        return cypress.start([`--run-project=${pristinePath}`])
      }).then(() => {
        return Promise.all([
          fs.statAsync(path.join(pristinePath, 'cypress')).reflect(),
          fs.statAsync(path.join(pristinePath, 'cypress.config.js')).reflect(),
        ])
        .each(ensureDoesNotExist)
      })
    })

    it('runs project headed and displays gui', function () {
      return cypress.start([`--run-project=${todosPath}`, '--headed'])
      .then(() => {
        expectCalledWithMatch(browsers.open, ELECTRON_BROWSER, {
          proxyServer: 'http://localhost:8888',
          browser: {
            isHeadless: false,
          },
        })

        expectExitWith(0)
      })
    })

    it('turns on reporting', function () {
      vi.spyOn(reporter.Reporter, 'create')

      return cypress.start([`--run-project=${todosPath}`])
      .then(() => {
        expectCalledWith(reporter.Reporter.create, 'spec')
        expectExitWith(0)
      })
    })

    it('can change the reporter to nyan', function () {
      vi.spyOn(reporter.Reporter, 'create')

      return cypress.start([`--run-project=${todosPath}`, '--reporter=nyan'])
      .then(() => {
        expectCalledWith(reporter.Reporter.create, 'nyan')
        expectExitWith(0)
      })
    })

    it('can change the reporter with cypress.config.js', async function () {
      vi.spyOn(reporter.Reporter, 'create')

      return cypress.start([`--run-project=${idsPath}`, `--config-file=${idsPath}/cypress.dot-reporter.config.js`])
      .then(() => {
        expectCalledWith(reporter.Reporter.create, 'dot')
        expectExitWith(0)
      })
    })

    it('runs tests even when user isn\'t logged in', function () {
      return user.set({})
      .then(() => {
        return cypress.start([`--run-project=${todosPath}`])
      }).then(() => {
        expectExitWith(0)
      })
    })

    it('logs warning when projectId and key but no record option', function () {
      return cypress.start([`--run-project=${todosPath}`, '--key=asdf'])
      .then(() => {
        expectCalledWith(errors.warning, 'PROJECT_ID_AND_KEY_BUT_MISSING_RECORD_OPTION', 'abc123')
        expectCalledWithMatch(console.log, 'You also provided your Record Key, but you did not pass the')
        expectCalledWithMatch(console.log, 'cypress run --record')
        expectCalledWithMatch(console.log, 'https://on.cypress.io/recording-project-runs')
      })
    })

    it('logs warning when removing old browser profiles fails', function () {
      const err = new Error('foo')

      vi.spyOn(browsers, 'removeOldProfiles').mockRejectedValue(err)

      return cypress.start([`--run-project=${todosPath}`])
      .then(() => {
        expectCalledWith(errors.warning, 'CANNOT_REMOVE_OLD_BROWSER_PROFILES', err)
        expectCalledWithMatch(console.log, 'Warning: We failed to remove old browser profiles from previous runs.')
        expectCalledWithMatch(console.log, err.message)
      })
    })

    it('does not log warning when no projectId', function () {
      return cypress.start([`--run-project=${pristinePath}`, '--key=asdf'])
      .then(() => {
        expectNotCalledWith(errors.warning, 'PROJECT_ID_AND_KEY_BUT_MISSING_RECORD_OPTION', 'abc123')
        expectNotCalledWithMatch(console.log, 'cypress run --key <record_key>')
      })
    })

    it('does not log warning when projectId but --record false', function () {
      return cypress.start([`--run-project=${todosPath}`, '--key=asdf', '--record=false'])
      .then(() => {
        expectNotCalledWith(errors.warning, 'PROJECT_ID_AND_KEY_BUT_MISSING_RECORD_OPTION', 'abc123')
        expectNotCalledWithMatch(console.log, 'cypress run --key <record_key>')
      })
    })

    it(`logs error when supportFile doesn't exist`, function () {
      return settings.writeForTesting(idsPath, { e2e: { supportFile: '/does/not/exist' } })
      .then(() => {
        return cypress.start([`--run-project=${idsPath}`])
      })
      .then(() => {
        expectExitWithErr('SUPPORT_FILE_NOT_FOUND', `Your supportFile is missing or invalid: /does/not/exist`)
      })
    })

    it('logs error when browser cannot be found', function () {
      vi.mocked(browsers.open).mockRestore()

      return cypress.start([`--run-project=${idsPath}`, '--browser=foo'])
      .then(() => {
        expectExitWithErr('BROWSER_NOT_FOUND_BY_NAME')

        // get all the error args
        const argsSet = vi.mocked(errors.log).mock.calls

        const found1 = _.find(argsSet, (args) => {
          return _.find(args, (arg) => {
            return arg.message && stripAnsi(arg.message).includes(
              `Browser: foo was not found on your system or is not supported by Cypress.`,
            )
          })
        })

        expect(found1, `foo should not be found`).toBeTruthy()

        const found2 = _.find(argsSet, (args) => {
          return _.find(args, (arg) => {
            return arg.message && stripAnsi(arg.message).includes(
              'Cypress supports the following browsers:',
            )
          })
        })

        expect(found2, 'supported browsers should be listed').toBeTruthy()

        const found3 = _.find(argsSet, (args) => {
          return _.find(args, (arg) => {
            return arg.message && stripAnsi(arg.message).includes(
              'Available browsers found on your system are:\n - chrome\n - chromium\n - chrome:canary\n - electron',
            )
          })
        })

        expect(found3, 'browser names should be listed').toBeTruthy()
      })
    })

    describe('no specs found', function () {
      it('logs error and exits when spec file was specified and does not exist', function () {
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

      it('logs error and exits when spec file was specified and does not exist using ../ pattern', function () {
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

      it('logs error and exits when spec file was specified with glob and does not exist using ../ pattern', function () {
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

      it('logs error and exits when spec absolute file was specified and does not exist', function () {
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

      it('logs error and exits when no specs were found at all', function () {
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

    it('logs error and exits when project has cypress.config.js syntax error', function () {
      return fs.writeFileAsync(`${todosPath}/cypress.config.js`, `module.exports = {`)
      .then(() => {
        return cypress.start([`--run-project=${todosPath}`])
      }).then(() => {
        expectExitWithErr('CONFIG_FILE_REQUIRE_ERROR', todosPath)
      })
    })

    it('logs error and exits when project has cypress.env.json syntax error', function () {
      return fs.writeFileAsync(`${todosPath}/cypress.env.json`, '{\'foo\': \'bar}')
      .then(() => {
        return cypress.start([`--run-project=${todosPath}`])
      }).then(() => {
        expectExitWithErr('ERROR_READING_FILE', todosPath)
      })
    })

    it('logs error and exits when project has invalid cypress.config.js values', function () {
      return settings.writeForTesting(todosPath, { baseUrl: 'localhost:9999' })
      .then(() => {
        return cypress.start([`--run-project=${todosPath}`])
      }).then(() => {
        expectExitWithErr('CONFIG_VALIDATION_ERROR', 'cypress.config.js')
      })
    })

    it('logs error and exits when project has invalid config values from the CLI', function () {
      return cypress.start([
        `--run-project=${todosPath}`,
        '--config=baseUrl=localhost:9999',
      ])
      .then(() => {
        expectExitWithErr('CONFIG_VALIDATION_ERROR', 'localhost:9999')
        expectExitWithErr('CONFIG_VALIDATION_ERROR', 'An invalid configuration value was set.')
      })
    })

    it('logs error and exits when project has invalid config values from env vars', function () {
      process.env.CYPRESS_BASE_URL = 'localhost:9999'

      return cypress.start([`--run-project=${todosPath}`])
      .then(() => {
        delete process.env.CYPRESS_BASE_URL
        expectExitWithErr('CONFIG_VALIDATION_ERROR', 'localhost:9999')
        expectExitWithErr('CONFIG_VALIDATION_ERROR', 'An invalid configuration value was set.')
      })
    })

    it('logs warning and continues when CYPRESS_env is set to a non-object value', function () {
      process.env.CYPRESS_env = 'invalid-string'

      return cypress.start([`--run-project=${todosPath}`])
      .then(() => {
        delete process.env.CYPRESS_env
        expectCalledWith(errorsPkg.default.warning, 'INVALID_CYPRESS_ENV_OVERRIDE', 'env', 'invalid-string')
        expectCalledWithMatch(console.log, 'CYPRESS_env')
        expectCalledWithMatch(console.log, 'must be a valid JSON object')
        expectCalledWithMatch(console.log, '--env')
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
    it.skip('logs error and exits when project folder has read permissions only and cannot write cypress.config.js', function () {
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

    it('logs error and exits when reporter does not exist', function () {
      return cypress.start([`--run-project=${todosPath}`, '--reporter', 'foobarbaz'])
      .then(() => {
        expectExitWithErr('INVALID_REPORTER_NAME', 'foobarbaz')
      })
    })

    describe('state', () => {
      let statePath: string

      beforeEach(function () {
        return appData.remove()
        .then(() => {
          return savedState.formStatePath(todosPath)
        }).then((statePathStart) => {
          statePath = appData.projectsPath(statePathStart)
        })
      })

      it('does not save project state', function () {
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
      it('sets morgan to false', function () {
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
      beforeEach(function () {
        delete process.env.CYPRESS_COMMERCIAL_RECOMMENDATIONS
      })

      it('can override default values', function () {
        return assertWithOpenProjectAfterReady(
          cypress.start([`--run-project=${todosPath}`, '--config=requestTimeout=1234,videoCompression=true']),
          (project) => {
            const { cfg } = project

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

      it('can override values in plugins', function () {
        return assertWithOpenProjectAfterReady(
          cypress.start([
            `--run-project=${pluginConfig}`, '--config=requestTimeout=1234,videoCompression=true',
            '--env=foo=foo,bar=bar',
          ]),
          (project) => {
            const { cfg } = project

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
        it('chrome', function () {
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
            attachToTargetUrl: vi.fn(async () => criClient),
            close: vi.fn(async () => {}),
            getWebSocketDebuggerUrl: vi.fn(() => 'ws://debugger'),
          }

          const cdpAutomation = {
            _handlePausedRequests: vi.fn(async () => {}),
            _listenForFrameTreeChanges: vi.fn(),
          }

          vi.spyOn(chromeBrowser, '_writeExtension').mockResolvedValue(undefined as any)

          vi.spyOn(BrowserCriClient, 'create').mockResolvedValue(browserCriClient as any)
          // the "returns(resolves)" stub is due to curried method
          // it accepts URL to visit and then waits for actual CRI client reference
          // and only then navigates to that URL
          vi.spyOn(chromeBrowser, '_navigateUsingCRI').mockResolvedValue(undefined)
          vi.spyOn(chromeBrowser, '_handleDownloads').mockResolvedValue(undefined)
          vi.spyOn(chromeBrowser, '_recordVideo').mockResolvedValue(undefined)

          vi.spyOn(chromeBrowser, '_setAutomation').mockReturnValue(cdpAutomation as any)

          vi.spyOn(ProjectBase.prototype, 'resetBrowserState').mockResolvedValue(undefined)

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

        it('electron', function () {
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
            attachToTargetUrl: vi.fn(async () => criClient),
            currentlyAttachedTarget: criClient,
            currentlyAttachedProtocolTarget: criClient,
            close: vi.fn(async () => {}),
            getWebSocketDebuggerUrl: vi.fn(() => 'ws://debugger'),
          }

          vi.spyOn(BrowserCriClient, 'create').mockResolvedValue(browserCriClient as any)

          vi.mocked(videoCapture.start).mockReturnValue(undefined as any)

          return cypress.start([
            `--run-project=${pluginBrowser}`,
            '--browser=electron',
          ])
          .then(() => {
            expectCalledWithMatch(Windows.create, pluginBrowser, {
              browser: 'electron',
              foo: 'bar',
              onNewWindow: expect.any(Function),
            })

            expect(BrowserCriClient.create).toHaveBeenCalledTimes(1)
            expect(browserCriClient.attachToTargetUrl).toHaveBeenCalledTimes(1)

            expectExitWith(0)
          })
        })
      })
    })

    describe('--port', () => {
      beforeEach(() => {
        globalThis.CY_TEST_MOCK.listenForProjectEnd = { stats: { failures: 0 } }
      })

      it('can change the default port to 5544', function () {
        const listen = vi.spyOn(http.Server.prototype, 'listen')
        const open = vi.spyOn(ServerBase.prototype, 'open')

        return assertWithOpenProjectAfterReady(
          cypress.start([`--run-project=${todosPath}`, '--port=5544']),
          (project) => {
            expect(project.cfg.port).toBe(5544)
          },
        ).then(() => {
          expectCalledWith(listen, 5544)
          expectCalledWithMatch(open, { port: 5544 })
          expectExitWith(0)
        })
      })

      it('logs error and exits when port is in use', async function () {
        vi.spyOn(ProjectBase.prototype, 'getAutomation').mockReturnValue({ use: () => {} } as any)
        let server: any = http.createServer()

        server = Promise.promisifyAll(server)

        return server.listenAsync(5544, '127.0.0.1')
        .then(() => {
          return cypress.start([`--run-project=${todosPath}`, '--port=5544'])
        }).then(() => {
          expectExitWithErr('PORT_IN_USE_SHORT', '5544')
        }).finally(() => {
          return server.closeAsync()
        })
      })
    })

    describe('--env', () => {
      beforeEach(() => {
        process.env = _.omit(process.env, 'CYPRESS_DEBUG')
        delete process.env.CYPRESS_COMMERCIAL_RECOMMENDATIONS

        globalThis.CY_TEST_MOCK.listenForProjectEnd = { stats: { failures: 0 } }
      })

      it('can set specific environment variables', function () {
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

      it('parses environment variables with empty values', function () {
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
      it(`with a custom config file fails when it doesn't exist`, function () {
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

    beforeEach(async function () {
      await clearCtx()

      vi.spyOn(api, 'sendPreflight').mockResolvedValue(undefined as any)
      vi.spyOn(api, 'createRun').mockResolvedValue(undefined as any)
      const createInstanceStub = vi.spyOn(api as any, 'createInstance').mockImplementation(() => undefined)

      api.setPreflightResult({ encrypt: false, apiUrl: 'http://localhost:1234' })

      createInstanceStub.mockResolvedValueOnce({
        spec: 'cypress/e2e/app.cy.js',
        runs: [{}],
        runId: '1',
        claimedInstances: 1,
        totalInstances: 1,
        groupId: 1,
        platform: 'linux',
        machineId: 1,
      })

      createInstanceStub.mockResolvedValueOnce({
        spec: null,
        runs: [{}],
        runId: '1',
        claimedInstances: 1,
        totalInstances: 1,
        groupId: 1,
        platform: 'linux',
        machineId: 1,
      })

      stubElectronAppReady()

      globalThis.CY_TEST_MOCK = {
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

      await Promise.all([
        // make sure we have no user object
        user.set({}),

        Promise.resolve()
        .then(() => {
          // Hardcoded so we don't need to create a project to source the config
          projectId = 'abc123'
        }),
      ])

      const ee = mockEE()

      vi.spyOn(launch, 'launch').mockReturnValue(ee)
      vi.spyOn(Windows, 'create').mockReturnValue(ee)
    })

    afterEach(() => {
      api.resetPreflightResult()
    })

    it('uses process.env.CYPRESS_PROJECT_ID', function () {
      vi.spyOn(env, 'get').mockImplementation((key) => key === 'CYPRESS_PROJECT_ID' ? projectId : undefined)

      return cypress.start([
        '--cwd=/foo/bar',
        `--run-project=${noScaffolding}`,
        '--record',
        '--key=token-123',
      ])
      .then(() => {
        expectCalledWithMatch(api.createRun, { projectId })
        expect(errors.warning).not.toHaveBeenCalled()
        expectExitWith(3)
      })
    })

    it('uses process.env.CYPRESS_RECORD_KEY', function () {
      const envValues = {
        CYPRESS_PROJECT_ID: 'foo-project-123',
        CYPRESS_RECORD_KEY: 'token',
      }

      vi.spyOn(env, 'get').mockImplementation((key) => envValues[key])

      return cypress.start([
        '--cwd=/foo/bar',
        `--run-project=${noScaffolding}`,
        '--record',
      ])
      .then(() => {
        expectCalledWithMatch(api.createRun, {
          projectId: 'foo-project-123',
          recordKey: 'token',
        })

        expect(errors.warning).not.toHaveBeenCalled()
        expectExitWith(3)
      })
    })

    it('errors and exits when using --group but ciBuildId could not be generated', function () {
      vi.spyOn(ciProvider, 'provider').mockReturnValue(null)
      vi.spyOn(ciProvider, 'detectableCiBuildIdProviders').mockReturnValue(['circle', 'githubActions'])

      return cypress.start([
        `--run-project=${recordPath}`,
        '--record',
        '--key=token-123',
        '--group=e2e-tests',
      ])
      .then(() => {
        expectExitWithErr('INDETERMINATE_CI_BUILD_ID')

        return snapshotConsoleLogs('INDETERMINATE_CI_BUILD_ID-group')
      })
    })

    it('errors and exits when using --parallel but ciBuildId could not be generated', function () {
      vi.spyOn(ciProvider, 'provider').mockReturnValue(null)
      vi.spyOn(ciProvider, 'detectableCiBuildIdProviders').mockReturnValue(['circle', 'githubActions'])

      return cypress.start([
        `--run-project=${recordPath}`,
        '--record',
        '--key=token-123',
        '--parallel',
      ])
      .then(() => {
        expectExitWithErr('INDETERMINATE_CI_BUILD_ID')

        return snapshotConsoleLogs('INDETERMINATE_CI_BUILD_ID-parallel')
      })
    })

    it('errors and exits when using --parallel and --group but ciBuildId could not be generated', function () {
      vi.spyOn(ciProvider, 'provider').mockReturnValue(null)
      vi.spyOn(ciProvider, 'detectableCiBuildIdProviders').mockReturnValue(['circle', 'githubActions'])

      return cypress.start([
        `--run-project=${recordPath}`,
        '--record',
        '--key=token-123',
        '--group=e2e-tests-chrome',
        '--parallel',
      ])
      .then(() => {
        expectExitWithErr('INDETERMINATE_CI_BUILD_ID')

        return snapshotConsoleLogs('INDETERMINATE_CI_BUILD_ID-parallel-group')
      })
    })

    it('errors and exits when using --ci-build-id with no group or parallelization', function () {
      return cypress.start([
        `--run-project=${recordPath}`,
        '--record',
        '--key=token-123',
        '--ci-build-id=ciBuildId123',
      ])
      .then(() => {
        expectExitWithErr('INCORRECT_CI_BUILD_ID_USAGE')

        return snapshotConsoleLogs('INCORRECT_CI_BUILD_ID_USAGE')
      })
    })

    it('errors and exits when using --ci-build-id without recording', function () {
      return cypress.start([
        `--run-project=${recordPath}`,
        '--ci-build-id=ciBuildId123',
      ])
      .then(() => {
        expectExitWithErr('RECORD_PARAMS_WITHOUT_RECORDING')

        return snapshotConsoleLogs('RECORD_PARAMS_WITHOUT_RECORDING-ciBuildId')
      })
    })

    it('errors and exits when using --group without recording', function () {
      return cypress.start([
        `--run-project=${recordPath}`,
        '--group=e2e-tests',
      ])
      .then(() => {
        expectExitWithErr('RECORD_PARAMS_WITHOUT_RECORDING')

        return snapshotConsoleLogs('RECORD_PARAMS_WITHOUT_RECORDING-group')
      })
    })

    it('errors and exits when using --parallel without recording', function () {
      return cypress.start([
        `--run-project=${recordPath}`,
        '--parallel',
      ])
      .then(() => {
        expectExitWithErr('RECORD_PARAMS_WITHOUT_RECORDING')

        return snapshotConsoleLogs('RECORD_PARAMS_WITHOUT_RECORDING-parallel')
      })
    })

    it('errors and exits when using --tag without recording', function () {
      return cypress.start([
        `--run-project=${recordPath}`,
        '--tag=nightly',
      ])
      .then(() => {
        expectExitWithErr('RECORD_PARAMS_WITHOUT_RECORDING')

        return snapshotConsoleLogs('RECORD_PARAMS_WITHOUT_RECORDING-tag')
      })
    })

    it('errors and exits when using --group and --parallel without recording', function () {
      return cypress.start([
        `--run-project=${recordPath}`,
        '--tag=nightly',
        '--group=electron-smoke-tests',
        '--parallel',
      ])
      .then(() => {
        expectExitWithErr('RECORD_PARAMS_WITHOUT_RECORDING')

        return snapshotConsoleLogs('RECORD_PARAMS_WITHOUT_RECORDING-group-parallel')
      })
    })

    it('errors and exits when using --auto-cancel-after-failures without recording', function () {
      return cypress.start([
        `--run-project=${recordPath}`,
        '--auto-cancel-after-failures=4',
      ])
      .then(() => {
        expectExitWithErr('RECORD_PARAMS_WITHOUT_RECORDING')

        return snapshotConsoleLogs('RECORD_PARAMS_WITHOUT_RECORDING-auto-cancel-after-failures')
      })
    })

    it('does not truncate a really long Cypress Cloud url', function () {
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
        return snapshotConsoleLogs('Long Cypress Cloud URL')
      })
    })

    it('errors and exits when group name is not unique and explicitly passed ciBuildId', function () {
      const err: any = new Error()

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

        return snapshotConsoleLogs('CLOUD_RUN_GROUP_NAME_NOT_UNIQUE')
      })
    })

    it('errors and exits when parallel group params are different', function () {
      vi.spyOn(system, 'info').mockReturnValue({
        osName: 'darwin',
        osVersion: 'v1',
      } as any)

      vi.spyOn(browsers, 'ensureAndGetByNameOrPath').mockResolvedValue({
        version: '59.1.2.3',
        displayName: 'Electron',
      } as any)

      const err: any = new Error()

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

        return snapshotConsoleLogs('CLOUD_PARALLEL_GROUP_PARAMS_MISMATCH')
      })
    })

    it('errors and exits when parallel is not allowed', function () {
      const err: any = new Error()

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

        return snapshotConsoleLogs('CLOUD_PARALLEL_DISALLOWED')
      })
    })

    it('errors and exits when parallel is required', function () {
      const err: any = new Error()

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

        return snapshotConsoleLogs('CLOUD_PARALLEL_REQUIRED')
      })
    })

    it('errors and exits when run is already complete', function () {
      const err: any = new Error()

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

        return snapshotConsoleLogs('CLOUD_ALREADY_COMPLETE')
      })
    })

    it('errors and exits when run is stale', function () {
      const err: any = new Error()

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

        return snapshotConsoleLogs('CLOUD_STALE_RUN')
      })
    })

    it('errors and exits when auto cancel mismatch', function () {
      const err: any = new Error()

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

        return snapshotConsoleLogs('CLOUD_AUTO_CANCEL_MISMATCH')
      })
    })

    describe('cloud recommendation message', () => {
      it('does not display if --record is passed', function () {
        vi.spyOn(ciProvider, 'getIsCi').mockReturnValue(true)
        delete process.env.CYPRESS_COMMERCIAL_RECOMMENDATIONS
        globalThis.CY_TEST_MOCK.listenForProjectEnd = { stats: { failures: 1 } }

        return cypress.start([
          `--run-project=${recordPath}`,
          '--record',
          '--key=token-123',
          '--group=electron-smoke-tests',
          '--ciBuildId=ciBuildId123',
          '--auto-cancel-after-failures=4',
        ])
        .then(() => {
          expectNotCalledWith(console.log, cloudRecommendationMessage)
        })
      })
    })
  })

  describe('--return-pkg', () => {
    beforeEach(() => {
      vi.mocked(console.log).mockImplementation(() => {})
    })

    it('logs package.json and exits', function () {
      return cypress.start(['--return-pkg'])
      .then(() => {
        expectCalledWithMatch(console.log, '{"name":"cypress"')
        expectExitWith(0)
      })
    })
  })

  describe('--version', () => {
    beforeEach(() => {
      vi.mocked(console.log).mockImplementation(() => {})
    })

    it('logs version and exits', function () {
      return cypress.start(['--version'])
      .then(() => {
        expectCalledWith(console.log, pkg.version)
        expectExitWith(0)
      })
    })
  })

  describe('--smoke-test', () => {
    beforeEach(() => {
      vi.mocked(console.log).mockImplementation(() => {})
    })

    it('logs pong value and exits', function () {
      return cypress.start(['--smoke-test', '--ping=abc123'])
      .then(() => {
        expectCalledWith(console.log, 'abc123')
        expectExitWith(0)
      })
    })
  })

  describe('interactive', () => {
    beforeEach(async function () {
      const win = {
        on: vi.fn(),
        webContents: {
          on: vi.fn(),
        },
      }

      await clearCtx()

      stubElectronAppReady()
      vi.spyOn(Windows, 'open').mockResolvedValue(win as any)
      vi.spyOn(ServerBase.prototype, 'startWebsockets').mockImplementation(() => undefined as any)
      vi.spyOn(electron.ipcMain, 'on').mockImplementation(() => undefined as any)
    })

    it('passes options to interactiveMode.ready', () => {
      vi.spyOn(interactiveMode, 'ready').mockImplementation(() => undefined as any)

      return cypress.start(['--updating', '--port=2121', '--config=pageLoadTimeout=1000'])
      .then(() => {
        expectCalledWithMatch(interactiveMode.ready, {
          updating: true,
          config: {
            port: 2121,
            pageLoadTimeout: 1000,
          },
        })
      })
    })

    // TODO: fix failing test https://github.com/cypress-io/cypress/issues/23149
    // eslint-disable-next-line vitest/no-disabled-tests
    it.skip('passes filtered options to Project#open and sets cli config', async function () {
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

        return openProject.create(todosPath, { ...options, testingType: 'e2e' }, [])
      }).then(() => {
        const projectOptions = openProject.getProject()!.options

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
      stubElectronAppReady()
      vi.spyOn(interactiveMode, 'ready').mockResolvedValue(undefined as any)
      vi.spyOn(errors, 'warning')
    })

    it('shows warning if Cypress has been started directly', () => {
      return cypress.start().then(() => {
        expectCalledWith(errors.warning, 'INVOKED_BINARY_OUTSIDE_NPM_MODULE')
        expectCalledWithMatch(console.log, 'It looks like you are running the Cypress binary directly.')
        expectCalledWithMatch(console.log, 'https://on.cypress.io/installing-cypress')
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
      stubElectronAppReady()
      vi.spyOn(interactiveMode, 'ready').mockResolvedValue(undefined as any)
    })

    it('runs interactiveMode and does not exit', () => {
      return cypress.start().then(() => {
        expect(interactiveMode.ready).toHaveBeenCalledTimes(1)
      })
    })
  })
})
