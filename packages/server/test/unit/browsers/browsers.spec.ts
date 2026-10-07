import os from 'os'
import chalk from 'chalk'
import { createRequire } from 'module'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MockInstance } from 'vitest'
import browsers from '../../../lib/browsers'
import utils from '../../../lib/browsers/utils'
import { EventEmitter } from 'events'
import { exec } from 'child_process'
import util, { isDeepStrictEqual, stripVTControlCharacters as stripAnsi } from 'util'
import electron from '../../../lib/browsers/electron'
import chrome from '../../../lib/browsers/chrome'
import * as firefox from '../../../lib/browsers/firefox'
import Promise from 'bluebird'
import { cypressSessions } from '../../../lib/cypress-sessions'
import { deferred } from '../../support/helpers/deferred'
import { DataContext } from '@packages/data-context/src'
import { graphqlSchema } from '@packages/data-context/graphql/schema'
import { remoteSchemaWrapped as schemaCloud } from '@packages/data-context/graphql/stitching/remoteSchemaWrapped'
import type { BrowserApiShape } from '@packages/data-context/src/sources/BrowserDataSource'
import type { AppApiShape, AuthApiShape, ElectronApiShape, LocalSettingsApiShape, ProjectApiShape, CohortsApiShape } from '@packages/data-context/src/actions'
import { GET_MAJOR_VERSION_FOR_CONTENT } from '@packages/types'
import type { BrowserInstance } from '../../../lib/browsers/types'
import type { FoundBrowser } from '@packages/types/src/browser'

// Building the real schemas in this worker loads a second `graphql` realm, which
// `graphql` rejects. Launching a browser never queries either schema.
vi.mock('@packages/data-context/graphql/schema', () => {
  return { graphqlSchema: {} }
})

vi.mock('@packages/data-context/graphql/stitching/remoteSchemaWrapped', () => {
  return { remoteSchemaWrapped: {} }
})

vi.mock('electron', async () => {
  const { default: electronStub } = await import('../../support/helpers/electron_stub')

  return { ...electronStub, default: electronStub }
})

// Type for simplified browser objects used in tests
type TestBrowser = Pick<FoundBrowser, 'name' | 'channel'>

// Type for Cypress error objects used in tests
type CypressErrorType = {
  type: 'BROWSER_NOT_FOUND_BY_NAME'
  message?: string
}

// Type for URL strings used in tests
type TestUrl = 'http://localhost:3000'

// Type for minimal browser instance data used in setFocus tests
type MinimalBrowserData = {
  pid: number
}

// Type for electron browser objects used in tests
type TestElectronBrowser = {
  name: 'electron'
  family: 'chromium'
}

// Type for browser options array used in tests
type BrowserOptionsArray = Array<{ family: 'chromium' } | { url: string, onBrowserOpen?: () => void } | null | DataContext>

const normalizeSnapshot = (str: string) => {
  expect(stripAnsi(str)).toMatchSnapshot()
}

const BROWSER_LIST_REGEX = /(found on your system are:)(?:\n - .*)*/

const normalizeBrowsers = (message: string) => {
  return message.replace(BROWSER_LIST_REGEX, '$1\n - chrome\n - firefox\n - electron')
}

// sinon's calledWith matches a prefix of the recorded arguments
const callsStartingWith = (mock: MockInstance, ...expected: unknown[]) => {
  return mock.mock.calls.filter((call) => isDeepStrictEqual(call.slice(0, expected.length), expected))
}

// sinon's calledBefore: the first call of `first` precedes the last call of `second`
const calledBefore = (first: MockInstance, second: MockInstance) => {
  const firstOrder = first.mock.invocationCallOrder
  const secondOrder = second.mock.invocationCallOrder

  if (!firstOrder.length) {
    return false
  }

  if (!secondOrder.length) {
    return true
  }

  return firstOrder[0] < secondOrder[secondOrder.length - 1]
}

