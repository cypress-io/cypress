import os from 'os'
import path from 'path'
import mockfs from 'mock-fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock, MockInstance } from 'vitest'
import * as extension from '@packages/extension'
import * as launch from '@packages/launcher/lib/browsers'
import * as plugins from '../../../lib/plugins'
import utils from '../../../lib/browsers/utils'
import chrome from '../../../lib/browsers/chrome'
import { fs } from '../../../lib/util/fs'
import { BrowserCriClient } from '../../../lib/browsers/browser-cri-client'
import * as protocol from '../../../lib/browsers/protocol'
import { clearCtx, getCtx, makeDataContext, setCtx } from '../../../lib/makeDataContext'

// Building the real schemas in this worker loads a second `graphql` realm, which
// `graphql` rejects. The plugin lifecycle these specs drive never queries either schema.
vi.mock('@packages/data-context/graphql/schema', () => {
  return { graphqlSchema: {} }
})

vi.mock('@packages/data-context/graphql', () => {
  return { remoteSchemaWrapped: {} }
})

const openOpts = {
  onError: () => {},
  useBrowserNetworkInterception: true,
}

// The Fetch-based AUT header injection only runs on the MITM path; the native
// browser (CDP) path hands Fetch ownership to the network runtime instead.
const mitmOpts = {
  ...openOpts,
  useBrowserNetworkInterception: false,
}

// Helper function to create consistent mock preferences for testing
const createMockDefaultPreferences = () => {
  return {
    default: {
      fake_preference: {
        value: 'value',
      },
    },
    defaultSecure: {},
    localState: {
      fake_local_state: {
        value: 'value',
      },
    },
  }
}

// Helper function to mock _getDefaultChromePreferences with consistent fake preferences
const mockGetDefaultChromePreferences = () => {
  return vi.spyOn(chrome, '_getDefaultChromePreferences').mockReturnValue(createMockDefaultPreferences())
}

type PathBehaviors = Record<string, () => Promise<unknown>>

// Answers by the path argument and returns undefined for any other path, like
// a sinon stub configured only through `withArgs(path)`.
const stubFsByPath = (method: 'readJson' | 'outputJson', behaviors: PathBehaviors, fallback: () => (() => Promise<unknown>) | undefined = () => undefined) => {
  return vi.spyOn(fs, method as any).mockImplementation(((p: string) => (behaviors[p] ?? fallback())?.()) as any) as MockInstance
}

const enoent = () => Promise.reject({ code: 'ENOENT' })

const resolved = () => Promise.resolve()

const matchesPrefix = (call: unknown[], expected: unknown[]) => {
  try {
    expect(call.slice(0, expected.length)).toEqual(expected)

    return true
  } catch {
    return false
  }
}

const callsWith = (mock: Mock | MockInstance, ...expected: unknown[]) => {
  return mock.mock.calls.filter((call) => matchesPrefix(call, expected))
}

// sinon's calledWith matches a prefix of the recorded arguments, where vitest's
// toHaveBeenCalledWith requires the exact arity
const expectCalledWith = (mock: Mock | MockInstance, ...expected: unknown[]) => {
  expect(callsWith(mock, ...expected), `calls matching ${String(expected[0])}`).not.toHaveLength(0)
}

const expectNotCalledWith = (mock: Mock | MockInstance, ...expected: unknown[]) => {
  expect(callsWith(mock, ...expected), `calls matching ${String(expected[0])}`).toHaveLength(0)
}

const expectCalledOnceWith = (mock: Mock | MockInstance, ...expected: unknown[]) => {
  expect(mock).toHaveBeenCalledOnce()
  expectCalledWith(mock, ...expected)
}

const listenersFor = (on: Mock, event: string) => {
  return on.mock.calls.filter(([name]) => name === event)
}

// invokes the callback of every `on(event, cb)` call, like sinon's `withArgs(event).yield()`
const yieldTo = (on: Mock, event: string, ...args: unknown[]) => {
  const callbacks = listenersFor(on, event).map((call) => call.find((arg) => typeof arg === 'function'))

  if (!callbacks.length || callbacks.some((cb) => !cb)) {
    throw new Error(`on was never called with ${event} and a callback`)
  }

  callbacks.forEach((cb) => cb(...args))
}

