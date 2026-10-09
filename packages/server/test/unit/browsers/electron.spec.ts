import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import _ from 'lodash'
import EE from 'events'
import la from 'lazy-ass'
import { Automation } from '../../../lib/automation'
import { BrowserCriClient } from '../../../lib/browsers/browser-cri-client'
import * as electronApp from '../../../lib/util/electron-app'
import utils from '../../../lib/browsers/utils'
import { screencastOpts } from '../../../lib/browsers/cdp-protocol/cdp_automation'
import menu from '../../../lib/gui/menu'
import * as plugins from '../../../lib/plugins'
import * as Windows from '../../../lib/gui/windows'
import electron from '../../../lib/browsers/electron'
import * as savedState from '../../../lib/saved_state'
import type { BrowserLaunchOpts } from '@packages/types'

vi.mock('electron', async () => {
  const { default: electronStub } = await import('../../support/helpers/electron_stub')

  return { ...electronStub, default: electronStub }
})

const ELECTRON_PID = 10001

const isMatch = (actual: unknown, expected: unknown) => {
  try {
    expect(actual).toStrictEqual(expected)

    return true
  } catch {
    return false
  }
}

const callsWith = (mock: Mock, ...expected: unknown[]) => {
  return mock.mock.calls.filter((args) => expected.length <= args.length && isMatch(args.slice(0, expected.length), expected))
}

// unlike toHaveBeenCalledWith, matches on leading arguments and ignores any extra ones
const expectCalledWith = (mock: unknown, ...expected: unknown[]) => {
  expect(callsWith(mock as Mock, ...expected), `calls matching ${String(expected[0])}`).not.toHaveLength(0)
}

const expectNotCalledWith = (mock: unknown, ...expected: unknown[]) => {
  expect(callsWith(mock as Mock, ...expected), `calls matching ${String(expected[0])}`).toHaveLength(0)
}

// unlike expect.anything(), also matches null and undefined
const anyArg = { asymmetricMatch: () => true }

const findCallback = (args: unknown[]) => args.find((arg): arg is (...callbackArgs: unknown[]) => unknown => typeof arg === 'function')!

// invokes the callback argument of every call made with these leading arguments
const yieldTo = (mock: Mock, ...expected: unknown[]) => {
  return (...callbackArgs: unknown[]) => {
    const calls = callsWith(mock, ...expected)

    expect(calls, `calls matching ${String(expected[0])}`).not.toHaveLength(0)

    calls.forEach((args) => findCallback(args)(...callbackArgs))
  }
}

// invokes the first callback argument it is called with
const callsCallbackWith = (...callbackArgs: unknown[]) => {
  return (...args: unknown[]) => findCallback(args)(...callbackArgs)
}