const createTestDataContext = () => {
  return new DataContext({
    schema: graphqlSchema,
    schemaCloud,
    mode: 'run',
    modeOptions: {},
    appApi: {} as AppApiShape,
    localSettingsApi: {
      getPreferences: vi.fn(async () => {
        return {
          majorVersionWelcomeDismissed: { [GET_MAJOR_VERSION_FOR_CONTENT()]: 123456 },
          notifyWhenRunCompletes: ['failed'],
        }
      }),
      getAvailableEditors: vi.fn(),
      setPreferences: vi.fn(),
    } as unknown as LocalSettingsApiShape,
    authApi: {
      logIn: vi.fn(() => {
        throw new Error('not stubbed')
      }),
      resetAuthState: vi.fn(),
    } as unknown as AuthApiShape,
    projectApi: {
      closeActiveProject: vi.fn(),
      insertProjectToCache: vi.fn(async () => {}),
      getProjectRootsFromCache: vi.fn(async () => []),
      runSpec: vi.fn(),
      routeToDebug: vi.fn(),
    } as unknown as ProjectApiShape,
    electronApi: {
      isMainWindowFocused: vi.fn(() => false),
      focusMainWindow: vi.fn(),
      copyTextToClipboard: (text) => {},
    } as unknown as ElectronApiShape,
    browserApi: {
      focusActiveBrowserWindow: vi.fn(),
      getBrowsers: vi.fn(async () => []),
    } as unknown as BrowserApiShape,
    cohortsApi: {
      getCohorts: vi.fn(async () => {}),
      getCohort: vi.fn(async () => {}),
      insertCohort: vi.fn(),
      determineCohort: vi.fn(async () => {}),
    } as unknown as CohortsApiShape,
  })
}

// lib/browsers/index.ts picks a launcher with a bare `require()`, which bypasses vite's
// module graph; point those requires at the instances this spec spies on
const requireCjs = createRequire(import.meta.url)
const launcherPaths = [
  [requireCjs.resolve('../../../lib/browsers/electron'), electron],
  [requireCjs.resolve('../../../lib/browsers/chrome'), chrome],
  [requireCjs.resolve('../../../lib/browsers/firefox'), firefox],
] as const

// When we added component testing mode, we added the option for electron to be omitted
type ProcessVersionsWithElectron = Omit<NodeJS.ProcessVersions, 'electron'> & {
  electron?: string | boolean | undefined
}

const processVersions = process.versions as ProcessVersionsWithElectron
const originalElectronVersion = processVersions.electron

beforeAll(() => {
  processVersions.electron = true

  for (const [launcherPath, launcher] of launcherPaths) {
    requireCjs.cache[launcherPath] = { exports: launcher, loaded: true } as unknown as NodeModule
  }
})

let ctx: DataContext

beforeEach(() => {
  ctx = createTestDataContext()
})

afterEach(() => {
  vi.restoreAllMocks()
})

afterAll(() => {
  processVersions.electron = originalElectronVersion

  for (const [launcherPath] of launcherPaths) {
    delete requireCjs.cache[launcherPath]
  }
})