describe('lib/browsers/chrome', () => {
  beforeEach(async () => {
    await clearCtx()
    setCtx(makeDataContext({} as Parameters<typeof makeDataContext>[0]))
  })

  afterEach(async () => {
    await getCtx()._reset()
    await clearCtx()
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  describe('#open', () => {
    let pageCriClient: any
    let browserCriClient: any
    let automation: any
    let launchedBrowser: any
    let onCriEvent: (event: string, data: unknown, options: object) => Promise<void>
    let readJsonByPath: PathBehaviors
    let readJsonFallback: (() => Promise<unknown>) | undefined
    let readJson: MockInstance
    let outputJson: MockInstance
    let writeExtension: MockInstance
    let getProfileDir: MockInstance
    let execute: MockInstance
    let launchSpy: MockInstance

    beforeEach(() => {
      // mock CRI client during testing
      pageCriClient = {
        send: vi.fn(() => Promise.resolve()),
        Page: {
          screencastFrame: vi.fn(),
        },
        close: vi.fn(() => Promise.resolve()),
        on: vi.fn(),
        whenChildTargetHandled: vi.fn(() => Promise.resolve()),
        reenableChildTargetInterception: vi.fn(() => Promise.resolve()),
      }

      const attachedPageCriClient = pageCriClient

      browserCriClient = {
        attachToTargetUrl: vi.fn(() => Promise.resolve(attachedPageCriClient)),
        close: vi.fn(() => Promise.resolve()),
        getWebSocketDebuggerUrl: vi.fn(() => 'ws://debugger'),
      }

      automation = {
        push: vi.fn(),
        use: vi.fn(),
      }

      // mock launched browser child process object
      launchedBrowser = {
        kill: vi.fn(),
      }

      onCriEvent = async (event, data, options) => {
        await chrome.open({ isHeadless: true } as any, 'http://', { ...openOpts, ...options } as any, automation)

        const eventHandler = listenersFor(pageCriClient.on, event).pop()?.[1]

        eventHandler(data)
        pageCriClient.on = undefined
      }

      writeExtension = vi.spyOn(chrome, '_writeExtension').mockResolvedValue('/path/to/ext')
      vi.spyOn(BrowserCriClient, 'create').mockResolvedValue(browserCriClient)
      execute = vi.spyOn(plugins, 'execute')
      launchSpy = vi.spyOn(launch, 'launch').mockResolvedValue(launchedBrowser)
      getProfileDir = vi.spyOn(utils, 'getProfileDir').mockReturnValue('/profile/dir')
      vi.spyOn(utils, 'ensureCleanCache').mockResolvedValue('/profile/dir/CypressCache')
      vi.spyOn(utils, 'initializeCDP').mockResolvedValue()
      outputJson = stubFsByPath('outputJson', { '/profile/dir/Default/Preferences': resolved })

      readJsonFallback = undefined
      readJsonByPath = {
        '/profile/dir/Default/Preferences': enoent,
        '/profile/dir/Default/Secure Preferences': enoent,
        '/profile/dir/Local State': enoent,
      }

      readJson = stubFsByPath('readJson', readJsonByPath, () => readJsonFallback)

      // port for Chrome remote interface communication
      vi.spyOn(utils, 'getPort').mockResolvedValue(50505)
    })

    afterEach(() => {
      mockfs.restore()
    })

    it('focuses on the page, calls CRI Page.navigate, enables Page/Network/Fetch events, and sets download behavior', async () => {
      await chrome.open({ isHeadless: true } as any, 'http://', mitmOpts as any, automation)

      expect(utils.getPort).toHaveBeenCalledOnce() // to get remote interface port

      expect(pageCriClient.send).toHaveBeenCalledTimes(7)
      expectCalledWith(pageCriClient.send, 'Page.bringToFront')
      expectCalledWith(pageCriClient.send, 'Page.navigate')
      expectCalledWith(pageCriClient.send, 'Page.enable')
      expectCalledWith(pageCriClient.send, 'Page.setDownloadBehavior')
      expectCalledWith(pageCriClient.send, 'Network.enable')
      expectCalledWith(pageCriClient.send, 'Fetch.enable')
      expectCalledWith(pageCriClient.send, 'ServiceWorker.enable')

      expectCalledOnceWith(utils.initializeCDP as any, pageCriClient, automation, false)
    })

    it('leaves Fetch to the network runtime on the browser (CDP) network path', async () => {
      await chrome.open({ isHeadless: true } as any, 'http://', openOpts as any, automation)

      expectNotCalledWith(pageCriClient.send, 'Fetch.enable')
      expectCalledWith(pageCriClient.send, 'Page.navigate')
      expectCalledOnceWith(utils.initializeCDP as any, pageCriClient, automation, true)
    })

    // #34674: a service worker auto-attaches on both the browser and page
    // connections; the browser connection defers releasing it until the page
    // connection confirms session-scoped Fetch interception is in place.
    it('wires waitForChildTargetInterception to the page client on the browser (CDP) network path', async () => {
      await chrome.open({ isHeadless: true } as any, 'http://', openOpts as any, automation)

      expect(browserCriClient.waitForChildTargetInterception).toBeTypeOf('function')

      browserCriClient.waitForChildTargetInterception('target-id')

      expectCalledWith(pageCriClient.whenChildTargetHandled, 'target-id')
    })

    // #34674: a paused service worker's browser-level attach handler consults
    // this field - if it were only set after navigation started, an attach
    // racing the navigation could read it as unset and skip the wait.
    it('wires waitForChildTargetInterception before navigating', async () => {
      let wasSetBeforeNavigate = false

      pageCriClient.send = vi.fn((command) => {
        if (command === 'Page.navigate' && typeof browserCriClient.waitForChildTargetInterception === 'function') {
          wasSetBeforeNavigate = true
        }

        return Promise.resolve()
      })

      await chrome.open({ isHeadless: true } as any, 'http://', openOpts as any, automation)

      expect(wasSetBeforeNavigate).toBe(true)
    })

    it('does not wire waitForChildTargetInterception on the MITM path', async () => {
      await chrome.open({ isHeadless: true } as any, 'http://', mitmOpts as any, automation)

      expect(browserCriClient.waitForChildTargetInterception).toBeUndefined()
    })

    // #34674: a crash-reloaded target's confirmation can't be trusted as-is
    // (no way to tell a stale one from a fresh one), so the browser
    // connection asks the page connection to re-enable interception outright
    // instead of merely reading whatever it has on file.
    it('wires reenableChildTargetInterception to the page client on the browser (CDP) network path', async () => {
      await chrome.open({ isHeadless: true } as any, 'http://', openOpts as any, automation)

      expect(browserCriClient.reenableChildTargetInterception).toBeTypeOf('function')

      browserCriClient.reenableChildTargetInterception('target-id')

      expectCalledWith(pageCriClient.reenableChildTargetInterception, 'target-id')
    })

    it('does not wire reenableChildTargetInterception on the MITM path', async () => {
      await chrome.open({ isHeadless: true } as any, 'http://', mitmOpts as any, automation)

      expect(browserCriClient.reenableChildTargetInterception).toBeUndefined()
    })

    it('executeBeforeBrowserLaunch is noop if before:browser:launch is not registered', async () => {
      await chrome.open({ isHeadless: true } as any, 'http://', openOpts as any, automation)

      expectNotCalledWith(execute, 'before:browser:launch')
    })

    it('uses default args if new args are not returned from before:browser:launch', async () => {
      const args = []

      vi.spyOn(chrome, '_getArgs').mockReturnValue(args)
      vi.spyOn(plugins, 'has').mockReturnValue(true)

      execute.mockResolvedValue(null)

      await chrome.open({ isHeadless: true } as any, 'http://', openOpts as any, automation)

      // to initialize remote interface client and prepare for true tests
      // we load the browser with blank page first
      expectCalledWith(launchSpy, { isHeadless: true }, 'about:blank', 50505, args)
    })

    it('sets default window size and DPR in headless mode', async () => {
      writeExtension.mockRestore()

      await chrome.open({ isHeadless: true, majorVersion: 112 } as any, 'http://', openOpts as any, automation)

      const args = launchSpy.mock.calls[0][3]

      expect(args).toEqual(expect.arrayContaining([
        '--headless=new',
        '--window-size=1280,720',
        '--force-device-scale-factor=1',
      ]))
    })

    it('does not load extension in headless mode', async () => {
      writeExtension.mockRestore()

      await chrome.open({ isHeadless: true, majorVersion: 112 } as any, 'http://', openOpts as any, automation)

      const args = launchSpy.mock.calls[0][3]

      expect(args).toEqual(expect.arrayContaining([
        '--headless=new',
        '--remote-debugging-port=50505',
        '--remote-debugging-address=127.0.0.1',
        '--user-data-dir=/profile/dir',
        '--disk-cache-dir=/profile/dir/CypressCache',
      ]))
    })

    it('merges a --disable-features arg added in before:browser:launch with its own', async () => {
      vi.spyOn(plugins, 'has').mockReturnValue(true)
      execute.mockImplementation((event, browser, launchOptions) => {
        if (event !== 'before:browser:launch') {
          return Promise.resolve(null)
        }

        launchOptions.args.push('--disable-features=OptimizationGuideModelDownloading')

        return Promise.resolve(launchOptions)
      })

      await chrome.open({ isHeadless: true, majorVersion: 112 } as any, 'http://', openOpts as any, automation)

      const args: string[] = launchSpy.mock.calls[0][3]
      const disableFeatures = args.filter((arg) => arg.startsWith('--disable-features='))

      expect(disableFeatures).toHaveLength(1)

      const features = disableFeatures[0].slice('--disable-features='.length).split(',')

      expect(features).toEqual(expect.arrayContaining([
        'OptimizationGuideModelDownloading',
        'LocalNetworkAccessChecks',
        'HttpsUpgrades',
        'Translate',
      ]))
    })

    it('merges a --host-resolver-rules arg added in before:browser:launch with the rules derived from hosts', async () => {
      vi.spyOn(plugins, 'has').mockReturnValue(true)
      execute.mockImplementation((event, browser, launchOptions) => {
        if (event !== 'before:browser:launch') {
          return Promise.resolve(null)
        }

        launchOptions.args.push('--host-resolver-rules=MAP example.com 10.0.0.1')

        return Promise.resolve(launchOptions)
      })

      const options = { ...openOpts, hosts: { 'foobar.com': '127.0.0.1' } }

      await chrome.open({ isHeadless: true, majorVersion: 112 } as any, 'http://', options as any, automation)

      const args: string[] = launchSpy.mock.calls[0][3]
      const hostResolverRules = args.filter((arg) => arg.startsWith('--host-resolver-rules='))

      expect(hostResolverRules).toHaveLength(1)

      const rules = hostResolverRules[0].slice('--host-resolver-rules='.length).split(',')

      // user-supplied rules come first so they win over the ones from `hosts`
      expect(rules).toEqual([
        'MAP example.com 10.0.0.1',
        'MAP foobar.com 127.0.0.1',
      ])
    })

    it('uses a custom profilePath if supplied', async () => {
      writeExtension.mockRestore()
      getProfileDir.mockRestore()

      const profilePath = '/home/foo/snap/chromium/current'
      const fullPath = `${profilePath}/Cypress/chromium-stable/interactive`

      readJsonByPath[`${fullPath}/Default/Preferences`] = enoent
      readJsonByPath[`${fullPath}/Default/Secure Preferences`] = enoent
      readJsonByPath[`${fullPath}/Local State`] = enoent

      await chrome.open({
        isHeadless: true,
        isHeaded: false,
        profilePath,
        name: 'chromium',
        channel: 'stable',
      } as any, 'http://', openOpts as any, automation)

      const args = launchSpy.mock.calls[0][3]

      expect(args).toEqual(expect.arrayContaining([
        `--user-data-dir=${fullPath}`,
      ]))
    })

    describe('when IGNORE_CHROME_PREFERENCES env is set', () => {
      beforeEach(() => {
        vi.stubEnv('IGNORE_CHROME_PREFERENCES', 'true')
        readJsonFallback = enoent
      })

      afterEach(() => {
        outputJson.mockRestore()
      })

      it('does not read or write preferences', async () => {
        writeExtension.mockRestore()
        getProfileDir.mockRestore()

        await chrome.open({
          isHeadless: true,
          isHeaded: false,
          name: 'chromium',
          channel: 'stable',
        } as any, 'http://', openOpts as any, automation)

        expect(fs.outputJson).not.toHaveBeenCalled()
        expect(readJson).not.toHaveBeenCalled()
      })
    })

    it('normalizes --load-extension if provided in plugin', async () => {
      plugins.registerEvent('before:browser:launch', (browser, config) => {
        return Promise.resolve({
          args: ['--foo=bar', '--load-extension=/foo/bar/baz.js'],
        })
      })

      const pathToTheme = extension.getPathToTheme()

      await chrome.open({ isHeaded: true } as any, 'http://', openOpts as any, automation)

      const args = launchSpy.mock.calls[0][3]

      expect(args).toEqual(expect.arrayContaining([
        '--foo=bar',
        `--load-extension=/foo/bar/baz.js,/path/to/ext,${pathToTheme}`,
        '--user-data-dir=/profile/dir',
        '--disk-cache-dir=/profile/dir/CypressCache',
      ]))
    })

    it('normalizes multiple extensions from plugins', async () => {
      plugins.registerEvent('before:browser:launch', (browser, config) => {
        return Promise.resolve({ args: ['--foo=bar', '--load-extension=/foo/bar/baz.js,/quux.js'] })
      })

      const pathToTheme = extension.getPathToTheme()

      const onWarning = vi.fn()

      await chrome.open({ isHeaded: true } as any, 'http://', { onWarning, onError: () => {} } as any, automation)

      const args = launchSpy.mock.calls[0][3]

      expect(args).toEqual(expect.arrayContaining([
        '--foo=bar',
        `--load-extension=/foo/bar/baz.js,/quux.js,/path/to/ext,${pathToTheme}`,
        '--user-data-dir=/profile/dir',
        '--disk-cache-dir=/profile/dir/CypressCache',
      ]))

      expect(onWarning).not.toHaveBeenCalledOnce()
    })

    it('warns the user if `--load-extension` is passed into branded chrome 137 and up', async () => {
      const log = vi.spyOn(console, 'log').mockImplementation(() => {})

      plugins.registerEvent('before:browser:launch', (browser, config) => {
        return Promise.resolve({ args: ['--foo=bar', '--load-extension=/foo/bar/baz.js,/quux.js'] })
      })

      await chrome.open({ isHeaded: true, majorVersion: '137', name: 'chrome' } as any, 'http://', { onWarning: () => {}, onError: () => {} } as any, automation)

      expectCalledWith(log, expect.stringContaining('Google Chrome v137 and higher does not allow loading extensions via --load-extension. If you need to load an extension to test with Cypress, please use Chrome for Testing, Chromium, or another Chrome variant that supports loading extensions.'))
    })

    it('warns the user if launchOptions.extensions is passed into branded chrome 137 and up', async () => {
      const log = vi.spyOn(console, 'log').mockImplementation(() => {})

      plugins.registerEvent('before:browser:launch', (browser, config) => {
        return Promise.resolve({ args: ['--foo=bar'], extensions: ['/foo/bar/baz.js', '/quux.js'] })
      })

      await chrome.open({ isHeaded: true, majorVersion: '139', name: 'chrome' } as any, 'http://', { onWarning: () => {}, onError: () => {} } as any, automation)

      expectCalledWith(log, expect.stringContaining('Google Chrome v137 and higher does not allow loading extensions via --load-extension. If you need to load an extension to test with Cypress, please use Chrome for Testing, Chromium, or another Chrome variant that supports loading extensions.'))
    })

    it('cleans up an unclean browser profile exit status', async () => {
      const preferences = {
        profile: {
          exit_type: 'Abnormal',
          exited_cleanly: false,
        },
      }

      readJsonByPath['/profile/dir/Default/Preferences'] = () => Promise.resolve(preferences)

      outputJson.mockResolvedValue(undefined)

      await chrome.open({ isHeadless: true } as any, 'http://', openOpts as any, automation)

      expectCalledWith(outputJson, '/profile/dir/Default/Preferences', {
        profile: {
          exit_type: 'Normal',
          exited_cleanly: true,
        },
      })
    })

    it('calls cri client close on kill', async () => {
      // need a reference here since the stub will be monkey-patched
      const {
        kill,
      } = launchedBrowser

      await chrome.open({ isHeadless: true } as any, 'http://', openOpts as any, automation)

      expect(typeof launchedBrowser.kill).toBe('function')

      launchedBrowser.kill()

      expect(browserCriClient.close).toHaveBeenCalledOnce()
      expect(kill).toHaveBeenCalledOnce()
    })

    it('sends after:browser:launch with debugger url', async () => {
      const args = []
      const browser = { isHeadless: true }

      vi.spyOn(chrome, '_getArgs').mockReturnValue(args)
      vi.spyOn(plugins, 'has').mockReturnValue(true)

      execute.mockResolvedValue(null)

      await chrome.open(browser as any, 'http://', openOpts as any, automation)

      expectCalledWith(execute, 'after:browser:launch', browser, {
        webSocketDebuggerUrl: 'ws://debugger',
      })
    })

    it('executeAfterBrowserLaunch is noop if after:browser:launch is not registered', async () => {
      await chrome.open({ isHeadless: true } as any, 'http://', openOpts as any, automation)

      expectNotCalledWith(execute, 'after:browser:launch')
    })

    describe('downloads', () => {
      it('pushes create:download after download begins', async () => {
        const downloadData = {
          guid: '1',
          suggestedFilename: 'file.csv',
          url: 'http://localhost:1234/file.csv',
        }
        const options = { downloadsFolder: 'downloads' }

        await onCriEvent('Page.downloadWillBegin', downloadData, options)

        expectCalledWith(automation.push, 'create:download', {
          id: '1',
          filePath: 'downloads/file.csv',
          mime: 'text/csv',
          url: 'http://localhost:1234/file.csv',
        })
      })

      it('pushes complete:download after download completes', async () => {
        const downloadData = {
          guid: '1',
          state: 'completed',
        }
        const options = { downloadsFolder: 'downloads' }

        await onCriEvent('Page.downloadProgress', downloadData, options)

        expectCalledWith(automation.push, 'complete:download', {
          id: '1',
        })
      })

      it('pushes canceled:download when download is incomplete', async () => {
        const downloadData = {
          guid: '1',
          state: 'canceled',
        }
        const options = { downloadsFolder: 'downloads' }

        await onCriEvent('Page.downloadProgress', downloadData, options)

        expectCalledWith(automation.push, 'canceled:download', {
          id: '1',
        })
      })
    })

    describe('adding header to AUT iframe request', () => {
      beforeEach(() => {
        const frameTree = {
          frameTree: {
            childFrames: [
              {
                frame: {
                  id: 'aut-frame-id',
                  name: 'Your project: "FakeBlock"',
                },
              },
              {
                frame: {
                  id: 'spec-frame-id',
                  name: 'Your Spec: "spec.js"',
                },
              },
            ],
          },
        }

        pageCriClient.send.mockImplementation((command) => {
          return Promise.resolve(command === 'Page.getFrameTree' ? frameTree : undefined)
        })
      })

      it('sends Fetch.enable only for Document ResourceType', async () => {
        await chrome.open('chrome' as any, 'http://', mitmOpts as any, automation)

        expectCalledWith(pageCriClient.send, 'Fetch.enable', {
          patterns: [{
            resourceType: 'Document',
          }],
        })
      })

      it('delegates Fetch ownership to the CDP runtime on the browser (CDP) network path', async () => {
        const onPageCriClientReady = vi.fn(() => Promise.resolve())

        await chrome.open('chrome' as any, 'http://', {
          ...openOpts,
          onPageCriClientReady,
        } as any, automation)

        expect(onPageCriClientReady).toHaveBeenCalledOnce()

        // the runtime needs the isAUTFrame lookup and the protocol-neutral
        // AUT-navigation subscription
        const [, isAUTFrame, onAUTFrameNavigated] = onPageCriClientReady.mock.calls[0] as unknown[]

        expect(isAUTFrame).toBeTypeOf('function')
        expect(onAUTFrameNavigated).toBeTypeOf('function')

        expectNotCalledWith(pageCriClient.send, 'Fetch.enable', {
          patterns: [{
            resourceType: 'Document',
          }],
        })
      })

      it('does not add header when not a document', async () => {
        await chrome.open('chrome' as any, 'http://', mitmOpts as any, automation)

        yieldTo(pageCriClient.on, 'Fetch.requestPaused', {
          requestId: '1234',
          resourceType: 'Script',
        })

        expectNotCalledWith(pageCriClient.send, 'Fetch.continueRequest')
      })

      it('does not add header when it is a spec frame request', async () => {
        await chrome.open('chrome' as any, 'http://', mitmOpts as any, automation)

        yieldTo(pageCriClient.on, 'Page.frameAttached')

        await listenersFor(pageCriClient.on, 'Fetch.requestPaused')[0][1]({
          frameId: 'spec-frame-id',
          requestId: '1234',
          resourceType: 'Document',
          request: {
            url: '/__cypress/integration/spec.js',
          },
        })

        expectCalledWith(pageCriClient.send, 'Fetch.continueRequest', {
          requestId: '1234',
        })
      })

      it('appends X-Cypress-Is-AUT-Frame header to AUT iframe request', async () => {
        await chrome.open('chrome' as any, 'http://', mitmOpts as any, automation)

        yieldTo(pageCriClient.on, 'Page.frameAttached')

        await listenersFor(pageCriClient.on, 'Fetch.requestPaused')[0][1]({
          frameId: 'aut-frame-id',
          requestId: '1234',
          resourceType: 'Document',
          request: {
            url: 'http://localhost:3000/index.html',
            headers: {
              'X-Foo': 'Bar',
            },
          },
        })

        expectCalledWith(pageCriClient.send, 'Fetch.continueRequest', {
          requestId: '1234',
          headers: [
            {
              name: 'X-Foo',
              value: 'Bar',
            },
            {
              name: 'X-Cypress-Is-AUT-Frame',
              value: 'true',
            },
          ],
        })
      })

      it('gets frame tree on Page.frameAttached', async () => {
        await chrome.open('chrome' as any, 'http://', mitmOpts as any, automation)

        yieldTo(pageCriClient.on, 'Page.frameAttached')

        expectCalledWith(pageCriClient.send, 'Page.getFrameTree')
      })

      it('gets frame tree on Page.frameDetached', async () => {
        await chrome.open('chrome' as any, 'http://', mitmOpts as any, automation)

        yieldTo(pageCriClient.on, 'Page.frameDetached')

        expectCalledWith(pageCriClient.send, 'Page.getFrameTree')
      })
    })
  })

  describe('#_writeExtension', () => {
    afterEach(() => {
      mockfs.restore()
    })

    // when Cypress is installed in a read-only location (e.g. the Nix store), the
    // source extension is read-only and fs.copy preserves those permissions. The
    // copied extension must be made writable, otherwise rimraf cannot unlink the
    // files when cleaning up the profile on exit.
    it('grants write access to the copied extension so the profile can be cleaned up on exit', async () => {
      const browser = { name: 'chrome', channel: 'stable', isHeadless: false }
      // the read-only source extension, as it would be installed in the Nix store
      // (Chrome uses the Manifest V3 extension)
      const extensionSrc = extension.getPathToV3Extension()
      // the real destination the extension is copied to
      const extensionDir = utils.getExtensionDir(browser, true)

      mockfs({
        [extensionSrc]: mockfs.directory({
          mode: 0o555,
          items: {
            'background.js': mockfs.file({ content: 'abc', mode: 0o444 }),
          },
        }),
      })

      await chrome._writeExtension(browser as any, { isTextTerminal: true } as any)

      // the owner write bit must be set on both the directory and its contents,
      // otherwise rimraf cannot unlink the files when removing the profile on exit
      expect((await fs.stat(extensionDir)).mode & 0o200, 'extension directory is writable').toBe(0o200)
      expect((await fs.stat(path.join(extensionDir, 'background.js'))).mode & 0o200, 'background.js is writable').toBe(0o200)
    })
  })

  describe('#connectToExisting', () => {
    it('wires CDP Fetch on the browser (CDP) network path (cy-in-cy path)', async () => {
      const pageCriClient = {
        send: vi.fn(() => Promise.resolve()),
        on: vi.fn(),
        off: vi.fn(),
      }
      const browserCriClient = {
        attachToTargetUrl: vi.fn(() => Promise.resolve(pageCriClient)),
        resetBrowserTargets: vi.fn(() => Promise.resolve()),
        close: vi.fn(() => Promise.resolve()),
      }
      const cdpAutomation = {
        _listenForFrameTreeChanges: vi.fn(),
        seedFrameTree: vi.fn(() => Promise.resolve()),
        isAUTFrame: vi.fn(() => Promise.resolve(false)),
      }
      const onPageCriClientReady = vi.fn(() => Promise.resolve())
      const automation = { use: vi.fn() }
      const cdpSocketServer = { attachCDPClient: vi.fn() }

      vi.spyOn(BrowserCriClient, 'create').mockResolvedValue(browserCriClient as any)
      vi.spyOn(chrome, '_setAutomation').mockResolvedValue(cdpAutomation as any)
      vi.spyOn(protocol, 'getRemoteDebuggingPort').mockResolvedValue(9222)

      await chrome.connectToExisting(
        { displayName: 'Chrome' } as any,
        {
          ...openOpts,
          url: 'http://localhost:3000/__/',
          onPageCriClientReady,
        } as any,
        automation as any,
        cdpSocketServer as any,
      )

      expectCalledWith(pageCriClient.send, 'Page.enable')
      expectCalledOnceWith(cdpAutomation._listenForFrameTreeChanges, pageCriClient)
      expectCalledOnceWith(cdpAutomation.seedFrameTree, pageCriClient)
      expectCalledOnceWith(onPageCriClientReady, pageCriClient, cdpAutomation.isAUTFrame)
    })

    it('does not wire CDP Fetch on the MITM path', async () => {
      const pageCriClient = {
        send: vi.fn(() => Promise.resolve()),
        on: vi.fn(),
        off: vi.fn(),
      }
      const browserCriClient = {
        attachToTargetUrl: vi.fn(() => Promise.resolve(pageCriClient)),
        resetBrowserTargets: vi.fn(() => Promise.resolve()),
        close: vi.fn(() => Promise.resolve()),
      }
      const cdpAutomation = {
        _listenForFrameTreeChanges: vi.fn(),
        isAUTFrame: vi.fn(() => Promise.resolve(false)),
      }
      const onPageCriClientReady = vi.fn(() => Promise.resolve())
      const automation = { use: vi.fn() }

      vi.spyOn(BrowserCriClient, 'create').mockResolvedValue(browserCriClient as any)
      vi.spyOn(chrome, '_setAutomation').mockResolvedValue(cdpAutomation as any)
      vi.spyOn(protocol, 'getRemoteDebuggingPort').mockResolvedValue(9222)

      await chrome.connectToExisting(
        { displayName: 'Chrome' } as any,
        {
          ...mitmOpts,
          url: 'http://localhost:3000/__/',
          onPageCriClientReady,
        } as any,
        automation as any,
      )

      expect(cdpAutomation._listenForFrameTreeChanges).not.toHaveBeenCalled()
      expect(onPageCriClientReady).not.toHaveBeenCalled()
    })

    // connectToExisting runs once per spec against a browser that already has a
    // client attached, so both of these drive it twice
    function setupReconnect (firstClose: Mock = vi.fn(() => Promise.resolve())) {
      const pageCriClient = {
        send: vi.fn(() => Promise.resolve()),
        on: vi.fn(),
        off: vi.fn(),
      }
      const makeBrowserCriClient = (close: Mock) => {
        return {
          attachToTargetUrl: vi.fn(() => Promise.resolve(pageCriClient)),
          resetBrowserTargets: vi.fn(() => Promise.resolve()),
          close,
        }
      }
      const first = makeBrowserCriClient(firstClose)
      const second = makeBrowserCriClient(vi.fn(() => Promise.resolve()))
      const create = vi.spyOn(BrowserCriClient, 'create')
      .mockImplementation(() => undefined as any)
      .mockResolvedValueOnce(first as any)
      .mockResolvedValueOnce(second as any)

      vi.spyOn(chrome, '_setAutomation').mockResolvedValue({ _listenForFrameTreeChanges: vi.fn(), isAUTFrame: vi.fn() } as any)
      vi.spyOn(protocol, 'getRemoteDebuggingPort').mockResolvedValue(9222)

      const connect = () => {
        return chrome.connectToExisting(
          { displayName: 'Chrome' } as any,
          { ...mitmOpts, url: 'http://localhost:3000/__/' } as any,
          { use: vi.fn() } as any,
        )
      }

      return { first, second, create, connect }
    }

    it('closes the previous browser cri client before connecting again', async () => {
      const { first, second, connect } = setupReconnect()

      await connect()
      expect(first.close).not.toHaveBeenCalled()

      await connect()
      expect(first.close).toHaveBeenCalledOnce()
      expect(second.close).not.toHaveBeenCalled()
      expect(chrome._getBrowserCriClient()).toBe(second)
    })

    // a close still in flight can clear the CDP url after the new connection sets it
    it('waits for the previous client to close before connecting again', async () => {
      const closing = Promise.withResolvers<void>()
      const { first, create, connect } = setupReconnect(vi.fn(() => closing.promise))

      await connect()

      const reconnecting = connect()

      await new Promise((resolve) => setImmediate(resolve))
      // proves the reconnect is parked on the close - the assertion below would
      // otherwise also hold before it ever got there
      expect(first.close, 'never reached the close').toHaveBeenCalledOnce()
      expect(create, 'connected again while the previous close was still pending').toHaveBeenCalledOnce()

      closing.resolve()
      await reconnecting

      expect(create).toHaveBeenCalledTimes(2)
    })
  })

  describe('#connectToNewSpec', () => {
    it('launches a new tab, connects a cri client to it, starts video, navigates to the spec url, and handles downloads', async () => {
      const protocolManager = {
        connectToBrowser: vi.fn(() => Promise.resolve()),
      }

      const pageCriClient = {
        send: vi.fn(() => Promise.resolve()),
        on: vi.fn(),
        targetId: '1234',
      }

      const mockCurrentlyAttachedProtocolTarget = {}

      const cdpSocketServer = {
        attachCDPClient: vi.fn(),
      }

      const browserCriClient = {
        currentlyAttachedTarget: pageCriClient,
        currentlyAttachedProtocolTarget: mockCurrentlyAttachedProtocolTarget,
        host: 'http://localhost',
        port: 1234,
      }

      const automation = {
        use: vi.fn(),
      }

      let onInitializeNewBrowserTabCalled = false
      const options = {
        ...openOpts,
        url: 'https://www.google.com',
        downloadsFolder: '/tmp/folder',
        browser: {},
        videoApi: {},
        onInitializeNewBrowserTab: () => {
          onInitializeNewBrowserTabCalled = true
        },
        protocolManager,
      }

      vi.spyOn(chrome, '_getBrowserCriClient').mockReturnValue(browserCriClient as any)
      // these resolve to undefined for every call the SUT makes
      vi.spyOn(chrome, '_recordVideo').mockImplementation(() => undefined as any)
      vi.spyOn(chrome, '_navigateUsingCRI').mockImplementation(() => undefined as any)
      vi.spyOn(chrome, '_handleDownloads').mockImplementation(() => undefined as any)

      await chrome.connectToNewSpec({ majorVersion: 354 } as any, options as any, automation as any, cdpSocketServer as any)

      expect(automation.use).toHaveBeenCalled()
      expect(chrome._getBrowserCriClient).toHaveBeenCalled()
      expect(chrome._recordVideo).toHaveBeenCalled()
      expect(chrome._navigateUsingCRI).toHaveBeenCalled()
      expect(chrome._handleDownloads).toHaveBeenCalled()
      expect(onInitializeNewBrowserTabCalled).toBe(true)
      expectCalledWith(cdpSocketServer.attachCDPClient, pageCriClient)
      expectCalledWith(protocolManager.connectToBrowser, mockCurrentlyAttachedProtocolTarget)
    })
  })

  describe('#attachListeners', () => {
    const clearParams = { origin: '*', storageTypes: 'service_workers,cache_storage' }

    function setup (options: object) {
      const pageCriClient = {
        send: vi.fn(() => Promise.resolve()),
        on: vi.fn(),
        targetId: '1234',
        whenChildTargetHandled: vi.fn(() => Promise.resolve()),
        reenableChildTargetInterception: vi.fn(() => Promise.resolve()),
      }

      const browserCriClient = {
        currentlyAttachedTarget: pageCriClient,
        resetBrowserTargets: vi.fn(() => Promise.resolve()),
      }

      const cdpAutomation = {
        _listenForFrameTreeChanges: vi.fn(),
        _handlePausedRequests: vi.fn(() => Promise.resolve()),
        isAUTFrame: vi.fn(() => Promise.resolve(false)),
        onAUTFrameNavigated: vi.fn(),
      }

      vi.spyOn(chrome, '_getBrowserCriClient').mockReturnValue(browserCriClient as any)
      vi.spyOn(chrome, '_setAutomation').mockResolvedValue(cdpAutomation as any)
      vi.spyOn(chrome, '_handleDownloads').mockResolvedValue(undefined)
      const navigateUsingCRI = vi.spyOn(chrome, '_navigateUsingCRI').mockResolvedValue(undefined)

      vi.spyOn(utils, 'initializeCDP').mockResolvedValue()

      const attach = () => {
        return chrome.attachListeners(
          'https://example.com/__/#/specs/runner',
          pageCriClient as any,
          { use: vi.fn() } as any,
          { ...options } as any,
          { displayName: 'Chrome' } as any,
        )
      }

      return { pageCriClient, navigateUsingCRI, attach }
    }

    it('clears persisted service worker state before the runner navigation', async () => {
      const { pageCriClient, navigateUsingCRI, attach } = setup({ ...openOpts, shouldClearPersistedServiceWorkers: true })

      await attach()

      expectCalledWith(pageCriClient.send, 'Storage.clearDataForOrigin', clearParams)

      // sinon's calledBefore: the first matching call precedes the last navigation
      const clearOrders = pageCriClient.send.mock.invocationCallOrder.filter((_order, i) => pageCriClient.send.mock.calls[i][0] === 'Storage.clearDataForOrigin')
      const navigateOrders = navigateUsingCRI.mock.invocationCallOrder

      expect(navigateOrders).not.toHaveLength(0)
      expect(clearOrders[0]).toBeLessThan(navigateOrders[navigateOrders.length - 1])
    })

    it('does not clear persisted service worker state on the MITM path', async () => {
      const { pageCriClient, attach } = setup({ ...mitmOpts, shouldClearPersistedServiceWorkers: true })

      await attach()

      expectNotCalledWith(pageCriClient.send, 'Storage.clearDataForOrigin')
    })

    it('does not clear persisted service worker state when testIsolation is disabled', async () => {
      const { pageCriClient, attach } = setup({ ...openOpts, shouldClearPersistedServiceWorkers: false })

      await attach()

      expectNotCalledWith(pageCriClient.send, 'Storage.clearDataForOrigin')
    })
  })

  describe('#connectProtocolToBrowser', () => {
    it('connects to the browser cri client', async () => {
      const protocolManager = {
        connectToBrowser: vi.fn(() => Promise.resolve()),
      }

      const mockCurrentlyAttachedProtocolTarget = {}

      const pageCriClient = {
        clone: vi.fn(() => mockCurrentlyAttachedProtocolTarget),
      }

      const browserCriClient = {
        currentlyAttachedTarget: pageCriClient,
        currentlyAttachedProtocolTarget: mockCurrentlyAttachedProtocolTarget,
      }

      vi.spyOn(chrome, '_getBrowserCriClient').mockReturnValue(browserCriClient as any)

      await chrome.connectProtocolToBrowser({ protocolManager } as any)

      expect(pageCriClient.clone).not.toHaveBeenCalled()
      expectCalledWith(protocolManager.connectToBrowser, mockCurrentlyAttachedProtocolTarget)
    })

    it('connects to the browser cri client when the protocol target has not been created', async () => {
      const protocolManager = {
        connectToBrowser: vi.fn(() => Promise.resolve()),
      }

      const mockCurrentlyAttachedProtocolTarget = {}

      const pageCriClient = {
        clone: vi.fn(() => Promise.resolve(mockCurrentlyAttachedProtocolTarget)),
      }

      const browserCriClient: { currentlyAttachedTarget: typeof pageCriClient, currentlyAttachedProtocolTarget?: object } = {
        currentlyAttachedTarget: pageCriClient,
      }

      vi.spyOn(chrome, '_getBrowserCriClient').mockReturnValue(browserCriClient as any)

      await chrome.connectProtocolToBrowser({ protocolManager } as any)

      expect(pageCriClient.clone).toHaveBeenCalled()
      expectCalledWith(protocolManager.connectToBrowser, mockCurrentlyAttachedProtocolTarget)
      expect(browserCriClient.currentlyAttachedProtocolTarget).toBe(mockCurrentlyAttachedProtocolTarget)
    })

    it('throws error if there is no browser cri client', async () => {
      const protocolManager = {
        connectToBrowser: vi.fn(() => Promise.resolve()),
      }

      vi.spyOn(chrome, '_getBrowserCriClient').mockReturnValue(null as any)

      await expect(chrome.connectProtocolToBrowser({ protocolManager } as any)).rejects.toThrow('Missing pageCriClient in connectProtocolToBrowser')
      expect(protocolManager.connectToBrowser).not.toHaveBeenCalled()
    })

    it('throws error if there is no page cri client', async () => {
      const protocolManager = {
        connectToBrowser: vi.fn(() => Promise.resolve()),
      }

      const browserCriClient = {
        currentlyAttachedTarget: null,
      }

      vi.spyOn(chrome, '_getBrowserCriClient').mockReturnValue(browserCriClient as any)

      await expect(chrome.connectProtocolToBrowser({ protocolManager } as any)).rejects.toThrow('Missing pageCriClient in connectProtocolToBrowser')
      expect(protocolManager.connectToBrowser).not.toHaveBeenCalled()
    })
  })

  describe('#connectCyPromptToBrowser', () => {
    it('connects to the browser cri client', async () => {
      const cyPromptManager = {
        connectToBrowser: vi.fn(() => Promise.resolve()),
      }

      const mockCurrentlyAttachedCyPromptTarget = {}

      const pageCriClient = {
        clone: vi.fn(() => mockCurrentlyAttachedCyPromptTarget),
      }

      const browserCriClient = {
        currentlyAttachedTarget: pageCriClient,
        currentlyAttachedCyPromptTarget: mockCurrentlyAttachedCyPromptTarget,
      }

      vi.spyOn(chrome, '_getBrowserCriClient').mockReturnValue(browserCriClient as any)

      await chrome.connectCyPromptToBrowser({ cyPromptManager } as any)

      expect(pageCriClient.clone).not.toHaveBeenCalled()
      expectCalledWith(cyPromptManager.connectToBrowser, mockCurrentlyAttachedCyPromptTarget)
    })

    it('connects to the browser cri client when the cy prompt target has not been created', async () => {
      const cyPromptManager = {
        connectToBrowser: vi.fn(() => Promise.resolve()),
      }

      const mockCurrentlyAttachedCyPromptTarget = {}

      const pageCriClient = {
        clone: vi.fn(() => Promise.resolve(mockCurrentlyAttachedCyPromptTarget)),
      }

      const browserCriClient: { currentlyAttachedTarget: typeof pageCriClient, currentlyAttachedCyPromptTarget?: object } = {
        currentlyAttachedTarget: pageCriClient,
      }

      vi.spyOn(chrome, '_getBrowserCriClient').mockReturnValue(browserCriClient as any)

      await chrome.connectCyPromptToBrowser({ cyPromptManager } as any)

      expect(pageCriClient.clone).toHaveBeenCalled()
      expectCalledWith(cyPromptManager.connectToBrowser, mockCurrentlyAttachedCyPromptTarget)
      expect(browserCriClient.currentlyAttachedCyPromptTarget).toBe(mockCurrentlyAttachedCyPromptTarget)
    })

    it('throws error if there is no browser cri client', async () => {
      const cyPromptManager = {
        connectToBrowser: vi.fn(() => Promise.resolve()),
      }

      vi.spyOn(chrome, '_getBrowserCriClient').mockReturnValue(null as any)

      await expect(chrome.connectCyPromptToBrowser({ cyPromptManager } as any)).rejects.toThrow('Missing pageCriClient in connectCyPromptToBrowser')
      expect(cyPromptManager.connectToBrowser).not.toHaveBeenCalled()
    })

    it('throws error if there is no page cri client', async () => {
      const cyPromptManager = {
        connectToBrowser: vi.fn(() => Promise.resolve()),
      }

      const browserCriClient = {
        currentlyAttachedTarget: null,
      }

      vi.spyOn(chrome, '_getBrowserCriClient').mockReturnValue(browserCriClient as any)

      await expect(chrome.connectCyPromptToBrowser({ cyPromptManager } as any)).rejects.toThrow('Missing pageCriClient in connectCyPromptToBrowser')
      expect(cyPromptManager.connectToBrowser).not.toHaveBeenCalled()
    })
  })

  describe('#connectStudioToBrowser', () => {
    it('connects to the browser cri client', async () => {
      const studioManager = {
        connectToBrowser: vi.fn(() => Promise.resolve()),
      }

      const mockCurrentlyAttachedStudioTarget = {}

      const pageCriClient = {
        clone: vi.fn(() => mockCurrentlyAttachedStudioTarget),
      }

      const browserCriClient = {
        currentlyAttachedTarget: pageCriClient,
        currentlyAttachedStudioTarget: mockCurrentlyAttachedStudioTarget,
      }

      vi.spyOn(chrome, '_getBrowserCriClient').mockReturnValue(browserCriClient as any)

      await chrome.connectStudioToBrowser({ studioManager } as any)

      expect(pageCriClient.clone).not.toHaveBeenCalled()
      expectCalledWith(studioManager.connectToBrowser, mockCurrentlyAttachedStudioTarget)
    })

    it('connects to the browser cri client when the studio target has not been created', async () => {
      const studioManager = {
        connectToBrowser: vi.fn(() => Promise.resolve()),
      }

      const mockCurrentlyAttachedStudioTarget = {}

      const pageCriClient = {
        clone: vi.fn(() => Promise.resolve(mockCurrentlyAttachedStudioTarget)),
      }

      const browserCriClient: { currentlyAttachedTarget: typeof pageCriClient, currentlyAttachedStudioTarget?: object } = {
        currentlyAttachedTarget: pageCriClient,
      }

      vi.spyOn(chrome, '_getBrowserCriClient').mockReturnValue(browserCriClient as any)

      await chrome.connectStudioToBrowser({ studioManager } as any)

      expect(pageCriClient.clone).toHaveBeenCalled()
      expectCalledWith(studioManager.connectToBrowser, mockCurrentlyAttachedStudioTarget)
      expect(browserCriClient.currentlyAttachedStudioTarget).toBe(mockCurrentlyAttachedStudioTarget)
    })

    it('throws error if there is no browser cri client', async () => {
      const studioManager = {
        connectToBrowser: vi.fn(() => Promise.resolve()),
      }

      vi.spyOn(chrome, '_getBrowserCriClient').mockReturnValue(null as any)

      await expect(chrome.connectStudioToBrowser({ studioManager } as any)).rejects.toThrow('Missing pageCriClient in connectStudioToBrowser')
      expect(studioManager.connectToBrowser).not.toHaveBeenCalled()
    })

    it('throws error if there is no page cri client', async () => {
      const studioManager = {
        connectToBrowser: vi.fn(() => Promise.resolve()),
      }

      const browserCriClient = {
        currentlyAttachedTarget: null,
      }

      vi.spyOn(chrome, '_getBrowserCriClient').mockReturnValue(browserCriClient as any)

      await expect(chrome.connectStudioToBrowser({ studioManager } as any)).rejects.toThrow('Missing pageCriClient in connectStudioToBrowser')
      expect(studioManager.connectToBrowser).not.toHaveBeenCalled()
    })
  })

  describe('#closeProtocolConnection', () => {
    it('closes the protocol connection', async () => {
      const mockCurrentlyAttachedProtocolTarget = {
        close: vi.fn(() => Promise.resolve()),
      }

      const browserCriClient: { currentlyAttachedProtocolTarget?: typeof mockCurrentlyAttachedProtocolTarget } = {
        currentlyAttachedProtocolTarget: mockCurrentlyAttachedProtocolTarget,
      }

      vi.spyOn(chrome, '_getBrowserCriClient').mockReturnValue(browserCriClient as any)

      await chrome.closeProtocolConnection()

      expect(mockCurrentlyAttachedProtocolTarget.close).toHaveBeenCalled()
      expect(browserCriClient.currentlyAttachedProtocolTarget).toBeUndefined()
    })
  })

  describe('#_getArgs', () => {
    it('disables gpu when linux', () => {
      vi.spyOn(os, 'platform').mockReturnValue('linux')

      const args = chrome._getArgs({} as any, {} as any, undefined as any)

      expect(args).toContain('--disable-gpu')
    })

    it('does not disable gpu when not linux', () => {
      vi.spyOn(os, 'platform').mockReturnValue('darwin')

      const args = chrome._getArgs({} as any, {} as any, undefined as any)

      expect(args).not.toContain('--disable-gpu')
    })

    it('turns off sandbox when linux', () => {
      vi.spyOn(os, 'platform').mockReturnValue('linux')

      const args = chrome._getArgs({} as any, {} as any, undefined as any)

      expect(args).toContain('--no-sandbox')
    })

    it('does not turn off sandbox when not linux', () => {
      vi.spyOn(os, 'platform').mockReturnValue('win32')

      const args = chrome._getArgs({} as any, {} as any, undefined as any)

      expect(args).not.toContain('--no-sandbox')
    })

    it('adds user agent when options.userAgent', () => {
      const args = chrome._getArgs({} as any, {
        userAgent: 'foo',
      } as any, undefined as any)

      expect(args).toContain('--user-agent=foo')
    })

    it('does not add user agent', () => {
      const args = chrome._getArgs({} as any, {} as any, undefined as any)

      expect(args).not.toContain('--user-agent=foo')
    })

    it('adds the configured proxy server and bypass list', () => {
      const args = chrome._getArgs({
        majorVersion: '89',
      } as any, {
        proxyServer: 'http://proxy.example:8080',
        proxyBypassList: 'localhost,example.com',
      } as any, undefined as any)

      expect(args).toContain('--proxy-server=http://proxy.example:8080')
      expect(args).toContain('--proxy-bypass-list=localhost,example.com')
    })

    // an empty bypass list leaves chromium's implicit loopback rules in place
    it('does not add a proxy bypass list when none is configured', () => {
      const args = chrome._getArgs({
        majorVersion: '89',
      } as any, {
        proxyServer: 'http://proxy.example:8080',
      } as any, undefined as any)

      expect(args.join(' ')).not.toContain('--proxy-bypass-list')
    })

    it('translates hosts into host resolver rules', () => {
      const args = chrome._getArgs({
        majorVersion: '89',
      } as any, {
        hosts: {
          'foobar.com': '127.0.0.1',
          '*.foobar.com': '127.0.0.1',
        },
      } as any, undefined as any)

      expect(args).toContain('--host-resolver-rules=MAP foobar.com 127.0.0.1,MAP *.foobar.com 127.0.0.1')
    })

    it('omits host resolver rules when hosts is not set', () => {
      const args = chrome._getArgs({
        majorVersion: '89',
      } as any, {} as any, undefined as any)

      expect(args.find((arg) => arg.startsWith('--host-resolver-rules'))).toBeUndefined()
    })

    // `_normalizeHostResolverRules` merges the args later and puts the last one first, where
    // the first matching rule wins — so the bridge must be pushed after `hosts` to win for an
    // origin named by both.
    it('orders bridge rules after hosts rules so the merge lets the bridge win', () => {
      const args = chrome._getArgs({
        majorVersion: '89',
      } as any, {
        hosts: { 'secure.com': '10.0.0.1' },
        mtlsHostResolverRules: 'MAP secure.com:443 127.0.0.1:9001',
      } as any, undefined as any)

      const rules = args.filter((arg) => arg.startsWith('--host-resolver-rules='))

      expect(rules).toEqual([
        '--host-resolver-rules=MAP secure.com 10.0.0.1',
        '--host-resolver-rules=MAP secure.com:443 127.0.0.1:9001',
      ])

      expect(chrome._normalizeHostResolverRules(args)).toContain(
        '--host-resolver-rules=MAP secure.com:443 127.0.0.1:9001,MAP secure.com 10.0.0.1',
      )
    })

    it('omits bridge rules when no client certificate is configured', () => {
      const args = chrome._getArgs({
        majorVersion: '89',
      } as any, {
        hosts: { 'foobar.com': '127.0.0.1' },
      } as any, undefined as any)

      expect(args.filter((arg) => arg.startsWith('--host-resolver-rules='))).toEqual([
        '--host-resolver-rules=MAP foobar.com 127.0.0.1',
      ])
    })

    it('brackets IPv6 literals in host resolver rules', () => {
      const args = chrome._getArgs({
        majorVersion: '89',
      } as any, {
        hosts: {
          'foobar.com': '::1',
          'baz.com': '[2001:db8::1]',
        },
      } as any, undefined as any)

      expect(args).toContain('--host-resolver-rules=MAP foobar.com [::1],MAP baz.com [2001:db8::1]')
    })

    it('omits host resolver rules when hosts is empty', () => {
      const args = chrome._getArgs({
        majorVersion: '89',
      } as any, {
        hosts: {},
      } as any, undefined as any)

      expect(args.find((arg) => arg.startsWith('--host-resolver-rules'))).toBeUndefined()
    })

    describe('cache-aware font loading', () => {
      it('disables it on the browser (CDP) network path', () => {
        const args = chrome._getArgs({} as any, { useBrowserNetworkInterception: true } as any, undefined as any)
        const disableFeatures = args.find((arg) => arg.startsWith('--disable-features='))

        expect(disableFeatures).toContain('WebFontsCacheAwareTimeoutAdaption')
        expect(args.filter((arg) => arg.startsWith('--disable-features='))).toHaveLength(1)
      })

      it('keeps it on the MITM path', () => {
        const args = chrome._getArgs({} as any, { useBrowserNetworkInterception: false } as any, undefined as any)

        expect(args.find((arg) => arg.startsWith('--disable-features='))).not.toContain('WebFontsCacheAwareTimeoutAdaption')
      })
    })

    describe('HTTPS upgrades', () => {
      it('disables HttpsUpgrades on the browser (CDP) network path', () => {
        const args = chrome._getArgs({} as any, { useBrowserNetworkInterception: true } as any, undefined as any)
        const disableFeatures = args.find((arg) => arg.startsWith('--disable-features='))

        expect(disableFeatures).toContain('HttpsUpgrades')
      })

      it('disables HttpsUpgrades on the MITM path', () => {
        const args = chrome._getArgs({} as any, { useBrowserNetworkInterception: false } as any, undefined as any)
        const disableFeatures = args.find((arg) => arg.startsWith('--disable-features='))

        expect(disableFeatures).toContain('HttpsUpgrades')
      })
    })

    describe('service worker auto preload', () => {
      it('disables ServiceWorkerAutoPreload on the browser (CDP) network path', () => {
        const args = chrome._getArgs({} as any, { useBrowserNetworkInterception: true } as any, undefined as any)
        const disableFeatures = args.find((arg) => arg.startsWith('--disable-features='))

        expect(disableFeatures).toContain('ServiceWorkerAutoPreload')
        expect(args.filter((arg) => arg.startsWith('--disable-features='))).toHaveLength(1)
      })

      it('keeps it on the MITM path', () => {
        const args = chrome._getArgs({} as any, { useBrowserNetworkInterception: false } as any, undefined as any)

        expect(args.filter((arg) => arg.startsWith('--disable-features='))).toHaveLength(1)
        expect(args.find((arg) => arg.startsWith('--disable-features='))).not.toContain('ServiceWorkerAutoPreload')
      })
    })

    describe('certificate errors', () => {
      it('keeps the blanket ignore flag on the browser (CDP) network path without trusted certs', () => {
        const args = chrome._getArgs({} as any, { useBrowserNetworkInterception: true } as any, undefined as any)

        expect(args).toContain('--ignore-certificate-errors')
        expect(args.find((arg) => arg.startsWith('--ignore-certificate-errors-spki-list'))).toBeUndefined()
      })

      it('adds an spki-list alongside the blanket ignore flag on the browser (CDP) network path when trusted certs are present', () => {
        const args = chrome._getArgs({} as any, {
          useBrowserNetworkInterception: true,
          trustedCertificateFingerprints: ['AAAA', 'BBBB'],
        } as any, undefined as any)

        expect(args).toContain('--ignore-certificate-errors')
        expect(args).toContain('--ignore-certificate-errors-spki-list=AAAA,BBBB')
      })

      it('keeps the blanket ignore flag on the MITM path', () => {
        const args = chrome._getArgs({} as any, {
          useBrowserNetworkInterception: false,
          trustedCertificateFingerprints: ['AAAA'],
        } as any, undefined as any)

        expect(args).toContain('--ignore-certificate-errors')
        expect(args.find((arg) => arg.startsWith('--ignore-certificate-errors-spki-list'))).toBeUndefined()
      })
    })
  })

  describe('#_normalizeDisableFeatures', () => {
    it('returns args unchanged when no disable features args are present', () => {
      const args = ['--foo', '--bar=baz']

      expect(chrome._normalizeDisableFeatures(args)).toEqual(args)
    })

    it('returns args unchanged when a single disable features arg is present', () => {
      const args = ['--foo', '--disable-features=Translate,HttpsUpgrades']

      expect(chrome._normalizeDisableFeatures(args)).toEqual(args)
    })

    it('keeps Cypress features when a user arg from before:browser:launch is appended', () => {
      const args = [
        '--disable-features=Translate,LocalNetworkAccessChecks',
        '--foo',
        '--disable-features=OptimizationGuideModelDownloading',
      ]

      expect(chrome._normalizeDisableFeatures(args)).toEqual([
        '--foo',
        '--disable-features=Translate,LocalNetworkAccessChecks,OptimizationGuideModelDownloading',
      ])
    })

    it('deduplicates features present in more than one arg', () => {
      const args = [
        '--disable-features=Translate,HttpsUpgrades',
        '--disable-features=HttpsUpgrades,MediaRouter',
      ]

      expect(chrome._normalizeDisableFeatures(args)).toEqual([
        '--disable-features=Translate,HttpsUpgrades,MediaRouter',
      ])
    })

    it('does not let a trailing empty arg clobber the merged features', () => {
      const args = [
        '--disable-features=Translate',
        '--disable-features=',
      ]

      expect(chrome._normalizeDisableFeatures(args)).toEqual([
        '--disable-features=Translate',
      ])
    })

    it('drops the switch entirely when every value is empty', () => {
      const args = [
        '--foo',
        '--disable-features=',
        '--disable-features=',
      ]

      expect(chrome._normalizeDisableFeatures(args)).toEqual(['--foo'])
    })
  })

  describe('#_normalizeHostResolverRules', () => {
    it('returns args unchanged when no host resolver rules are present', () => {
      const args = ['--foo', '--bar=baz']

      expect(chrome._normalizeHostResolverRules(args)).toEqual(args)
    })

    it('returns args unchanged when a single host resolver rules arg is present', () => {
      const args = ['--foo', '--host-resolver-rules=MAP foobar.com 127.0.0.1']

      expect(chrome._normalizeHostResolverRules(args)).toEqual(args)
    })

    it('merges multiple host resolver rules args with later (user-supplied) rules first', () => {
      const args = [
        '--host-resolver-rules=MAP foobar.com 127.0.0.1',
        '--foo',
        '--host-resolver-rules=MAP example.com 10.0.0.1,MAP foobar.com 10.0.0.2',
      ]

      expect(chrome._normalizeHostResolverRules(args)).toEqual([
        '--foo',
        '--host-resolver-rules=MAP example.com 10.0.0.1,MAP foobar.com 10.0.0.2,MAP foobar.com 127.0.0.1',
      ])
    })

    it('drops empty host resolver rules args when merging', () => {
      const args = [
        '--host-resolver-rules=',
        '--host-resolver-rules=MAP foobar.com 127.0.0.1',
        '--host-resolver-rules=MAP example.com 10.0.0.1',
      ]

      expect(chrome._normalizeHostResolverRules(args)).toEqual([
        '--host-resolver-rules=MAP example.com 10.0.0.1,MAP foobar.com 127.0.0.1',
      ])
    })

    it('does not let a trailing empty arg clobber a single non-empty rule', () => {
      const args = [
        '--host-resolver-rules=MAP foobar.com 127.0.0.1',
        '--host-resolver-rules=',
      ]

      expect(chrome._normalizeHostResolverRules(args)).toEqual([
        '--host-resolver-rules=MAP foobar.com 127.0.0.1',
      ])
    })

    it('drops the switch entirely when every value is empty', () => {
      const args = [
        '--foo',
        '--host-resolver-rules=',
        '--host-resolver-rules=',
      ]

      expect(chrome._normalizeHostResolverRules(args)).toEqual(['--foo'])
    })
  })

  describe('#_getChromePreferences', () => {
    it('returns map of empty if the files do not exist', async () => {
      stubFsByPath('readJson', {
        '/foo/Default/Preferences': enoent,
        '/foo/Default/Secure Preferences': enoent,
        '/foo/Local State': enoent,
      })

      await expect(chrome._getChromePreferences('/foo')).resolves.toEqual({
        default: {},
        defaultSecure: {},
        localState: {},
      })
    })

    it('returns map of json objects if the files do exist', async () => {
      stubFsByPath('readJson', {
        '/foo/Default/Preferences': () => Promise.resolve({ foo: 'bar' }),
        '/foo/Default/Secure Preferences': () => Promise.resolve({ bar: 'baz' }),
        '/foo/Local State': () => Promise.resolve({ baz: 'quux' }),
      })

      await expect(chrome._getChromePreferences('/foo')).resolves.toEqual({
        default: { foo: 'bar' },
        defaultSecure: { bar: 'baz' },
        localState: { baz: 'quux' },
      })
    })
  })

  describe('#_mergeChromePreferences', () => {
    it('merges as expected', () => {
      const originalPrefs = {
        default: {},
        defaultSecure: {
          foo: 'bar',
          deleteThis: 'nephew',
        },
        localState: {},
      }

      const newPrefs = {
        default: {
          something: {
            nested: 'here',
          },
        },
        defaultSecure: {
          deleteThis: null,
        },
        someGarbage: true,
      }

      const expected = {
        default: {
          something: {
            nested: 'here',
          },
        },
        defaultSecure: {
          foo: 'bar',
        },
        localState: {},
      }

      expect(chrome._mergeChromePreferences(originalPrefs, newPrefs as any)).toEqual(expected)
    })
  })

  describe('#_writeChromePreferences', () => {
    it('writes json as expected', async () => {
      const outputJson = stubFsByPath('outputJson', {
        '/foo/Default/Preferences': resolved,
        '/foo/Default/Secure Preferences': resolved,
        '/foo/Local State': resolved,
      })

      const originalPrefs = {
        default: {},
        defaultSecure: {
          foo: 'bar',
          deleteThis: 'nephew',
        },
        localState: {},
      }

      const newPrefs = chrome._mergeChromePreferences(originalPrefs, {
        default: {
          something: {
            nested: 'here',
          },
        },
        defaultSecure: {
          deleteThis: null,
        },
        someGarbage: true,
      } as any)

      await expect(chrome._writeChromePreferences('/foo', originalPrefs, newPrefs)).resolves.toBeUndefined()

      expectCalledWith(outputJson, '/foo/Default/Preferences', {
        something: {
          nested: 'here',
        },
      })

      expectCalledWith(outputJson, '/foo/Default/Secure Preferences', {
        foo: 'bar',
      })

      // no changes were made
      expectNotCalledWith(outputJson, '/foo/Local State')
    })

    it('writes default preferences when they do not exist on disk', async () => {
      const outputJson = stubFsByPath('outputJson', {
        '/foo/Default/Preferences': resolved,
        '/foo/Default/Secure Preferences': resolved,
        '/foo/Local State': resolved,
      })

      // Mock _getDefaultChromePreferences to return fake preferences for testing
      const mockDefaultPrefs = mockGetDefaultChromePreferences()

      // Simulate empty preferences read from disk (no defaults exist yet)
      const originalPrefs = {
        default: {},
        defaultSecure: {},
        localState: {},
      }

      // Get the default preferences that should be written
      const defaultChromePrefs = chrome._getDefaultChromePreferences()

      await chrome._writeChromePreferences('/foo', originalPrefs, defaultChromePrefs)

      // Should write default preferences since they don't exist on disk
      expectCalledWith(outputJson, '/foo/Default/Preferences', {
        fake_preference: {
          value: 'value',
        },
      })

      // defaultSecure is empty, so it should not be written
      expectNotCalledWith(outputJson, '/foo/Default/Secure Preferences')

      expectCalledWith(outputJson, '/foo/Local State', {
        fake_local_state: {
          value: 'value',
        },
      })

      mockDefaultPrefs.mockRestore()
    })
  })

  describe('#_getDefaultChromePreferences', () => {
    it('returns expected default preferences', () => {
      const defaultPrefs = chrome._getDefaultChromePreferences()

      expect(defaultPrefs).toBeTypeOf('object')
      expect(defaultPrefs).toHaveProperty('default')
      expect(defaultPrefs).toHaveProperty('defaultSecure')
      expect(defaultPrefs).toHaveProperty('localState')
    })
  })

  describe('#_getChromePreferencesWithDefaults', () => {
    let readJsonByPath: PathBehaviors

    beforeEach(() => {
      readJsonByPath = {}
      stubFsByPath('readJson', readJsonByPath)
    })

    it('merges defaults with existing preferences', async () => {
      const mockDefaults = createMockDefaultPreferences()
      const mockDefaultPrefs = vi.spyOn(chrome, '_getDefaultChromePreferences').mockReturnValue(mockDefaults)

      readJsonByPath['/foo/Default/Preferences'] = () => Promise.resolve({ existing: 'value' })
      readJsonByPath['/foo/Default/Secure Preferences'] = () => Promise.resolve({ secure: 'value' })
      readJsonByPath['/foo/Local State'] = () => Promise.resolve({ local: 'value' })

      try {
        const result = await chrome._getChromePreferencesWithDefaults('/foo')

        // Should merge defaults with existing preferences, where existing values take precedence
        expect(result).toEqual({
          default: {
            fake_preference: {
              value: 'value',
            },
            existing: 'value', // existing preference should be merged in
          },
          defaultSecure: {
            secure: 'value', // existing preference should be merged in
          },
          localState: {
            fake_local_state: {
              value: 'value',
            },
            local: 'value', // existing preference should be merged in
          },
        })
      } finally {
        mockDefaultPrefs.mockRestore()
      }
    })

    it('returns defaults when no existing preferences', async () => {
      const mockDefaults = createMockDefaultPreferences()
      const mockDefaultPrefs = vi.spyOn(chrome, '_getDefaultChromePreferences').mockReturnValue(mockDefaults)

      readJsonByPath['/foo/Default/Preferences'] = enoent
      readJsonByPath['/foo/Default/Secure Preferences'] = enoent
      readJsonByPath['/foo/Local State'] = enoent

      try {
        const result = await chrome._getChromePreferencesWithDefaults('/foo')

        expect(result).toEqual(mockDefaults)
      } finally {
        mockDefaultPrefs.mockRestore()
      }
    })
  })

  describe('#_getChromePreferences with IGNORE_CHROME_PREFERENCES', () => {
    beforeEach(() => {
      process.env.IGNORE_CHROME_PREFERENCES = 'true'
    })

    afterEach(() => {
      delete process.env.IGNORE_CHROME_PREFERENCES
    })

    it('returns empty preferences when IGNORE_CHROME_PREFERENCES is set', async () => {
      const result = await chrome._getChromePreferences('/foo')

      expect(result).toEqual({
        default: {},
        defaultSecure: {},
        localState: {},
      })
    })
  })

  describe('#_writeChromePreferences with IGNORE_CHROME_PREFERENCES', () => {
    beforeEach(() => {
      process.env.IGNORE_CHROME_PREFERENCES = 'true'
    })

    afterEach(() => {
      delete process.env.IGNORE_CHROME_PREFERENCES
    })

    it('does not write preferences when IGNORE_CHROME_PREFERENCES is set', async () => {
      const outputJson = vi.spyOn(fs, 'outputJson').mockImplementation(() => undefined as any)

      const originalPrefs = { default: {}, defaultSecure: {}, localState: {} }
      const newPrefs = { default: { test: 'value' }, defaultSecure: {}, localState: {} }

      await chrome._writeChromePreferences('/foo', originalPrefs, newPrefs)

      expect(outputJson).not.toHaveBeenCalled()
    })
  })

  describe('#_mergeChromePreferences with user preferences', () => {
    it('merges user preferences with defaults correctly', () => {
      // Mock _getDefaultChromePreferences to return fake preferences for testing
      const mockDefaultPrefs = mockGetDefaultChromePreferences()

      const defaultPrefs = chrome._getDefaultChromePreferences()
      const userPrefs = {
        default: {
          fake_preference: {
            value: 'value',
          },
          newSetting: 'userValue', // User adds new setting
        },
        defaultSecure: {
          fake_secure_preference: {
            value: 'value',
          },
        },
        localState: {
          fake_local_state: {
            value: 'value',
          },
          newLocalSetting: 'userValue', // User adds new setting
        },
      }

      const result = chrome._mergeChromePreferences(defaultPrefs, userPrefs)

      expect(result.default).toEqual({
        fake_preference: {
          value: 'value',
        },
        newSetting: 'userValue', // User addition
      })

      expect(result.localState).toEqual({
        fake_local_state: {
          value: 'value',
        },
        newLocalSetting: 'userValue', // User addition
      })

      mockDefaultPrefs.mockRestore()
    })

    it('handles preference deletion with null values', () => {
      const originalPrefs = {
        default: {
          keepThis: 'value',
          deleteThis: 'value',
        },
        defaultSecure: {
          keepThis: 'value',
          deleteThis: 'value',
        },
        localState: {
          keepThis: 'value',
          deleteThis: 'value',
        },
      }

      const newPrefs = {
        default: {
          deleteThis: null, // Should be deleted
          addThis: 'newValue',
        },
        defaultSecure: {
          deleteThis: null, // Should be deleted
        },
        localState: {
          deleteThis: null, // Should be deleted
          addThis: 'newValue',
        },
      }

      const result = chrome._mergeChromePreferences(originalPrefs, newPrefs)

      expect(result.default).toEqual({
        keepThis: 'value',
        addThis: 'newValue',
      })

      expect(result.defaultSecure).toEqual({
        keepThis: 'value',
      })

      expect(result.localState).toEqual({
        keepThis: 'value',
        addThis: 'newValue',
      })
    })
  })

  describe('#_getChromePreferences error handling', () => {
    let readJsonByPath: PathBehaviors

    beforeEach(() => {
      readJsonByPath = {}
      stubFsByPath('readJson', readJsonByPath)
    })

    it('handles corrupted preference files gracefully', () => {
      readJsonByPath['/foo/Default/Preferences'] = enoent
      readJsonByPath['/foo/Default/Secure Preferences'] = () => Promise.reject(new Error('Invalid JSON'))
      readJsonByPath['/foo/Local State'] = () => Promise.resolve({ valid: 'data' })

      return chrome._getChromePreferences('/foo')
      .then(() => {
        expect.unreachable('Should have thrown an error for corrupted file')
      })
      .catch((err) => {
        expect(err.message).toContain('Invalid JSON')
      })
    })

    it('handles missing files gracefully', async () => {
      readJsonByPath['/foo/Default/Preferences'] = enoent
      readJsonByPath['/foo/Default/Secure Preferences'] = enoent
      readJsonByPath['/foo/Local State'] = enoent

      const result = await chrome._getChromePreferences('/foo')

      expect(result).toEqual({
        default: {},
        defaultSecure: {},
        localState: {},
      })
    })
  })

  describe('#open integration with preferences', () => {
    let pageCriClient: any
    let browserCriClient: any
    let automation: any
    let launchedBrowser: any
    let outputJson: MockInstance
    let executeBeforeBrowserLaunch: MockInstance

    beforeEach(() => {
      // Mock all the dependencies
      pageCriClient = {
        send: vi.fn(() => Promise.resolve()),
        Page: { screencastFrame: vi.fn() },
        close: vi.fn(() => Promise.resolve()),
        on: vi.fn(),
      }

      const attachedPageCriClient = pageCriClient

      browserCriClient = {
        attachToTargetUrl: vi.fn(() => Promise.resolve(attachedPageCriClient)),
        close: vi.fn(() => Promise.resolve()),
        getWebSocketDebuggerUrl: vi.fn(() => 'ws://debugger'),
        resetBrowserTargets: vi.fn(() => Promise.resolve()),
      }

      automation = {
        push: vi.fn(),
        use: vi.fn(),
        onServiceWorkerClientEvent: vi.fn(),
      }

      launchedBrowser = {
        kill: vi.fn(),
      }

      vi.spyOn(chrome, '_writeExtension').mockResolvedValue('/path/to/ext')
      vi.spyOn(BrowserCriClient, 'create').mockResolvedValue(browserCriClient)
      vi.spyOn(utils, 'getProfileDir').mockReturnValue('/profile/dir')
      vi.spyOn(utils, 'ensureCleanCache').mockResolvedValue('/profile/dir/CypressCache')
      vi.spyOn(utils, 'initializeCDP').mockResolvedValue()
      vi.spyOn(utils, 'getDefaultLaunchOptions').mockReturnValue({ args: [], preferences: null } as any)
      executeBeforeBrowserLaunch = vi.spyOn(utils, 'executeBeforeBrowserLaunch').mockResolvedValue({ args: [], preferences: null } as any)
      vi.spyOn(utils, 'executeAfterBrowserLaunch').mockResolvedValue()
      vi.spyOn(protocol, 'getRemoteDebuggingPort').mockResolvedValue(50505)
      vi.spyOn(launch, 'launch').mockResolvedValue(launchedBrowser)

      // Mock _getDefaultChromePreferences to return fake preferences for testing
      mockGetDefaultChromePreferences()

      stubFsByPath('readJson', {
        '/profile/dir/Default/Preferences': enoent,
        '/profile/dir/Default/Secure Preferences': enoent,
        '/profile/dir/Local State': enoent,
      })

      outputJson = vi.spyOn(fs, 'outputJson').mockResolvedValue(undefined)
    })

    it('writes default preferences during browser launch', async () => {
      await chrome.open({ isHeadless: true } as any, 'http://localhost:3000', openOpts as any, automation)

      // Verify that default preferences were written
      expectCalledWith(
        outputJson,
        '/profile/dir/Default/Preferences',
        expect.objectContaining({
          fake_preference: {
            value: 'value',
          },
        }),
      )

      expectCalledWith(
        outputJson,
        '/profile/dir/Local State',
        expect.objectContaining({
          fake_local_state: {
            value: 'value',
          },
        }),
      )
    })

    it('merges user preferences with defaults during launch', async () => {
      const userPreferences = {
        default: {
          fake_preference: {
            value: 'value',
          },
          customSetting: 'userValue',
        },
        localState: {
          fake_local_state: {
            value: 'value',
          },
        },
      }

      executeBeforeBrowserLaunch.mockResolvedValue({
        args: [],
        preferences: userPreferences,
      })

      await chrome.open({ isHeadless: true } as any, 'http://localhost:3000', openOpts as any, automation)

      // Verify that merged preferences were written
      expectCalledWith(
        outputJson,
        '/profile/dir/Default/Preferences',
        expect.objectContaining({
          fake_preference: {
            value: 'value',
          },
          customSetting: 'userValue', // User addition
        }),
      )

      expectCalledWith(
        outputJson,
        '/profile/dir/Local State',
        expect.objectContaining({
          fake_local_state: {
            value: 'value',
          },
        }),
      )
    })
  })
})