describe('lib/browsers/electron', () => {
  let protocolManager: any
  let cyPromptManager: any
  let studioManager: any
  let url: string
  let state: any
  let options: any
  let automation: any
  let win: any
  let pageCriClient: any
  let browserCriClient: any
  let stubForOpen: () => Promise<unknown>

  beforeEach(() => {
    protocolManager = {
      connectToBrowser: vi.fn().mockResolvedValue(undefined),
    }

    cyPromptManager = {
      connectToBrowser: vi.fn().mockResolvedValue(undefined),
    }

    studioManager = {
      connectToBrowser: vi.fn().mockResolvedValue(undefined),
    }

    url = 'https://foo.com'
    state = {}
    options = {
      isTextTerminal: false,
      some: 'var',
      projectRoot: '/foo/',
      onWarning: vi.fn().mockReturnValue(undefined),
      browser: {
        isHeadless: false,
      },
      onError: () => {},
      // Electron is deprecated as a test browser, so every launch resolves to the
      // legacy proxy path.
      useBrowserNetworkInterception: false,
    } as unknown as BrowserLaunchOpts & { some: string }

    automation = new Automation({
      cyNamespace: 'foo',
      cookieNamespace: 'bar',
      screenshotsFolder: 'baz',
      onServiceWorkerClientEvent: vi.fn(),
    })

    win = _.extend(new EE(), {
      isDestroyed () {
        return false
      },
      close: vi.fn(),
      loadURL: vi.fn(),
      focusOnWebView: vi.fn(),
      show: vi.fn(),
      destroy: vi.fn(),
      webContents: {
        session: {
          cookies: {
            get: vi.fn(),
            set: vi.fn(),
            remove: vi.fn(),
          },
          on: vi.fn(),
          webRequest: {
            onBeforeSendHeaders () {},
          },
          setUserAgent: vi.fn(),
          getUserAgent: vi.fn(),
          clearCache: vi.fn(),
        },
        on: vi.fn(),
        getOSProcessId: vi.fn().mockReturnValue(ELECTRON_PID),
      },
    })

    vi.spyOn(Windows, 'installExtension').mockReturnValue(undefined)
    vi.spyOn(Windows, 'removeAllExtensions').mockReturnValue(undefined)
    vi.spyOn(electronApp, 'getRemoteDebuggingPort').mockResolvedValue('1234')
    vi.spyOn(utils, 'initializeCDP').mockResolvedValue(undefined)

    // mock CRI client during testing
    pageCriClient = {
      send: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      clone: vi.fn().mockResolvedValue(undefined),
    }

    browserCriClient = {
      attachToTargetUrl: vi.fn().mockResolvedValue(pageCriClient),
      currentlyAttachedTarget: pageCriClient,
      close: vi.fn().mockResolvedValue(undefined),
      getWebSocketDebuggerUrl: vi.fn().mockReturnValue('ws://debugger'),
    }

    vi.spyOn(BrowserCriClient, 'create').mockResolvedValue(browserCriClient)

    stubForOpen = () => {
      vi.spyOn(electron, '_render').mockResolvedValue(win)
      vi.spyOn(plugins, 'has').mockImplementation(() => undefined as any)
      vi.spyOn(plugins, 'execute').mockImplementation(() => undefined as any)

      return savedState.create()
      .then((savedStateInstance) => {
        la(_.isFunction(savedStateInstance.get), 'state is missing .get to stub', savedStateInstance)

        return vi.spyOn(savedStateInstance, 'get').mockResolvedValue(state)
      })
    }
  })

  afterEach(() => {
    electron.clearInstanceState()
    vi.restoreAllMocks()
  })

  describe('.connectToNewSpec', () => {
    it('throws an error', async () => {
      expect(() => {
        // @ts-expect-error
        electron.connectToNewSpec({ isHeaded: true }, { url: 'http://www.example.com' }, automation)
      }).toThrow('Attempting to connect to a new spec is not supported for electron, use open instead')
    })
  })

  describe('.open', () => {
    beforeEach(async () => {
      // shortcut to set the browserCriClient singleton variable
      // @ts-expect-error
      await electron._getAutomation({}, { onError: () => {} }, {})

      await stubForOpen()
    })

    it('calls render with url, state, and options', () => {
      // @ts-expect-error
      return electron.open('electron', url, options, automation)
      .then(() => {
        // @ts-expect-error
        let expectedOptions = electron._defaultOptions(options.projectRoot, state, options)

        expectedOptions = Windows.defaults(expectedOptions)

        // @ts-expect-error
        const preferencesKeys = _.keys(electron._render.mock.calls[0][2])

        expect(_.keys(expectedOptions)).toStrictEqual(preferencesKeys)

        // @ts-expect-error
        const electronOptionsArg = electron._render.mock.calls[0][3]

        expect(electronOptionsArg.projectRoot).toBe(options.projectRoot)
        expect(electronOptionsArg.isTextTerminal).toBe(options.isTextTerminal)

        expectCalledWith(electron._render,
          url,
          automation,
        )
      })
    })

    it('returns custom object emitter interface', () => {
      // @ts-expect-error
      return electron.open('electron', url, options, automation)
      .then((obj) => {
        // @ts-expect-error
        expect(obj.browserWindow).toBe(win)
        expect(obj.kill).toBeTypeOf('function')
        expect(obj.removeAllListeners).toBeTypeOf('function')

        expect(win.webContents.getOSProcessId).toHaveBeenCalledOnce()

        expect(obj.pid).toBe(ELECTRON_PID)
        expect(obj.allPids).toStrictEqual([ELECTRON_PID])
      })
    })

    it('executeBeforeBrowserLaunch is noop when before:browser:launch yields null', () => {
      vi.mocked(plugins.has).mockReturnValue(true)
      vi.mocked(plugins.execute).mockResolvedValue(null)

      // @ts-expect-error
      return electron.open('electron', url, options, automation)
      .then(() => {
        // @ts-expect-error
        const renderOptions = electron._render.mock.calls[0][2]

        expect(Object.keys(renderOptions)).toEqual(expect.arrayContaining(['onFocus', 'onNewWindow', 'onCrashed']))
      })
    })

    // https://github.com/cypress-io/cypress/issues/1992
    it('it merges in user preferences without removing essential options', () => {
      vi.mocked(plugins.has).mockReturnValue(true)
      vi.mocked(plugins.execute).mockImplementation((event) => {
        return event === 'before:browser:launch' ? Promise.resolve({ preferences: { foo: 'bar' } }) : undefined as any
      })

      // @ts-expect-error
      return electron.open('electron', url, options, automation)
      .then(() => {
        // @ts-expect-error
        const renderOptions = electron._render.mock.calls[0][2]

        expect(Object.keys(renderOptions)).toEqual(expect.arrayContaining(['foo', 'onFocus', 'onNewWindow', 'onCrashed']))
      })
    })

    it('installs supplied extensions from before:browser:launch and warns on failure', () => {
      vi.mocked(plugins.has).mockReturnValue(true)
      vi.mocked(plugins.execute).mockResolvedValue({ extensions: ['foo', 'bar'] })

      vi.mocked(Windows.installExtension).mockImplementation((_win, extensionPath) => {
        if (extensionPath === 'bar') {
          throw new Error('Error')
        }
      })

      // @ts-expect-error
      return electron.open('electron', url, options, automation)
      .then(() => {
        expect(Windows.removeAllExtensions).toHaveBeenCalledOnce()

        expect(Windows.installExtension).toHaveBeenCalledTimes(2)
        expectCalledWith(Windows.installExtension, anyArg, 'foo')
        expectCalledWith(Windows.installExtension, anyArg, 'bar')

        expect(options.onWarning).toHaveBeenCalledOnce()

        const warning = options.onWarning.mock.calls[0][0].message

        expect(warning).toContain('Electron')
        expect(warning).toContain('bar')

        win.emit('closed')

        // called once before installing extensions, once on exit
        expect(Windows.removeAllExtensions).toHaveBeenCalledTimes(2)
      })
    })

    it('sends after:browser:launch with debugger url', () => {
      vi.mocked(plugins.has).mockReturnValue(true)
      vi.mocked(plugins.execute).mockResolvedValue(null)

      // @ts-expect-error
      return electron.open('electron', url, options, automation)
      .then(() => {
        expectCalledWith(plugins.execute, 'after:browser:launch', 'electron', {
          webSocketDebuggerUrl: 'ws://debugger',
        })
      })
    })

    it('executeAfterBrowserLaunch is noop if after:browser:launch is not registered', () => {
      // @ts-expect-error
      return electron.open('electron', url, options, automation)
      .then(() => {
        expectNotCalledWith(plugins.execute, 'after:browser:launch')
      })
    })
  })

  describe('.connectProtocolToBrowser', () => {
    it('connects to the browser cri client', async () => {
      const mockCurrentlyAttachedProtocolTarget = {}

      browserCriClient.currentlyAttachedProtocolTarget = mockCurrentlyAttachedProtocolTarget
      vi.spyOn(electron, '_getBrowserCriClient').mockReturnValue(browserCriClient)

      await electron.connectProtocolToBrowser({ protocolManager: protocolManager })
      expect(pageCriClient.clone).not.toHaveBeenCalled()
      expectCalledWith(protocolManager.connectToBrowser, mockCurrentlyAttachedProtocolTarget)
    })

    it('connects to the browser cri client when the protocol target has not been created', async () => {
      const mockCurrentlyAttachedProtocolTarget = {}

      pageCriClient.clone.mockResolvedValue(mockCurrentlyAttachedProtocolTarget)
      vi.spyOn(electron, '_getBrowserCriClient').mockReturnValue(browserCriClient)

      await electron.connectProtocolToBrowser({ protocolManager: protocolManager })
      expect(pageCriClient.clone).toHaveBeenCalled()
      expectCalledWith(protocolManager.connectToBrowser, mockCurrentlyAttachedProtocolTarget)
      expect(browserCriClient.currentlyAttachedProtocolTarget).toBe(mockCurrentlyAttachedProtocolTarget)
    })

    it('throws error if there is no browser cri client', async () => {
      vi.spyOn(electron, '_getBrowserCriClient').mockReturnValue(null)

      await expect(electron.connectProtocolToBrowser({ protocolManager: protocolManager })).rejects.toThrow('Missing pageCriClient in connectProtocolToBrowser')
      expect(protocolManager.connectToBrowser).not.toHaveBeenCalled()
    })

    it('throws error if there is no page cri client', async () => {
      browserCriClient.currentlyAttachedTarget = null

      vi.spyOn(electron, '_getBrowserCriClient').mockReturnValue(browserCriClient)

      await expect(electron.connectProtocolToBrowser({ protocolManager: protocolManager })).rejects.toThrow('Missing pageCriClient in connectProtocolToBrowser')
      expect(protocolManager.connectToBrowser).not.toHaveBeenCalled()
    })
  })

  describe('.connectCyPromptToBrowser', () => {
    it('connects to the browser cri client', async () => {
      const mockCurrentlyAttachedCyPromptTarget = {}

      browserCriClient.currentlyAttachedCyPromptTarget = mockCurrentlyAttachedCyPromptTarget
      vi.spyOn(electron, '_getBrowserCriClient').mockReturnValue(browserCriClient)

      await electron.connectCyPromptToBrowser({ cyPromptManager: cyPromptManager })
      expect(pageCriClient.clone).not.toHaveBeenCalled()
      expectCalledWith(cyPromptManager.connectToBrowser, mockCurrentlyAttachedCyPromptTarget)
    })

    it('connects to the browser cri client when the cy prompt target has not been created', async () => {
      const mockCurrentlyAttachedCyPromptTarget = {}

      pageCriClient.clone.mockResolvedValue(mockCurrentlyAttachedCyPromptTarget)
      vi.spyOn(electron, '_getBrowserCriClient').mockReturnValue(browserCriClient)

      await electron.connectCyPromptToBrowser({ cyPromptManager: cyPromptManager })
      expect(pageCriClient.clone).toHaveBeenCalled()
      expectCalledWith(cyPromptManager.connectToBrowser, mockCurrentlyAttachedCyPromptTarget)
      expect(browserCriClient.currentlyAttachedCyPromptTarget).toBe(mockCurrentlyAttachedCyPromptTarget)
    })

    it('throws error if there is no browser cri client', async () => {
      vi.spyOn(electron, '_getBrowserCriClient').mockReturnValue(null)

      await expect(electron.connectCyPromptToBrowser({ cyPromptManager: cyPromptManager })).rejects.toThrow('Missing pageCriClient in connectCyPromptToBrowser')
      expect(cyPromptManager.connectToBrowser).not.toHaveBeenCalled()
    })

    it('throws error if there is no page cri client', async () => {
      browserCriClient.currentlyAttachedTarget = null

      vi.spyOn(electron, '_getBrowserCriClient').mockReturnValue(browserCriClient)

      await expect(electron.connectCyPromptToBrowser({ cyPromptManager: cyPromptManager })).rejects.toThrow('Missing pageCriClient in connectCyPromptToBrowser')
      expect(cyPromptManager.connectToBrowser).not.toHaveBeenCalled()
    })
  })

  describe('.connectStudioToBrowser', () => {
    it('connects to the browser cri client', async () => {
      const mockCurrentlyAttachedStudioTarget = {}

      browserCriClient.currentlyAttachedStudioTarget = mockCurrentlyAttachedStudioTarget
      vi.spyOn(electron, '_getBrowserCriClient').mockReturnValue(browserCriClient)

      await electron.connectStudioToBrowser({ studioManager: studioManager })
      expect(pageCriClient.clone).not.toHaveBeenCalled()
      expectCalledWith(studioManager.connectToBrowser, mockCurrentlyAttachedStudioTarget)
    })

    it('connects to the browser cri client when the studio target has not been created', async () => {
      const mockCurrentlyAttachedStudioTarget = {}

      pageCriClient.clone.mockResolvedValue(mockCurrentlyAttachedStudioTarget)
      vi.spyOn(electron, '_getBrowserCriClient').mockReturnValue(browserCriClient)

      await electron.connectStudioToBrowser({ studioManager: studioManager })
      expect(pageCriClient.clone).toHaveBeenCalled()
      expectCalledWith(studioManager.connectToBrowser, mockCurrentlyAttachedStudioTarget)
      expect(browserCriClient.currentlyAttachedStudioTarget).toBe(mockCurrentlyAttachedStudioTarget)
    })

    it('throws error if there is no browser cri client', async () => {
      vi.spyOn(electron, '_getBrowserCriClient').mockReturnValue(null)

      await expect(electron.connectStudioToBrowser({ studioManager: studioManager })).rejects.toThrow('Missing pageCriClient in connectStudioToBrowser')
      expect(studioManager.connectToBrowser).not.toHaveBeenCalled()
    })

    it('throws error if there is no page cri client', async () => {
      browserCriClient.currentlyAttachedTarget = null

      vi.spyOn(electron, '_getBrowserCriClient').mockReturnValue(browserCriClient)

      await expect(electron.connectStudioToBrowser({ studioManager: studioManager })).rejects.toThrow('Missing pageCriClient in connectStudioToBrowser')
      expect(studioManager.connectToBrowser).not.toHaveBeenCalled()
    })
  })

  describe('#closeProtocolConnection', () => {
    it('closes the protocol connection', async () => {
      const mockCurrentlyAttachedProtocolTarget = {
        close: vi.fn().mockResolvedValue(undefined),
      }

      const browserCriClient = {
        currentlyAttachedProtocolTarget: mockCurrentlyAttachedProtocolTarget,
      }

      // @ts-expect-error
      vi.spyOn(electron, '_getBrowserCriClient').mockReturnValue(browserCriClient)

      await electron.closeProtocolConnection()

      expect(mockCurrentlyAttachedProtocolTarget.close).toHaveBeenCalled()
      expect(browserCriClient.currentlyAttachedProtocolTarget).toBeUndefined()
    })
  })

  describe('.kill', () => {
    beforeEach(async () => {
      // @ts-expect-error
      await electron._getAutomation({}, { onError: () => {} }, {})

      await stubForOpen()

      vi.spyOn(electron, '_getBrowserCriClient').mockReturnValue(browserCriClient)
    })

    it('does not terminate the browserCriClient if the instance is an orphaned process', async () => {
      // @ts-expect-error
      const instance = await electron.open('electron', url, options, automation)

      instance.isOrphanedBrowserProcess = true
      instance.kill()

      expect(browserCriClient.close).not.toHaveBeenCalled()
    })

    it('terminates the browserCriClient otherwise', async () => {
      // @ts-expect-error
      const instance = await electron.open('electron', url, options, automation)

      instance.kill()

      expect(browserCriClient.close).toHaveBeenCalled()
    })
  })

  describe('._launch', () => {
    beforeEach(() => {
      vi.spyOn(menu, 'set').mockImplementation(() => undefined)
      vi.spyOn(electron, '_clearCache').mockResolvedValue(undefined)
      vi.spyOn(electron, '_setProxy').mockResolvedValue(undefined)
      vi.spyOn(electron, '_setUserAgent').mockImplementation(() => undefined)
      vi.spyOn(electron, '_getUserAgent').mockImplementation(() => undefined)
    })

    it('sets menu.set whether or not its in headless mode', () => {
      // @ts-expect-error
      return electron._launch(win, url, automation, { show: true, onError: () => {} }, undefined, undefined, { attachCDPClient: vi.fn() })
      .then(() => {
        expectCalledWith(menu.set, { withInternalDevTools: true })
      }).then(() => {
        vi.mocked(menu.set).mockClear()

        // @ts-expect-error
        return electron._launch(win, url, automation, { show: false, onError: () => {} })
      }).then(() => {
        expect(menu.set).not.toHaveBeenCalled()
      })
    })

    it('sets user agent if options.userAgent', () => {
      return electron._launch(win, url, automation, options, undefined, undefined, { attachCDPClient: vi.fn() })
      .then(() => {
        expect(electron._setUserAgent).not.toHaveBeenCalled()
      }).then(() => {
        // @ts-expect-error
        return electron._launch(win, url, automation, { userAgent: 'foo', onError: () => {} }, undefined, undefined, { attachCDPClient: vi.fn() })
      }).then(() => {
        expectCalledWith(electron._setUserAgent, win.webContents, 'foo')
      })
    })

    it('sets proxy if options.proxyServer', () => {
      return electron._launch(win, url, automation, options, undefined, undefined, { attachCDPClient: vi.fn() })
      .then(() => {
        expect(electron._setProxy).not.toHaveBeenCalled()
      }).then(() => {
        // @ts-expect-error
        return electron._launch(win, url, automation, {
          proxyServer: 'foo',
          proxyBypassList: '<-loopback>,example.com',
          onError: () => {},
        }, undefined, undefined, { attachCDPClient: vi.fn() })
      }).then(() => {
        expectCalledWith(electron._setProxy, win.webContents, 'foo', '<-loopback>,example.com')
      })
    })

    it('calls win.loadURL with url', () => {
      return electron._launch(win, url, automation, options, undefined, undefined, { attachCDPClient: vi.fn() })
      .then(() => {
        expectCalledWith(win.loadURL, url)
      })
    })

    it('resolves with win', () => {
      return electron._launch(win, url, automation, options, undefined, undefined, { attachCDPClient: vi.fn() })
      .then((result) => {
        expect(result).toBe(win)
      })
    })

    // https://github.com/cypress-io/cypress/issues/2118
    it('prevents the default beforeunload prompt on will-prevent-unload so navigation is not blocked', () => {
      return electron._launch(win, url, automation, options, undefined, undefined, { attachCDPClient: vi.fn() })
      .then(() => {
        const call = win.webContents.on.mock.calls.find((c) => c[0] === 'will-prevent-unload')

        expect(call, 'a will-prevent-unload listener was registered').toBeDefined()

        const event = { preventDefault: vi.fn() }

        call[1](event)

        expect(event.preventDefault).toHaveBeenCalledOnce()
      })
    })

    it('pushes create:download when download begins', () => {
      const downloadItem = {
        getETag: () => '1',
        getFilename: () => 'file.csv',
        getMimeType: () => 'text/csv',
        getURL: () => 'http://localhost:1234/file.csv',
        once: vi.fn(),
      }

      win.webContents.session.on.mockImplementation((event, callback) => {
        if (event === 'will-download') {
          callback({}, downloadItem)
        }
      })

      options.downloadsFolder = 'downloads'
      vi.spyOn(automation, 'push').mockImplementation(() => undefined)

      return electron._launch(win, url, automation, options, undefined, undefined, { attachCDPClient: vi.fn() })
      .then(() => {
        expectCalledWith(automation.push, 'create:download', {
          id: '1',
          filePath: 'downloads/file.csv',
          mime: 'text/csv',
          url: 'http://localhost:1234/file.csv',
        })
      })
    })

    it('pushes complete:download when download is done', () => {
      const downloadItem = {
        getETag: () => '1',
        getFilename: () => 'file.csv',
        getMimeType: () => 'text/csv',
        getURL: () => 'http://localhost:1234/file.csv',
        once: vi.fn(callsCallbackWith({}, 'completed')),
      }

      win.webContents.session.on.mockImplementation((event, callback) => {
        if (event === 'will-download') {
          callback({}, downloadItem)
        }
      })

      options.downloadsFolder = 'downloads'
      vi.spyOn(automation, 'push').mockImplementation(() => undefined)

      return electron._launch(win, url, automation, options, undefined, undefined, { attachCDPClient: vi.fn() })
      .then(() => {
        expectCalledWith(automation.push, 'complete:download', {
          id: '1',
        })
      })
    })

    it('pushes canceled:download when download is incomplete', () => {
      const downloadItem = {
        getETag: () => '1',
        getFilename: () => 'file.csv',
        getMimeType: () => 'text/csv',
        getURL: () => 'http://localhost:1234/file.csv',
        once: vi.fn(callsCallbackWith({}, 'canceled')),
      }

      win.webContents.session.on.mockImplementation((event, callback) => {
        if (event === 'will-download') {
          callback({}, downloadItem)
        }
      })

      options.downloadsFolder = 'downloads'
      vi.spyOn(automation, 'push').mockImplementation(() => undefined)

      return electron._launch(win, url, automation, options, undefined, undefined, { attachCDPClient: vi.fn() })
      .then(() => {
        expectCalledWith(automation.push, 'canceled:download', {
          id: '1',
        })
      })
    })

    it('sets download behavior', () => {
      options.downloadsFolder = 'downloads'

      return electron._launch(win, url, automation, options, undefined, undefined, { attachCDPClient: vi.fn() })
      .then(() => {
        expectCalledWith(pageCriClient.send, 'Page.setDownloadBehavior', {
          behavior: 'allow',
          downloadPath: 'downloads',
        })
      })
    })

    it('handles download links via cdp', () => {
      return electron._launch(win, url, automation, options, undefined, undefined, { attachCDPClient: vi.fn() })
      .then(() => {
        expectCalledWith(utils.initializeCDP, pageCriClient, automation, false)
      })
    })

    it('expects the browser to be reset', () => {
      return electron._launch(win, url, automation, options, undefined, undefined, { attachCDPClient: vi.fn() })
      .then(() => {
        expectCalledWith(pageCriClient.send, 'Storage.clearDataForOrigin', { origin: '*', storageTypes: 'cookies,indexeddb,local_storage,shader_cache,service_workers,cache_storage,interest_groups,shared_storage' })
        expectCalledWith(pageCriClient.send, 'Network.clearBrowserCache')
      })
    })

    it('expects the video to be fully enabled if specified in the config', async () => {
      const mockWriteVideoFrame = vi.fn()
      const mockVideoApi = {
        useFfmpegVideoController: vi.fn().mockResolvedValue({
          writeVideoFrame: mockWriteVideoFrame,
        }),
      }

      await electron._launch(win, url, automation, options, mockVideoApi, undefined, { attachCDPClient: vi.fn() })

      expect(mockVideoApi.useFfmpegVideoController).toHaveBeenCalled()
      expectCalledWith(pageCriClient.on, 'Page.screencastFrame', expect.any(Function))
      expectCalledWith(pageCriClient.send, 'Page.startScreencast', screencastOpts())
    })

    it('starts the screencast but does not capture the frames if video is not enabled but the app is in run mode', async () => {
      options.isTextTerminal = true

      await electron._launch(win, url, automation, options, undefined, undefined, { attachCDPClient: vi.fn() })

      expectNotCalledWith(pageCriClient.on, 'Page.screencastFrame', expect.any(Function))
      expectCalledWith(pageCriClient.send, 'Page.startScreencast', {
        format: 'jpeg',
        everyNthFrame: 2 ** 31 - 1,
        quality: 0,
      })
    })

    it('does not start the screencast if video is not enabled and the app is not in run mode', async () => {
      await electron._launch(win, url, automation, options, undefined, undefined, { attachCDPClient: vi.fn() })

      expectNotCalledWith(pageCriClient.on, 'Page.screencastFrame', expect.any(Function))
      expectNotCalledWith(pageCriClient.send, 'Page.startScreencast', anyArg)
    })

    it('registers onRequest automation middleware and calls show when requesting to be focused', () => {
      vi.spyOn(automation, 'use')

      return electron._launch(win, url, automation, options, undefined, undefined, { attachCDPClient: vi.fn() })
      .then(() => {
        expect(automation.use).toHaveBeenCalled()
        expect(automation.use.mock.lastCall[0].onRequest).toBeTypeOf('function')

        automation.use.mock.lastCall[0].onRequest('focus:browser:window')

        expect(win.show).toHaveBeenCalled()
      })
    })

    it('registers onRequest automation middleware and calls destroy when requesting to close the browser tabs', () => {
      vi.spyOn(automation, 'use')

      return electron._launch(win, url, automation, options, undefined, undefined, { attachCDPClient: vi.fn() })
      .then(async () => {
        expect(automation.use).toHaveBeenCalled()
        expect(automation.use.mock.lastCall[0].onRequest).toBeTypeOf('function')

        await automation.use.mock.lastCall[0].onRequest('reset:browser:tabs:for:next:spec', { shouldKeepTabOpen: true })

        expect(win.destroy).toHaveBeenCalled()
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

        pageCriClient.send.mockImplementation((command) => Promise.resolve(command === 'Page.getFrameTree' ? frameTree : undefined))
      })

      it('sends Fetch.enable only for Document ResourceType', async () => {
        await electron._launch(win, url, automation, options, undefined, undefined, { attachCDPClient: vi.fn() })

        expectCalledWith(pageCriClient.send, 'Fetch.enable', {
          patterns: [{
            resourceType: 'Document',
          }],
        })
      })

      // Even if a launch asks for the browser-side path, Electron's own AUT
      // header injection stays on the MITM automation - it does not hand Fetch
      // ownership to the network runtime the way chrome.ts does. The flag
      // still reaches initializeCDP - electron.ts's initializeCDP call reads
      // it the same way chrome.ts does - so in a real launch the window
      // bootstrap script would be included; this test pins the argument
      // reaching it (initializeCDP itself is stubbed in this suite, so no
      // script is actually assembled here).
      it('keeps Fetch ownership when the browser-side network path is requested', async () => {
        const onPageCriClientReady = vi.fn().mockResolvedValue(undefined)

        await electron._launch(win, url, automation, {
          ...options,
          useBrowserNetworkInterception: true,
          onPageCriClientReady,
        }, undefined, undefined, { attachCDPClient: vi.fn() })

        expect(onPageCriClientReady).not.toHaveBeenCalled()

        expectCalledWith(pageCriClient.send, 'Fetch.enable', {
          patterns: [{
            resourceType: 'Document',
          }],
        })

        expectCalledWith(utils.initializeCDP, pageCriClient, automation, true)
      })

      it('does not add header when not a document', async () => {
        await electron._launch(win, url, automation, options, undefined, undefined, { attachCDPClient: vi.fn() })

        yieldTo(pageCriClient.on, 'Fetch.requestPaused')({
          requestId: '1234',
          resourceType: 'Script',
        })

        expectNotCalledWith(pageCriClient.send, 'Fetch.continueRequest')
      })

      it('does not add header when it is a spec frame request', async () => {
        await electron._launch(win, url, automation, options, undefined, undefined, { attachCDPClient: vi.fn() })

        yieldTo(pageCriClient.on, 'Page.frameAttached')()

        await callsWith(pageCriClient.on, 'Fetch.requestPaused')[0][1]({
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
        await electron._launch(win, url, automation, options, undefined, undefined, { attachCDPClient: vi.fn() })

        yieldTo(pageCriClient.on, 'Page.frameAttached')()

        await callsWith(pageCriClient.on, 'Fetch.requestPaused')[0][1]({
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
        await electron._launch(win, url, automation, options, undefined, undefined, { attachCDPClient: vi.fn() })

        yieldTo(pageCriClient.on, 'Page.frameAttached')()

        expectCalledWith(pageCriClient.send, 'Page.getFrameTree')
      })

      it('gets frame tree on Page.frameDetached', async () => {
        await electron._launch(win, url, automation, options, undefined, undefined, { attachCDPClient: vi.fn() })

        yieldTo(pageCriClient.on, 'Page.frameDetached')()

        expectCalledWith(pageCriClient.send, 'Page.getFrameTree')
      })

      it('connects the protocol manager to the browser', async () => {
        const mockCurrentlyAttachedProtocolTarget = {}

        pageCriClient.clone.mockResolvedValue(mockCurrentlyAttachedProtocolTarget)

        await electron._launch(win, url, automation, options, undefined, protocolManager, { attachCDPClient: vi.fn() })

        expectCalledWith(protocolManager.connectToBrowser, mockCurrentlyAttachedProtocolTarget)
      })
    })
  })

  describe('setUserAgent with experimentalModifyObstructiveThirdPartyCode', () => {
    let userAgent

    beforeEach(() => {
      userAgent = ''
      win.webContents.session.getUserAgent.mockImplementation(() => userAgent)
    })

    describe('disabled', () => {
      it('does not attempt to replace the user agent', () => {
        options.experimentalModifyObstructiveThirdPartyCode = false

        return electron._launch(win, url, automation, options, undefined, undefined, { attachCDPClient: vi.fn() })
        .then(() => {
          expect(win.webContents.session.setUserAgent).not.toHaveBeenCalled()
          expectNotCalledWith(pageCriClient.send, 'Network.setUserAgentOverride', {
            userAgent,
          })
        })
      })
    })

    describe('enabled and attempts to replace obstructive user agent string containing:', () => {
      beforeEach(() => {
        options.experimentalModifyObstructiveThirdPartyCode = true
      })

      it('does not attempt to replace the user agent if the user passes in an explicit user agent', () => {
        userAgent = 'barbaz'
        options.experimentalModifyObstructiveThirdPartyCode = false
        options.userAgent = 'foobar'

        return electron._launch(win, url, automation, options, undefined, undefined, { attachCDPClient: vi.fn() })
        .then(() => {
          expectCalledWith(win.webContents.session.setUserAgent, 'foobar')
          expectNotCalledWith(win.webContents.session.setUserAgent, 'barbaz')
          expectCalledWith(pageCriClient.send, 'Network.setUserAgentOverride', {
            userAgent: 'foobar',
          })
        })
      })

      it('versioned cypress', () => {
        userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/10.0.3 Chrome/100.0.4896.75 Electron/18.0.4 Safari/537.36'

        return electron._launch(win, url, automation, options, undefined, undefined, { attachCDPClient: vi.fn() })
        .then(() => {
          const expectedUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36'

          expectCalledWith(win.webContents.session.setUserAgent, expectedUA)
          expectCalledWith(pageCriClient.send, 'Network.setUserAgentOverride', {
            userAgent: expectedUA,
          })
        })
      })

      it('development cypress', () => {
        userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/0.0.0-development Chrome/100.0.4896.75 Electron/18.0.4 Safari/537.36'

        return electron._launch(win, url, automation, options, undefined, undefined, { attachCDPClient: vi.fn() })
        .then(() => {
          const expectedUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36'

          expectCalledWith(win.webContents.session.setUserAgent, expectedUA)
          expectCalledWith(pageCriClient.send, 'Network.setUserAgentOverride', {
            userAgent: expectedUA,
          })
        })
      })

      it('older Windows user agent', () => {
        userAgent = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) electron/1.0.0 Chrome/53.0.2785.113 Electron/1.4.3 Safari/537.36'

        return electron._launch(win, url, automation, options, undefined, undefined, { attachCDPClient: vi.fn() })
        .then(() => {
          const expectedUA = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.113 Safari/537.36'

          expectCalledWith(win.webContents.session.setUserAgent, expectedUA)
          expectCalledWith(pageCriClient.send, 'Network.setUserAgentOverride', {
            userAgent: expectedUA,
          })
        })
      })

      it('newer Windows user agent', () => {
        userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Teams/1.5.00.4689 Chrome/85.0.4183.121 Electron/10.4.7 Safari/537.36'

        return electron._launch(win, url, automation, options, undefined, undefined, { attachCDPClient: vi.fn() })
        .then(() => {
          const expectedUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Teams/1.5.00.4689 Chrome/85.0.4183.121 Safari/537.36'

          expectCalledWith(win.webContents.session.setUserAgent, expectedUA)
          expectCalledWith(pageCriClient.send, 'Network.setUserAgentOverride', {
            userAgent: expectedUA,
          })
        })
      })

      it('Linux user agent', () => {
        userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Typora/0.9.93 Chrome/83.0.4103.119 Electron/9.0.5 Safari/E7FBAF'

        return electron._launch(win, url, automation, options, undefined, undefined, { attachCDPClient: vi.fn() })
        .then(() => {
          const expectedUA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Typora/0.9.93 Chrome/83.0.4103.119 Safari/E7FBAF'

          expectCalledWith(win.webContents.session.setUserAgent, expectedUA)
          expectCalledWith(pageCriClient.send, 'Network.setUserAgentOverride', {
            userAgent: expectedUA,
          })
        })
      })

      it('older MacOS user agent', () => {
        // this user agent containing Cypress was actually a common UA found on a website for Electron purposes...
        userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/8.3.0 Chrome/91.0.4472.124 Electron/13.1.7 Safari/537.36'

        return electron._launch(win, url, automation, options, undefined, undefined, { attachCDPClient: vi.fn() })
        .then(() => {
          const expectedUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'

          expectCalledWith(win.webContents.session.setUserAgent, expectedUA)
          expectCalledWith(pageCriClient.send, 'Network.setUserAgentOverride', {
            userAgent: expectedUA,
          })
        })
      })

      it('newer MacOS user agent', () => {
        userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36'

        return electron._launch(win, url, automation, options, undefined, undefined, { attachCDPClient: vi.fn() })
        .then(() => {
          const expectedUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36'

          expectCalledWith(win.webContents.session.setUserAgent, expectedUA)
          expectCalledWith(pageCriClient.send, 'Network.setUserAgentOverride', {
            userAgent: expectedUA,
          })
        })
      })
    })
  })

  describe('._render', () => {
    let newWin: any
    let preferences: any

    beforeEach(() => {
      newWin = {
        maximize: vi.fn(),
        setSize: vi.fn(),
        show: vi.fn(),
        destroy: vi.fn(),
        webContents: win.webContents,
      }

      preferences = { ...options }

      vi.spyOn(menu, 'set').mockImplementation(() => undefined)
      vi.spyOn(electron, '_setProxy').mockResolvedValue(undefined)
      vi.spyOn(electron, '_launch').mockResolvedValue(undefined)

      vi.spyOn(Windows, 'create').mockReturnValue(newWin)
    })

    it('creates window instance and calls launch with window', () => {
      return electron._render(url, automation, preferences, options)
      .then(() => {
        expectCalledWith(Windows.create, options.projectRoot, options)
        expect(newWin.setSize).not.toHaveBeenCalled()
        expectCalledWith(electron._launch, newWin, url, automation, preferences)
      })
    })

    it('calls setSize on electron window if headless', () => {
      const headlessPreferences = { ...preferences, browser: { isHeadless: true }, width: 100, height: 200 }

      return electron._render(url, automation, headlessPreferences, options)
      .then(() => {
        expect(newWin.maximize).not.toHaveBeenCalled()
        expectCalledWith(newWin.setSize, 100, 200)
      })
    })

    it('maximizes electron window if headed and not interactive', () => {
      options.isTextTerminal = true

      return electron._render(url, automation, preferences, options)
      .then(() => {
        expect(newWin.maximize).toHaveBeenCalled()
      })
    })

    it('does not maximize electron window if interactive', () => {
      options.isTextTerminal = false

      return electron._render(url, automation, preferences, options)
      .then(() => {
        expect(newWin.maximize).not.toHaveBeenCalled()
      })
    })
  })

  describe('._defaultOptions', () => {
    beforeEach(() => {
      vi.spyOn(menu, 'set').mockImplementation(() => undefined)
    })

    it('uses default width if there isn\'t one saved', () => {
      // @ts-expect-error
      const opts = electron._defaultOptions('/foo', state, options)

      expect(opts.width).toBe(1280)
    })

    it('uses saved width if there is one', () => {
      // @ts-expect-error
      const opts = electron._defaultOptions('/foo', { browserWidth: 1024 }, options)

      expect(opts.width).toBe(1024)
    })

    it('uses default height if there isn\'t one saved', () => {
      // @ts-expect-error
      const opts = electron._defaultOptions('/foo', state, options)

      expect(opts.height).toBe(720)
    })

    it('uses saved height if there is one', () => {
      // @ts-expect-error
      const opts = electron._defaultOptions('/foo', { browserHeight: 768 }, options)

      expect(opts.height).toBe(768)
    })

    it('uses saved x if there is one', () => {
      // @ts-expect-error
      const opts = electron._defaultOptions('/foo', { browserX: 200 }, options)

      expect(opts.x).toBe(200)
    })

    it('uses saved y if there is one', () => {
      // @ts-expect-error
      const opts = electron._defaultOptions('/foo', { browserY: 300 }, options)

      expect(opts.y).toBe(300)
    })

    it('tracks browser state', () => {
      // @ts-expect-error
      const opts = electron._defaultOptions('/foo', { browserY: 300 }, options)

      const args = _.pick(opts.trackState, 'width', 'height', 'x', 'y', 'devTools')

      expect(args).toStrictEqual({
        width: 'browserWidth',
        height: 'browserHeight',
        x: 'browserX',
        y: 'browserY',
        devTools: 'isBrowserDevToolsOpen',
      })
    })

    it('.onFocus', () => {
      const headlessOpts = electron._defaultOptions('/foo', state, { browser: { isHeadless: false } }, undefined, undefined, { attachCDPClient: vi.fn() })

      headlessOpts.onFocus()
      expectCalledWith(menu.set, { withInternalDevTools: true })

      vi.mocked(menu.set).mockClear()

      const headedOpts = electron._defaultOptions('/foo', state, { browser: { isHeadless: true } }, undefined, undefined, { attachCDPClient: vi.fn() })

      headedOpts.onFocus()

      expect(menu.set).not.toHaveBeenCalled()
    })

    describe('.onNewWindow', () => {
      beforeEach(() => {
        vi.spyOn(electron, '_launchChild').mockResolvedValue(win)
      })

      it('passes along url, parent window and options', () => {
        const opts = electron._defaultOptions(options.projectRoot, state, options, automation)

        const parentWindow = {
          on: vi.fn(),
        }

        opts.onNewWindow.call(parentWindow, { url: url })

        expectCalledWith(electron._launchChild, url, parentWindow, options.projectRoot, state, options, automation)
      })

      it('adds pid of new BrowserWindow to allPids list', async () => {
        // shortcut to set the browserCriClient singleton variable
        // @ts-expect-error
        await electron._getAutomation({}, { onError: () => {} }, {})

        // @ts-expect-error
        const opts = electron._defaultOptions(options.projectRoot, state, options)

        const NEW_WINDOW_PID = ELECTRON_PID * 2

        const child = _.cloneDeep(win)

        child.webContents.getOSProcessId = vi.fn().mockReturnValue(NEW_WINDOW_PID)

        vi.mocked(electron._launchChild).mockResolvedValue(child)

        return stubForOpen()
        .then(() => {
          // @ts-expect-error
          return electron.open('electron', url, opts, automation)
        }).then((instance) => {
          return opts.onNewWindow.call(win, {}, url)
          .then(() => {
            expect(instance.allPids).toStrictEqual([ELECTRON_PID, NEW_WINDOW_PID])
          })
        })
      })
    })
  })

  // TODO: these all need to be updated
  describe.skip('._launchChild', () => {
    let childWin: any
    let event: any
    let openNewWindow: (options?: any) => Promise<unknown>
    let grandchildWin: any

    const resolveCreateOnCall = (index: number, value: unknown) => {
      const previous = vi.mocked(Windows.create).getMockImplementation()

      vi.mocked(Windows.create).mockImplementation((...args) => {
        return (vi.mocked(Windows.create).mock.calls.length - 1 === index ? Promise.resolve(value) : previous?.(...args)) as any
      })
    }

    beforeEach(() => {
      childWin = _.extend(new EE(), {
        close: vi.fn(),
        isDestroyed: vi.fn().mockReturnValue(false),
        webContents: new EE(),
      })

      resolveCreateOnCall(1, childWin)

      event = { preventDefault: vi.fn() }
      win.getPosition = () => {
        return [4, 2]
      }

      openNewWindow = (options) => {
        // @ts-expect-error
        return launcher.launch('electron', url, options).then(() => {
          return win.webContents.emit('new-window', event, 'some://other.url')
        })
      }
    })

    it('prevents default', () => {
      return openNewWindow().then(() => {
        expect(event.preventDefault).toHaveBeenCalled()
      })
    })

    it('creates child window', () => {
      return openNewWindow().then(() => {
        // @ts-expect-error
        const args = Windows.create.mock.lastCall[0]

        expect(Windows.create).toHaveBeenCalledTimes(2)
        expect(args.url).toBe('some://other.url')
        expect(args.minWidth).toBe(100)

        expect(args.minHeight).toBe(100)
      })
    })

    it('offsets it from parent by 100px', () => {
      return openNewWindow().then(() => {
        // @ts-expect-error
        const args = Windows.create.mock.lastCall[0]

        expect(args.x).toBe(104)

        expect(args.y).toBe(102)
      })
    })

    it('passes along web security', () => {
      return openNewWindow({ chromeWebSecurity: false }).then(() => {
        // @ts-expect-error
        const args = Windows.create.mock.lastCall[0]

        expect(args.chromeWebSecurity).toBe(false)
      })
    })

    it('sets unique PROJECT type on each new window', () => {
      return openNewWindow().then(() => {
        // @ts-expect-error
        const firstArgs = Windows.create.mock.lastCall[0]

        expect(firstArgs.type).toMatch(/^PROJECT-CHILD-\d/)
        win.webContents.emit('new-window', event, 'yet://another.url')
        // @ts-expect-error
        const secondArgs = Windows.create.mock.lastCall[0]

        expect(secondArgs.type).toMatch(/^PROJECT-CHILD-\d/)

        expect(firstArgs.type).not.toBe(secondArgs.type)
      })
    })

    it('set newGuest on child window', () => {
      return openNewWindow()
      .then(() => {
        return new Promise((resolve) => setTimeout(resolve, 1))
      }).then(() => {
        expect(event.newGuest).toBe(childWin)
      })
    })

    it('sets menu with dev tools on creation', () => {
      return openNewWindow().then(() => {
        // once for main window, once for child
        expect(menu.set).toHaveBeenCalledTimes(2)

        expectCalledWith(menu.set, { withInternalDevTools: true })
      })
    })

    it('sets menu with dev tools on focus', () => {
      return openNewWindow().then(() => {
        // @ts-expect-error
        Windows.create.mock.lastCall[0].onFocus()
        // once for main window, once for child, once for focus
        expect(menu.set).toHaveBeenCalledTimes(3)

        expectCalledWith(menu.set, { withInternalDevTools: true })
      })
    })

    it('it closes the child window when the parent window is closed', () => {
      return openNewWindow()
      .then(() => {
        return new Promise((resolve) => setTimeout(resolve, 1))
      }).then(() => {
        win.emit('close')

        expect(childWin.close).toHaveBeenCalled()
      })
    })

    it('does not close the child window when it is already destroyed', () => {
      return openNewWindow()
      .then(() => {
        return new Promise((resolve) => setTimeout(resolve, 1))
      }).then(() => {
        childWin.isDestroyed.mockReturnValue(true)
        win.emit('close')

        expect(childWin.close).not.toHaveBeenCalled()
      })
    })

    it('does the same things for children of the child window', () => {
      grandchildWin = _.extend(new EE(), {
        close: vi.fn(),
        isDestroyed: vi.fn().mockReturnValue(false),
        webContents: new EE(),
      })

      resolveCreateOnCall(2, grandchildWin)
      childWin.getPosition = () => {
        return [104, 102]
      }

      return openNewWindow().then(() => {
        childWin.webContents.emit('new-window', event, 'yet://another.url')
        // @ts-expect-error
        const args = Windows.create.mock.lastCall[0]

        expect(Windows.create).toHaveBeenCalledTimes(3)
        expect(args.url).toBe('yet://another.url')
        expect(args.type).toMatch(/^PROJECT-CHILD-\d/)
        expect(args.x).toBe(204)

        expect(args.y).toBe(202)
      })
    })
  })

  describe('._setProxy', () => {
    it('sets proxy rules for webContents', () => {
      const webContents = {
        session: {
          setProxy: vi.fn().mockResolvedValue(undefined),
        },
      }

      return electron._setProxy(webContents, 'proxy rules')
      .then(() => {
        expectCalledWith(webContents.session.setProxy, {
          proxyRules: 'proxy rules',
        })
      })
    })

    it('sets configured proxy bypass rules for webContents', () => {
      const webContents = {
        session: {
          setProxy: vi.fn().mockResolvedValue(undefined),
        },
      }

      return electron._setProxy(webContents, 'proxy rules', 'localhost,example.com')
      .then(() => {
        expectCalledWith(webContents.session.setProxy, {
          proxyRules: 'proxy rules',
          proxyBypassRules: 'localhost,example.com',
        })
      })
    })
  })
})