describe('lib/browsers/index', () => {
  describe('.getBrowserInstance', () => {
    it('returns instance', () => {
      const browserInstance = new EventEmitter() as BrowserInstance

      browserInstance.kill = () => {
        browserInstance.emit('exit')
      }

      browserInstance.pid = 1234
      const instance = browserInstance

      browsers._setInstance(instance)

      expect(browsers.getBrowserInstance()).toBe(instance)
    })

    it('returns undefined if no instance', () => {
      browsers._setInstance(null)

      expect(browsers.getBrowserInstance()).toBeNull()
    })
  })

  describe('.isBrowserFamily', () => {
    it('allows only known browsers', () => {
      expect(browsers.isBrowserFamily('chromium')).toBe(true)
      expect(browsers.isBrowserFamily('firefox')).toBe(true)
      expect(browsers.isBrowserFamily('chrome')).toBe(false)
      expect(browsers.isBrowserFamily('electron')).toBe(false)

      expect(browsers.isBrowserFamily('my-favorite-browser')).toBe(false)
    })
  })

  describe('.ensureAndGetByNameOrPath', () => {
    it('returns browser by name', () => {
      const foundBrowsers: TestBrowser[] = [
        { name: 'foo', channel: 'stable' },
        { name: 'bar', channel: 'stable' },
      ]

      return browsers.ensureAndGetByNameOrPath('foo', false, foundBrowsers as FoundBrowser[])
      .then((browser: TestBrowser) => {
        expect(browser).toEqual({ name: 'foo', channel: 'stable' })
      })
    })

    it('throws when no browser can be found', async () => {
      const foundBrowsers: TestBrowser[] = [
        { name: 'chrome', channel: 'stable' },
        { name: 'firefox', channel: 'stable' },
        { name: 'electron', channel: 'stable' },
      ]

      const err: CypressErrorType = await browsers.ensureAndGetByNameOrPath('browserNotGonnaBeFound', false, foundBrowsers as FoundBrowser[])
      .then(() => {
        throw new Error('expected promise to reject')
      }, (e) => e)

      expect(err).toMatchObject({ type: 'BROWSER_NOT_FOUND_BY_NAME' })

      normalizeSnapshot(normalizeBrowsers(stripAnsi(err.message!)))
    })

    it('throws a special error when canary is passed', async () => {
      const foundBrowsers: TestBrowser[] = [
        { name: 'chrome', channel: 'stable' },
        { name: 'chrome', channel: 'canary' },
        { name: 'firefox', channel: 'stable' },
      ]

      const err: CypressErrorType = await browsers.ensureAndGetByNameOrPath('canary', false, foundBrowsers as FoundBrowser[])
      .then(() => {
        throw new Error('expected promise to reject')
      }, (e) => e)

      expect(err).toMatchObject({ type: 'BROWSER_NOT_FOUND_BY_NAME' })

      normalizeSnapshot(err.message!)
    })

    it('throws BROWSER_NOT_FOUND_BY_NAME when --browser is passed without a value', async () => {
      const foundBrowsers: TestBrowser[] = [
        { name: 'chrome', channel: 'stable' },
        { name: 'electron', channel: 'stable' },
      ]

      await expect(browsers.ensureAndGetByNameOrPath(true as any, false, foundBrowsers as FoundBrowser[]))
      .rejects.toMatchObject({ type: 'BROWSER_NOT_FOUND_BY_NAME' })
    })

    it('throws BROWSER_NOT_FOUND_BY_NAME when nameOrPath is undefined', async () => {
      const foundBrowsers: TestBrowser[] = [
        { name: 'chrome', channel: 'stable' },
        { name: 'electron', channel: 'stable' },
      ]

      await expect(browsers.ensureAndGetByNameOrPath(undefined as any, false, foundBrowsers as FoundBrowser[]))
      .rejects.toMatchObject({ type: 'BROWSER_NOT_FOUND_BY_NAME' })
    })
  })

  describe('.connectCyPromptToBrowser', () => {
    it('connects browser to cy prompt', async () => {
      vi.spyOn(chrome, 'connectCyPromptToBrowser').mockResolvedValue(undefined)
      await browsers.connectCyPromptToBrowser({
        browser: {
          family: 'chromium',
        },
      })

      expect(chrome.connectCyPromptToBrowser).toHaveBeenCalled()
    })
  })

  describe('.connectStudioToBrowser', () => {
    it('connects browser to studio', async () => {
      vi.spyOn(chrome, 'connectStudioToBrowser').mockResolvedValue(undefined)
      await browsers.connectStudioToBrowser({
        browser: {
          family: 'chromium',
        },
        studioManager: {} as any,
      })

      expect(chrome.connectStudioToBrowser).toHaveBeenCalled()
    })
  })

  describe('.closeProtocolConnection', () => {
    it('calls close on instance', async () => {
      vi.spyOn(chrome, 'closeProtocolConnection').mockResolvedValue(undefined)
      await browsers.closeProtocolConnection({
        browser: {
          family: 'chromium',
        } as any,
      })

      expect(chrome.closeProtocolConnection).toHaveBeenCalled()
    })
  })

  describe('.connectToNewSpec', () => {
    it(`throws an error if browser family doesn't exist`, () => {
      return browsers.connectToNewSpec({
        name: 'foo-bad-bang',
        family: 'foo-bad',
      } as any, {
        browsers: [],
      } as any, null)
      .then((e: any) => {
        throw new Error('should\'ve failed')
      })
      .catch((err: CypressErrorType) => {
        // by being explicit with assertions, if something is unexpected
        // we will get good error message that includes the "err" object
        expect(err).toHaveProperty('type', 'BROWSER_NOT_FOUND_BY_NAME')

        expect(err).toHaveProperty('message')
        expect(err.message).toContain(`Browser: ${chalk.yellow('foo-bad-bang')} was not found on your system or is not supported by Cypress.`)
      })
    })
  })

  describe('.open', () => {
    it(`throws an error if browser family doesn't exist`, () => {
      return browsers.open({
        name: 'foo-bad-bang',
        family: 'foo-bad',
      } as any, {
        browsers: [],
      } as any, null, ctx)
      .then((e: any) => {
        throw new Error('should\'ve failed')
      })
      .catch((err: CypressErrorType) => {
        // by being explicit with assertions, if something is unexpected
        // we will get good error message that includes the "err" object
        expect(err).toHaveProperty('type', 'BROWSER_NOT_FOUND_BY_NAME')

        expect(err).toHaveProperty('message')
        expect(err.message).toContain(`Browser: ${chalk.yellow('foo-bad-bang')} was not found on your system`)
      })
    })

    // https://github.com/cypress-io/cypress/issues/24377
    it('terminates orphaned browser if it connects while launching another instance', async () => {
      const browserOptions: BrowserOptionsArray = [{
        family: 'chromium',
      }, {
        url: 'http://example.com',
        onBrowserOpen () {},
      }, null, ctx]

      const launchBrowser1 = deferred()
      const browserInstance1 = new EventEmitter() as BrowserInstance

      browserInstance1.kill = vi.fn()
      const chromeOpenStub = vi.spyOn(chrome, 'open').mockImplementation(() => undefined as any)

      chromeOpenStub.mockReturnValueOnce(launchBrowser1.promise as any)

      // attempt to launch browser
      const openBrowser1 = browsers.open.apply(null, browserOptions)
      const launchBrowser2 = deferred()
      const browserInstance2 = new EventEmitter() as BrowserInstance

      browserInstance2.kill = vi.fn()
      chromeOpenStub.mockReturnValueOnce(launchBrowser2.promise as any)

      // original browser launch times out, so we retry launching the browser
      const openBrowser2 = browsers.open.apply(null, browserOptions)

      // in the meantime, the 1st browser launches
      launchBrowser1.resolve(browserInstance1)
      // allow time for 1st browser to set instance before allowing 2nd
      // browser launch to move forward
      await Promise.delay(10)
      // the 2nd browser launches
      launchBrowser2.resolve(browserInstance2)
      // if we exit too soon, it will clear the instance in `open`'s exit
      // handler and not trigger the condition we're looking for
      await Promise.delay(10)
      // finishes killing the 1st browser
      browserInstance1.emit('exit')

      await openBrowser1
      await openBrowser2

      const currentInstance = browsers.getBrowserInstance()

      // clear out instance or afterEach hook will try to kill it and
      // it won't resolve. make sure this is before the assertions or
      // a failing one will prevent it from happening
      browsers._setInstance(null)

      expect(browserInstance1.kill).toHaveBeenCalledTimes(1)
      expect(browserInstance1.isOrphanedBrowserProcess).toBe(true)
      expect(currentInstance).toBe(browserInstance2)
    })

    // https://github.com/cypress-io/cypress/issues/24377
    it('terminates orphaned browser if it connects after another instance launches', async () => {
      const browserOptions: BrowserOptionsArray = [{
        family: 'chromium',
      }, {
        url: 'http://example.com',
        onBrowserOpen () {},
      }, null, ctx]

      const launchBrowser1 = deferred()
      const browserInstance1 = new EventEmitter() as BrowserInstance

      browserInstance1.kill = vi.fn()
      const chromeOpenStub = vi.spyOn(chrome, 'open').mockImplementation(() => undefined as any)

      chromeOpenStub.mockReturnValueOnce(launchBrowser1.promise as any)

      // attempt to launch browser
      const openBrowser1 = browsers.open.apply(null, browserOptions)
      const launchBrowser2 = deferred()
      const browserInstance2 = new EventEmitter() as BrowserInstance

      browserInstance2.kill = vi.fn()
      chromeOpenStub.mockReturnValueOnce(launchBrowser2.promise as any)

      // original browser launch times out, so we retry launching the browser
      const openBrowser2 = browsers.open.apply(null, browserOptions)

      // the 2nd browser launches
      launchBrowser2.resolve(browserInstance2)

      await openBrowser2

      // but then the 1st browser launches
      launchBrowser1.resolve(browserInstance1)

      // wait a tick for exit listener to be set up, then send 'exit'
      await Promise.delay(10)
      // it should be killed (asserted below)
      // this finishes killing the 1st browser
      browserInstance1.emit('exit')

      await openBrowser1

      const currentInstance = browsers.getBrowserInstance()

      // clear out instance or afterEach hook will try to kill it and
      // it won't resolve. make sure this is before the assertions or
      // a failing one will prevent it from happening
      browsers._setInstance(null)

      expect(browserInstance1.kill).toHaveBeenCalledTimes(1)
      expect(browserInstance1.isOrphanedBrowserProcess).toBe(true)
      expect(currentInstance).toBe(browserInstance2)
    })
  })

  describe('.extendLaunchOptionsFromPlugins', () => {
    it('throws an error if unexpected property passed', () => {
      const fn = () => {
        return utils.extendLaunchOptionsFromPlugins({}, { foo: 'bar' }, {})
      }

      // this error is snapshotted in an e2e test, no need to do it here
      expect(fn).toThrow()
    })
  })

  describe('.getMajorVersion', () => {
    it('returns first number when string of numbers', () => {
      expect(utils.getMajorVersion('91.0.4472.106')).toBe(91) // Chromium format
      expect(utils.getMajorVersion('91.0a1')).toBe(91) // Firefox format
    })

    it('is empty string when empty string', () => {
      expect(utils.getMajorVersion('')).toBe('') // fallback if no version
    })

    // https://github.com/cypress-io/cypress/issues/15485
    it('returns version when unconventional version format', () => {
      const vers = 'VMware Fusion 12.1.0'

      expect(utils.getMajorVersion(vers)).toBe(vers)
    })
  })

  describe('setFocus', () => {
    it('calls open when running MacOS', () => {
      const mockExec = vi.fn()

      vi.spyOn(os, 'platform').mockReturnValue('darwin')
      vi.spyOn(util, 'promisify').mockReturnValue(mockExec)

      const browserData: MinimalBrowserData = {
        pid: 3333,
      }

      browsers._setInstance(browserData as any)

      browsers.setFocus()

      expect(callsStartingWith(vi.mocked(util.promisify), exec)).not.toHaveLength(0)
      expect(callsStartingWith(mockExec, `open -a "$(ps -p 3333 -o comm=)"`)).not.toHaveLength(0)
    })

    it('calls WScript AppActivate to activate the window when running Windows', () => {
      const mockExec = vi.fn()

      vi.spyOn(os, 'platform').mockReturnValue('win32')
      vi.spyOn(util, 'promisify').mockReturnValue(mockExec)

      const browserData: MinimalBrowserData = {
        pid: 3333,
      }

      browsers._setInstance(browserData as any)

      browsers.setFocus()

      expect(callsStartingWith(vi.mocked(util.promisify), exec)).not.toHaveLength(0)
      expect(callsStartingWith(mockExec, `(New-Object -ComObject WScript.Shell).AppActivate(((Get-WmiObject -Class win32_process -Filter "ParentProcessID = '3333'") | Select -ExpandProperty ProcessId))`, { shell: 'powershell.exe' })).not.toHaveLength(0)
    })
  })

  describe('kill', () => {
    it('allows registered emitter events to fire before kill', () => {
      const browserInstance = new EventEmitter() as BrowserInstance

      browserInstance.kill = () => {
        browserInstance.emit('exit')
      }

      const removeAllListenersSpy = vi.spyOn(browserInstance, 'removeAllListeners')

      const instance = browserInstance

      browsers._setInstance(instance)

      const exitSpy = vi.fn()

      browserInstance.once('exit', () => {
        exitSpy()
      })

      return browsers.close().then(() => {
        expect(calledBefore(exitSpy, removeAllListenersSpy)).toBe(true)
        expect(browsers.getBrowserInstance()).toBe(null)
      })
    })

    it('stops waiting on a browser that never exits once timeoutMs elapses', async () => {
      const browserInstance = new EventEmitter() as BrowserInstance

      // never emits 'exit', as a browser whose process is slow to be reaped
      browserInstance.kill = vi.fn()

      browsers._setInstance(browserInstance)

      const startedAt = Date.now()

      const removeAllListenersSpy = vi.spyOn(browserInstance, 'removeAllListeners')

      await browsers.close({ timeoutMs: 50 })

      expect(Date.now() - startedAt).toBeLessThan(1000)
      expect(browserInstance.kill).toHaveBeenCalledTimes(1)
      // the process is still alive, so its later events still need listeners
      expect(removeAllListenersSpy).not.toHaveBeenCalled()
    })

    it('waits indefinitely when timeoutMs is present but undefined', async () => {
      const browserInstance = new EventEmitter() as BrowserInstance

      browserInstance.kill = vi.fn()

      browsers._setInstance(browserInstance)

      // open_project always passes the option object, so an absent bound arrives as an explicit
      // undefined property; it has to keep waiting, the way a project switch relies on
      let settled = false
      const closed = browsers.close({ timeoutMs: undefined }).then(() => {
        settled = true
      })

      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(settled).toBe(false)

      browserInstance.emit('exit')
      await closed

      expect(settled).toBe(true)
    })

    it('waits indefinitely when no timeoutMs is given', async () => {
      const browserInstance = new EventEmitter() as BrowserInstance

      browserInstance.kill = vi.fn()

      browsers._setInstance(browserInstance)

      let settled = false
      const closed = browsers.close().then(() => {
        settled = true
      })

      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(settled).toBe(false)

      browserInstance.emit('exit')
      await closed

      expect(settled).toBe(true)
    })
  })

  describe('browserStatus', () => {
    it('calls setBrowserStatus with correct lifecycle state', () => {
      const url: TestUrl = 'http://localhost:3000'
      const browserInstance = new EventEmitter() as BrowserInstance

      browserInstance.kill = () => {
        browserInstance.emit('exit')
      }

      const instance = browserInstance

      browsers._setInstance(instance)

      vi.spyOn(electron, 'open').mockResolvedValue(instance)
      const setBrowserStatus = vi.spyOn(ctx.actions.app, 'setBrowserStatus')

      // Stub to speed up test, we don't care about the delay
      vi.spyOn(Promise, 'delay').mockResolvedValue(undefined as any)

      const browserData: TestElectronBrowser = {
        name: 'electron',
        family: 'chromium',
      }

      return browsers.open(browserData as any, { url } as any, null, ctx).then(browsers.close).then(() => {
        ['opening', 'open', 'closed'].forEach((status, i) => {
          expect(setBrowserStatus.mock.calls[i][0]).toBe(status)
        })
      })
    })
  })

  describe('didBrowserPreviouslyHaveUnexpectedExit', () => {
    it('sets didBrowserPreviouslyHaveUnexpectedExit when the browser unexpectedly closes', () => {
      const url: TestUrl = 'http://localhost:3000'
      const browserInstance = new EventEmitter() as BrowserInstance

      browserInstance.kill = () => {
        browserInstance.emit('exit')
      }

      const instance = browserInstance

      browsers._setInstance(instance)

      vi.spyOn(electron, 'open').mockResolvedValue(instance)
      vi.spyOn(ctx.actions.app, 'setBrowserStatus')

      // Stub to speed up test, we don't care about the delay
      vi.spyOn(Promise, 'delay').mockResolvedValue(undefined as any)

      return browsers.open({ name: 'electron', family: 'chromium' } as any, { url } as any, null, ctx).then(browsers.close).then(() => {
        expect(ctx.coreData.didBrowserPreviouslyHaveUnexpectedExit).toBe(true)
      })
    })
  })

  // Recorded for every family, not just the ones that speak CDP, so an external
  // tool can tell a browser it cannot drive from no browser at all.
  describe('cypress sessions browser', () => {
    it('does not record the browser when launch fails', async () => {
      const setBrowser = vi.spyOn(cypressSessions, 'setBrowser')
      const browser = { name: 'firefox', family: 'firefox', displayName: 'Firefox' }
      const launchError = new Error('failed to launch')

      browsers._setInstance(null)
      vi.spyOn(firefox, 'open').mockRejectedValue(launchError)

      await expect(browsers.open(browser as any, { url: 'http://localhost:3000' } as any, null, ctx)).rejects.toBe(launchError)

      expect(callsStartingWith(setBrowser, browser)).toHaveLength(0)
    })

    it('does not record the browser when connecting fails', async () => {
      const setBrowser = vi.spyOn(cypressSessions, 'setBrowser')
      const browser = { name: 'firefox', family: 'firefox', displayName: 'Firefox' }
      const connectError = new Error('failed to connect')

      vi.spyOn(firefox, 'connectToExisting').mockRejectedValue(connectError)

      await expect(browsers.connectToExisting(browser as any, { browsers: [] } as any, null)).rejects.toBe(connectError)

      expect(callsStartingWith(setBrowser, browser)).toHaveLength(0)
    })

    it('records the browser on launch and clears it when the browser exits', async () => {
      const setBrowser = vi.spyOn(cypressSessions, 'setBrowser')
      const url: TestUrl = 'http://localhost:3000'
      const browserInstance = new EventEmitter() as BrowserInstance

      browserInstance.kill = () => {
        browserInstance.emit('exit')
      }

      browsers._setInstance(browserInstance)

      vi.spyOn(firefox, 'open').mockResolvedValue(browserInstance)
      vi.spyOn(firefox, 'clearInstanceState').mockImplementation(() => undefined)
      vi.spyOn(Promise, 'delay').mockResolvedValue(undefined as any)

      const browser = { name: 'firefox', family: 'firefox', displayName: 'Firefox' }

      await browsers.open(browser as any, { url, onBrowserClose: vi.fn() } as any, null, ctx)

      expect(callsStartingWith(setBrowser, browser)).not.toHaveLength(0)

      browserInstance.emit('exit')

      expect(callsStartingWith(setBrowser, null)).not.toHaveLength(0)
    })
  })

  describe('browser cleanup', () => {
    it('calls onBrowserClose callback on close', () => {
      const onBrowserClose = vi.fn()
      const url: TestUrl = 'http://localhost:3000'
      const browserInstance = new EventEmitter() as BrowserInstance

      browserInstance.kill = () => {
        browserInstance.emit('exit')
      }

      const instance = browserInstance

      browsers._setInstance(instance)

      vi.spyOn(electron, 'open').mockResolvedValue(instance)
      vi.spyOn(ctx.actions.app, 'setBrowserStatus')

      // Stub to speed up test, we don't care about the delay
      vi.spyOn(Promise, 'delay').mockResolvedValue(undefined as any)

      return browsers.open({ name: 'electron', family: 'chromium' } as any, { url, onBrowserClose } as any, null, ctx).then(() => {
        // Simulate browser exit
        browserInstance.emit('exit')

        expect(onBrowserClose).toHaveBeenCalled()
      })
    })

    it('marks the browser crashed before clearing instance state when the process crashes', async () => {
      const onError = vi.fn()
      const url: TestUrl = 'http://localhost:3000'
      const browserInstance = new EventEmitter() as BrowserInstance

      browserInstance.kill = () => {
        browserInstance.emit('exit')
      }

      const instance = browserInstance

      browsers._setInstance(instance)

      vi.spyOn(electron, 'open').mockResolvedValue(instance)
      const markBrowserCrashed = vi.spyOn(electron, 'markBrowserCrashed')
      const clearInstanceState = vi.spyOn(electron, 'clearInstanceState')

      vi.spyOn(ctx.actions.app, 'setBrowserStatus')

      // Stub to speed up test, we don't care about the delay
      vi.spyOn(Promise, 'delay').mockResolvedValue(undefined as any)

      await browsers.open({ name: 'electron', family: 'chromium' } as any, { url, onError, onBrowserClose: vi.fn() } as any, null, ctx)

      // Simulate a browser *process* crash (exits with SIGTRAP and no code)
      browserInstance.emit('exit', null, 'SIGTRAP')

      // the exit handler awaits onError, so flush microtasks before asserting
      await Promise.delay(0)

      expect(markBrowserCrashed, 'marks the browser crashed').toHaveBeenCalledTimes(1)
      // crucially, the CRI client must be marked crashed *before* it is torn down so
      // that in-flight/subsequent teardown CDP commands reject instead of hanging
      expect(calledBefore(markBrowserCrashed, clearInstanceState)).toBe(true)
      expect(onError, 'reports the crash').toHaveBeenCalledTimes(1)
    })

    it('does not mark the browser crashed on a graceful (non-crash) exit', async () => {
      const onError = vi.fn()
      const url: TestUrl = 'http://localhost:3000'
      const browserInstance = new EventEmitter() as BrowserInstance

      browserInstance.kill = () => {
        browserInstance.emit('exit')
      }

      const instance = browserInstance

      browsers._setInstance(instance)

      vi.spyOn(electron, 'open').mockResolvedValue(instance)
      const markBrowserCrashed = vi.spyOn(electron, 'markBrowserCrashed')

      vi.spyOn(ctx.actions.app, 'setBrowserStatus')

      // Stub to speed up test, we don't care about the delay
      vi.spyOn(Promise, 'delay').mockResolvedValue(undefined as any)

      await browsers.open({ name: 'electron', family: 'chromium' } as any, { url, onError, onBrowserClose: vi.fn() } as any, null, ctx)

      // SIGTERM is an intentional/graceful exit, not a crash
      browserInstance.emit('exit', null, 'SIGTERM')

      await Promise.delay(0)

      expect(markBrowserCrashed).not.toHaveBeenCalled()
      expect(onError).not.toHaveBeenCalled()
    })

    it('calls onBrowserOpen callback', async () => {
      const onBrowserOpen = vi.fn()
      const url: TestUrl = 'http://localhost:3000'
      const browserInstance = new EventEmitter() as BrowserInstance

      browserInstance.kill = () => {
        browserInstance.emit('exit')
      }

      const instance = browserInstance

      browsers._setInstance(instance)

      vi.spyOn(electron, 'open').mockResolvedValue(instance)
      vi.spyOn(ctx.actions.app, 'setBrowserStatus')

      // Stub to speed up test, we don't care about the delay
      vi.spyOn(Promise, 'delay').mockResolvedValue(undefined as any)

      return browsers.open({ name: 'electron', family: 'chromium' } as any, { url, onBrowserOpen } as any, null, ctx).then(() => {
        expect(onBrowserOpen).toHaveBeenCalled()
      })
    })

    it('waits a second to give browser time to open', async () => {
      const url: TestUrl = 'http://localhost:3000'
      const browserInstance = new EventEmitter() as BrowserInstance

      browserInstance.kill = () => {
        browserInstance.emit('exit')
      }

      const instance = browserInstance

      browsers._setInstance(instance)

      vi.spyOn(electron, 'open').mockResolvedValue(instance)
      vi.spyOn(ctx.actions.app, 'setBrowserStatus')

      const delayStub = vi.spyOn(Promise, 'delay').mockResolvedValue(undefined as any)

      return browsers.open({ name: 'electron', family: 'chromium' } as any, { url } as any, null, ctx).then(() => {
        expect(callsStartingWith(delayStub, 1000)).not.toHaveLength(0)
      })
    })

    it('returns instance with kill and removeAllListeners functions', async () => {
      const url: TestUrl = 'http://localhost:3000'
      const browserInstance = new EventEmitter() as BrowserInstance

      browserInstance.kill = () => {
        browserInstance.emit('exit')
      }

      const instance = browserInstance

      browsers._setInstance(instance)

      vi.spyOn(electron, 'open').mockResolvedValue(instance)
      vi.spyOn(ctx.actions.app, 'setBrowserStatus')

      // Stub to speed up test, we don't care about the delay
      vi.spyOn(Promise, 'delay').mockResolvedValue(undefined as any)

      return browsers.open({ name: 'electron', family: 'chromium' } as any, { url } as any, null, ctx).then((returnedInstance: BrowserInstance | null) => {
        expect(returnedInstance!.kill).toBeTypeOf('function')
        expect(returnedInstance!.removeAllListeners).toBeTypeOf('function')
      })
    })
  })
})
