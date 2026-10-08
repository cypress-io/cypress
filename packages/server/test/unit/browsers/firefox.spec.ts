import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock, MockInstance } from 'vitest'
import { createRequire } from 'module'
import debug from 'debug'
import os from 'os'
import path from 'path'
import fsExtra from 'fs-extra'
import mockfs from 'mock-fs'
import FirefoxProfile from 'firefox-profile'
import type WebDriverPackage from 'webdriver'
import type { Client as WebDriverClient } from 'webdriver'
import { EventEmitter } from 'stream'
import * as firefox from '../../../lib/browsers/firefox'
import * as extension from '@packages/extension'
import { BidiAutomation } from '../../../lib/browsers/bidi_automation'
import utils from '../../../lib/browsers/utils'
import * as plugins from '../../../lib/plugins'
import * as specUtil from '../../specUtils'

// The SUT loads webdriver through a runtime require of its CJS build, which is a
// different module instance than the ESM build an `import` here would resolve to
const requireCjs = createRequire(__filename)
const webdriver: typeof WebDriverPackage = requireCjs(requireCjs.resolve('webdriver', { paths: [path.join(__dirname, '../../../lib/browsers/webdriver')] }))

const isMatch = (actual: unknown, expected: unknown) => {
  try {
    expect(actual).toStrictEqual(expected)

    return true
  } catch {
    return false
  }
}

const callsMatching = (mock: MockInstance, expected: unknown[]) => {
  return mock.mock.calls.filter((call) => isMatch(call.slice(0, expected.length), expected))
}

// unlike toHaveBeenCalledWith, matches on leading arguments and ignores any extra ones
const expectCalledWith = (mock: MockInstance, ...expected: unknown[]) => {
  expect(callsMatching(mock, expected), `calls matching ${String(expected[0])}`).not.toHaveLength(0)
}

const expectNotCalledWith = (mock: MockInstance, ...expected: unknown[]) => {
  expect(callsMatching(mock, expected), `calls matching ${String(expected[0])}`).toHaveLength(0)
}

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return !!value && Object.getPrototypeOf(value) === Object.prototype
}

const matchesSubset = (actual: any, expected: Record<string, unknown>): boolean => {
  if (actual === null || actual === undefined) {
    return false
  }

  return Object.entries(expected).every(([key, value]) => {
    return isPlainObject(value) ? matchesSubset(actual[key], value) : isMatch(actual[key], value)
  })
}

// recursive partial match on plain objects; an expected `undefined` also matches an absent key
const matchSubset = (expected: Record<string, unknown>) => {
  return {
    asymmetricMatch: (actual: unknown) => matchesSubset(actual, expected),
    toString: () => 'MatchSubset',
    toAsymmetricMatcher: () => `MatchSubset<${JSON.stringify(expected)}>`,
  }
}

const createStubInstance = <T extends object>(Cls: { prototype: T }): T => {
  const instance = Object.create(Cls.prototype)

  for (const key of Object.getOwnPropertyNames(Cls.prototype)) {
    const descriptor = Object.getOwnPropertyDescriptor(Cls.prototype, key)

    if (key !== 'constructor' && typeof descriptor?.value === 'function') {
      instance[key] = vi.fn()
    }
  }

  return instance
}

describe('lib/browsers/firefox', () => {
  const mockContextId = '1234-5678'
  let wdInstance: Record<string, any>
  let bidiAutomationClient: BidiAutomation

  beforeEach(() => {
    vi.spyOn(utils, 'getProfileDir').mockReturnValue('/path/to/appData/firefox-stable/interactive')

    wdInstance = {
      maximizeWindow: vi.fn().mockResolvedValue(undefined),
      installAddOn: vi.fn().mockResolvedValue(undefined),
      getWindowHandles: vi.fn(),
      switchToWindow: vi.fn().mockResolvedValue(undefined),
      navigateTo: vi.fn().mockResolvedValue(undefined),
      sessionSubscribe: vi.fn().mockResolvedValue(undefined),
      browsingContextGetTree: vi.fn().mockResolvedValue({
        contexts: [{
          context: mockContextId,
          children: null,
          url: '',
          userContext: mockContextId,
          parent: null,
        }],
      }),
      browsingContextNavigate: vi.fn().mockResolvedValue(undefined),
      capabilities: {
        'moz:processID': 1234,
        'wdio:driverPID': 5678,
      },
      on: vi.fn(),
      off: vi.fn(),
    }

    vi.spyOn(webdriver, 'newSession').mockResolvedValue(wdInstance as WebDriverClient)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  afterAll(() => {
    mockfs.restore()
  })

  describe('#open', () => {
    const pidDescriptor = Object.getOwnPropertyDescriptor(process, 'pid')!

    let browser: Record<string, any>
    let automation: { use: Mock }
    let options: Record<string, any>

    beforeEach(() => {
      // majorVersion >= 135 indicates BiDi support for Firefox
      browser = { name: 'firefox', family: 'firefox', channel: 'stable', majorVersion: 135, path: '/path/to/binary' }
      automation = {
        use: vi.fn(() => ({})),
      }

      options = {
        proxyUrl: 'http://proxy-url',
        socketIoRoute: 'socket/io/route',
        browser,
      }

      Object.defineProperty(process, 'pid', { ...pidDescriptor, value: 1111 })

      vi.spyOn(plugins, 'has').mockImplementation(() => undefined as any)
      vi.spyOn(plugins, 'execute').mockImplementation(() => undefined as any)
      vi.spyOn(utils, 'writeExtension').mockResolvedValue('/path/to/ext')
      vi.spyOn(utils, 'getPort').mockResolvedValue(1234)
      vi.spyOn(FirefoxProfile.prototype, 'setPreference')
      vi.spyOn(FirefoxProfile.prototype, 'shouldDeleteOnExit')
      vi.spyOn(FirefoxProfile.prototype, 'path')
      vi.spyOn(FirefoxProfile.prototype, 'encoded').mockImplementation((cb: Function) => {
        cb(undefined, 'abcdef')
      })

      vi.spyOn(fsExtra, 'writeJSON').mockResolvedValue(undefined)
      vi.spyOn(fsExtra, 'writeFile').mockReturnValue(undefined as any)

      bidiAutomationClient = createStubInstance(BidiAutomation)
      bidiAutomationClient.setTopLevelContextId = vi.fn(() => undefined)

      vi.spyOn(BidiAutomation, 'create').mockReturnValue(bidiAutomationClient)
    })

    afterEach(() => {
      Object.defineProperty(process, 'pid', pidDescriptor)
    })

    describe('#connectToNewSpecBiDi', () => {
      beforeEach(() => {
        options.onError = () => {}
        options.onInitializeNewBrowserTab = vi.fn()
      })

      it('BiDi: calls connectToNewSpecBiDi in firefoxUtil', async () => {
        await firefox.open(browser as any, 'http://', options as any, automation as any)

        options.url = 'next-spec-url'
        await firefox.connectToNewSpec(browser as any, options as any, automation as any)

        expect(options.onInitializeNewBrowserTab).toHaveBeenCalled()
        expectCalledWith(wdInstance.browsingContextGetTree, {})
        expectCalledWith(bidiAutomationClient.setTopLevelContextId as Mock, mockContextId)

        // Only happens one time when navigating to the spec since the context gets created on about:blank, which is tested in BidiAutomation
        expectCalledWith(wdInstance.browsingContextNavigate, {
          context: mockContextId,
          url: 'next-spec-url',
        })

        expectCalledWith(automation.use, bidiAutomationClient.automationMiddleware)
      })

      it('re-establishes video recording for the new spec when a videoApi is provided', async () => {
        const writeVideoFrame = vi.fn()
        const videoApi = {
          useFfmpegVideoController: vi.fn().mockResolvedValue({ writeVideoFrame, endVideoCapture: vi.fn().mockResolvedValue(undefined) }),
          onProjectCaptureVideoFrames: vi.fn(),
        }

        options.videoApi = videoApi

        await firefox.open(browser as any, 'http://', options as any, automation as any)

        // reset call history so we only assert on what connectToNewSpec does (open() also
        // records video and navigates)
        videoApi.useFfmpegVideoController.mockClear()
        videoApi.onProjectCaptureVideoFrames.mockClear()
        wdInstance.browsingContextNavigate.mockClear()

        options.url = 'next-spec-url'
        await firefox.connectToNewSpec(browser as any, options as any, automation as any)

        // the browser is reused across specs, so the per-spec video controller must be
        // re-created or compression fails with a missing controller.
        // @see https://github.com/cypress-io/cypress/issues/18415
        expectCalledWith(videoApi.useFfmpegVideoController, { webmInput: true })
        expectCalledWith(videoApi.onProjectCaptureVideoFrames, writeVideoFrame)

        const controllerOrder = videoApi.useFfmpegVideoController.mock.invocationCallOrder
        const navigateOrder = wdInstance.browsingContextNavigate.mock.invocationCallOrder
        const captureOrder = videoApi.onProjectCaptureVideoFrames.mock.invocationCallOrder

        // the ffmpeg controller must be created *before* navigation so the per-spec videoRecording
        // object has its controller set in time for compression — a fast spec could otherwise
        // finish before the async controller is ready.
        expect(controllerOrder.length).toBeGreaterThan(0)
        expect(navigateOrder.length).toBeGreaterThan(0)
        expect(controllerOrder[0]).toBeLessThan(navigateOrder[navigateOrder.length - 1])

        // but frame capture must only begin *after* navigation unloads the previous page, otherwise
        // trailing frames from the finished spec's MediaRecorder bleed into the new spec's video.
        expect(captureOrder.length).toBeGreaterThan(0)
        expect(captureOrder[captureOrder.length - 1]).toBeGreaterThan(navigateOrder[0])
      })

      it('tears down the video controller and does not capture frames if BiDi setup fails', async () => {
        const endVideoCapture = vi.fn().mockResolvedValue(undefined)
        const videoApi = {
          useFfmpegVideoController: vi.fn().mockResolvedValue({ writeVideoFrame: vi.fn(), endVideoCapture }),
          onProjectCaptureVideoFrames: vi.fn(),
        }

        options.videoApi = videoApi

        await firefox.open(browser as any, 'http://', options as any, automation as any)

        // open() also records video; only assert on what connectToNewSpec does
        videoApi.onProjectCaptureVideoFrames.mockClear()

        // fail navigation/BiDi setup for the next spec
        wdInstance.browsingContextNavigate.mockRejectedValue(new Error('navigation failed'))

        options.url = 'next-spec-url'

        await expect(firefox.connectToNewSpec(browser as any, options as any, automation as any)).rejects.toThrow('navigation failed')

        // the ffmpeg encoder we started must be torn down so it isn't left orphaned
        expectCalledWith(endVideoCapture, false)
        // and we must never subscribe to frames for a spec that failed to start
        expect(videoApi.onProjectCaptureVideoFrames).not.toHaveBeenCalled()
      })
    })

    it('executes before:browser:launch if registered', async () => {
      vi.mocked(plugins.has).mockImplementation((event) => event === 'before:browser:launch' ? true : undefined as any)
      vi.mocked(plugins.execute).mockResolvedValue(null)

      await firefox.open(browser as any, 'http://', options as any, automation as any)
      expectCalledWith(vi.mocked(plugins.execute), 'before:browser:launch')
    })

    it('does not execute before:browser:launch if not registered', async () => {
      vi.mocked(plugins.has).mockImplementation((event) => event === 'before:browser:launch' ? false : undefined as any)

      await firefox.open(browser as any, 'http://', options as any, automation as any)

      expectNotCalledWith(vi.mocked(plugins.execute), 'before:browser:launch')
    })

    it('uses default preferences if before:browser:launch returns falsy value', async () => {
      vi.mocked(plugins.has).mockImplementation((event) => event === 'before:browser:launch' ? true : undefined as any)
      vi.mocked(plugins.execute).mockResolvedValue(null)

      await firefox.open(browser as any, 'http://', options as any, automation as any)

      expectCalledWith(vi.mocked(webdriver.newSession), matchSubset({
        capabilities: {
          alwaysMatch: {
            'moz:firefoxOptions': {
              prefs: {
                'network.proxy.type': 1,
              },
            },
          },
          firstMatch: [],
        },
      }))
    })

    it('uses default preferences if before:browser:launch returns object with non-object preferences', async () => {
      vi.mocked(plugins.has).mockImplementation((event) => event === 'before:browser:launch' ? true : undefined as any)
      vi.mocked(plugins.execute).mockResolvedValue({
        preferences: [],
      })

      await firefox.open(browser as any, 'http://', options as any, automation as any)

      expectCalledWith(vi.mocked(webdriver.newSession), matchSubset({
        capabilities: {
          alwaysMatch: {
            'moz:firefoxOptions': {
              prefs: {
                'network.proxy.type': 1,
              },
            },
          },
          firstMatch: [],
        },
      }))
    })

    it('sets preferences if returned by before:browser:launch', async () => {
      vi.mocked(plugins.has).mockImplementation((event) => event === 'before:browser:launch' ? true : undefined as any)
      vi.mocked(plugins.execute).mockResolvedValue({
        preferences: { 'foo': 'bar' },
      })

      await firefox.open(browser as any, 'http://', options as any, automation as any)

      expectCalledWith(vi.mocked(webdriver.newSession), matchSubset({
        capabilities: {
          alwaysMatch: {
            'moz:firefoxOptions': {
              prefs: {
                'foo': 'bar',
              },
            },
          },
          firstMatch: [],
        },
      }))
    })

    describe(`webdriver capabilities`, () => {
      const getExpectedCapabilities = ({
        isDebugEnabled,
      }: {
        isDebugEnabled?: boolean
      } = {
        isDebugEnabled: false,
      }) => {
        return {
          logLevel: isDebugEnabled ? 'info' : 'silent',
          capabilities: matchSubset({
            alwaysMatch: {
              browserName: 'firefox',
              webSocketUrl: true,
              acceptInsecureCerts: true,
              // @see https://developer.mozilla.org/en-US/docs/Web/WebDriver/Capabilities/firefoxOptions
              'moz:firefoxOptions': {
                binary: '/path/to/binary',
                args: [
                  '-new-instance',
                  '-start-debugger-server',
                  '-no-remote',
                  ...(os.platform() !== 'linux' ? ['-foreground'] : []),
                ],
                // only partially match the preferences object because it is so large
                prefs: {
                  'remote.active-protocols': 1,
                  'remote.enabled': true,
                },
              },
              'wdio:geckodriverOptions': {
                host: '127.0.0.1',
                marionetteHost: '127.0.0.1',
                marionettePort: expect.any(Number),
                websocketPort: expect.any(Number),
                profileRoot: '/path/to/appData/firefox-stable/interactive',
                binaryPath: undefined,
                spawnOpts: {
                  stdio: ['ignore', 'pipe', 'pipe'],
                  env: {
                    MOZ_REMOTE_SETTINGS_DEVTOOLS: '1',
                    MOZ_HEADLESS_WIDTH: '1280',
                    MOZ_HEADLESS_HEIGHT: '720',
                  },
                },
                jsdebugger: !!isDebugEnabled,
                log: isDebugEnabled ? 'debug' : 'error',
                logNoTruncate: !!isDebugEnabled,
              },
            },
            firstMatch: [],
          }),
        }
      }

      it('creates the WebDriver session and geckodriver instance through capabilities and installs the extension', async () => {
        browser.family = 'firefox'
        browser.majorVersion = '135'
        await firefox.open(browser as any, 'http://', options as any, automation as any)
        expectCalledWith(vi.mocked(webdriver.newSession), (getExpectedCapabilities()))

        expectCalledWith(wdInstance.installAddOn, '/path/to/ext', true)

        expectCalledWith(wdInstance.sessionSubscribe, { events: [
          'network.beforeRequestSent',
          'network.responseStarted',
          'network.responseCompleted',
          'network.fetchError',
          'browsingContext.contextCreated',
          'browsingContext.contextDestroyed',
        ] })

        expectCalledWith(wdInstance.browsingContextGetTree, {})

        expectCalledWith(wdInstance.browsingContextNavigate, {
          context: mockContextId,
          url: 'http://',
        })

        // make sure Bidi gets created
        expectCalledWith(vi.mocked(BidiAutomation.create), wdInstance, automation)
        expectCalledWith(automation.use, bidiAutomationClient.automationMiddleware)
        expectCalledWith(bidiAutomationClient.setTopLevelContextId as Mock, mockContextId)
      })

      afterEach(() => {
        debug.disable()
      })

      it('debugging: sets additional arguments if "DEBUG=cypress-verbose:server:browsers:geckodriver" and "DEBUG=cypress-verbose:server:browsers:webdriver" is set', async () => {
        browser.family = 'firefox'
        browser.majorVersion = '135'
        debug.enable('cypress-verbose:server:browsers:geckodriver,cypress-verbose:server:browsers:webdriver')

        await firefox.open(browser as any, 'http://', options as any, automation as any)

        expectCalledWith(vi.mocked(webdriver.newSession), (getExpectedCapabilities({ isDebugEnabled: true })))
      })
    })

    it('does not maximize the browser if headless', async () => {
      browser.isHeadless = true

      await firefox.open(browser as any, 'http://', options as any, automation as any)
      expect(wdInstance.maximizeWindow).not.toHaveBeenCalled()
    })

    it('sets user-agent preference if specified', async () => {
      options.userAgent = 'User Agent'

      await firefox.open(browser as any, 'http://', options as any, automation as any)

      expectCalledWith(vi.mocked(webdriver.newSession), matchSubset({
        capabilities: {
          alwaysMatch: {
            'moz:firefoxOptions': {
              prefs: {
                'general.useragent.override': 'User Agent',
              },
            },
          },
          firstMatch: [],
        },
      }))
    })

    it('writes extension', async () => {
      await firefox.open(browser as any, 'http://', options as any, automation as any)
      expectCalledWith(vi.mocked(utils.writeExtension), options.browser, options.isTextTerminal, options.proxyUrl, options.socketIoRoute)
    })

    it('writes extension and ensure write access', async () => {
      mockfs({
        [path.resolve(`${__dirname }../../../../../extension/app-dist/v2`)]: {
          'background.js': mockfs.file({
            mode: 0o444,
          }),
        },
        [`${process.env.HOME }/.config/Cypress/cy/test/browsers/firefox-stable/interactive/CypressExtension`]: {
          'background.js': mockfs.file({
            content: 'abcn',
            mode: 0o444,
          }),
        },
        [path.resolve(`${__dirname }/../../extension`)]: { 'abc': 'test' },
        '/path/to/appData/firefox-stable/interactive': {
          'chrome': { 'userChrome.css': '[foo userChrome.css]' },
        },
      })

      vi.mocked(utils.writeExtension).mockRestore()
      vi.mocked(fsExtra.writeFile).mockRestore()
      vi.spyOn(fsExtra, 'chmod')

      // bypass the extension clearing that happens in open mode, which is tested at the system test level
      options.isTextTerminal = true

      await firefox.open(browser as any, 'http://', options as any, automation as any)

      expectCalledWith(vi.mocked(fsExtra.chmod), expect.stringMatching(/CypressExtension\/background\.js/), 0o644)
    })

    it('sets proxy-related preferences if specified', async () => {
      options.proxyServer = 'http://proxy-server:1234'

      await firefox.open(browser as any, 'http://', options as any, automation as any)

      expectCalledWith(vi.mocked(webdriver.newSession), matchSubset({
        capabilities: {
          alwaysMatch: {
            'moz:firefoxOptions': {
              prefs: {
                'network.proxy.http': 'proxy-server',
                'network.proxy.ssl': 'proxy-server',
                'network.proxy.http_port': 1234,
                'network.proxy.ssl_port': 1234,
                'network.proxy.no_proxies_on': '',
              },
            },
          },
          firstMatch: [],
        },
      }))
    })

    it('does not set proxy-related preferences if not specified', async () => {
      await firefox.open(browser as any, 'http://', options as any, automation as any)

      const setPreference = vi.mocked(FirefoxProfile.prototype.setPreference)

      expectNotCalledWith(setPreference, 'network.proxy.http', 'proxy-server')
      expectNotCalledWith(setPreference, 'network.proxy.https', 'proxy-server')
      expectNotCalledWith(setPreference, 'network.proxy.http_port', 1234)
      expectNotCalledWith(setPreference, 'network.proxy.https_port', 1234)

      expectNotCalledWith(setPreference, 'network.proxy.no_proxies_on')
    })

    it('tears down the temporary profile when the browser is destroyed', async () => {
      await firefox.open(browser as any, 'http://', options as any, automation as any)

      expectCalledWith(vi.mocked(FirefoxProfile.prototype.shouldDeleteOnExit), true)
    })

    // @see https://github.com/cypress-io/cypress/issues/17896
    it('escapes the downloadsFolders path correctly when running on Windows OS', async () => {
      options.proxyServer = 'http://proxy-server:1234'
      options.downloadsFolder = 'C:/Users/test/Downloads/My_Test_Downloads_Folder'
      vi.spyOn(os, 'platform').mockReturnValue('win32')
      const executeBeforeBrowserLaunchSpy = vi.spyOn(utils, 'executeBeforeBrowserLaunch')

      await firefox.open(browser as any, 'http://', options as any, automation as any)
      expectCalledWith(executeBeforeBrowserLaunchSpy, browser, matchSubset({
        preferences: {
          'browser.download.dir': 'C:\\\\Users\\\\test\\\\Downloads\\\\My_Test_Downloads_Folder',
        },
      }), options)
    })

    // @see https://github.com/cypress-io/cypress/issues/18217
    it('sets "testing_locationhost_is_secure_when_hijacked" to true to allow window.isSecureContext to be true', async () => {
      const executeBeforeBrowserLaunchSpy = vi.spyOn(utils, 'executeBeforeBrowserLaunch')

      options.proxyServer = 'http://proxy-server:1234'

      await firefox.open(browser as any, 'http://', options as any, automation as any)
      expectCalledWith(executeBeforeBrowserLaunchSpy, browser, matchSubset({
        preferences: {
          'network.proxy.testing_localhost_is_secure_when_hijacked': true,
        },
      }), options)
    })

    describe('sets "remote.active-protocols"', () => {
      // CDP was deprecated in Firefox 129 and up and was removed in Firefox 141.
      // @see https://fxdx.dev/deprecating-cdp-support-in-firefox-embracing-the-future-with-webdriver-bidi/
      // @see https://fxdx.dev/webdriver-bidi-becomes-the-default-for-cypress-in-firefox/
      // @see https://github.com/cypress-io/cypress/issues/29713
      it('=1 to enable only BiDi', async () => {
        const executeBeforeBrowserLaunchSpy = vi.spyOn(utils, 'executeBeforeBrowserLaunch')

        await firefox.open(browser as any, 'http://', options as any, automation as any)

        expectCalledWith(executeBeforeBrowserLaunchSpy, browser, matchSubset({
          preferences: {
            'remote.active-protocols': 1,
          },
        }), options)
      })
    })

    it('resolves the browser instance as an event emitter', async () => {
      const result = await firefox.open(browser as any, 'http://', options as any, automation as any)

      expect(result).toBeInstanceOf(EventEmitter)
      expect(result.kill).toBeInstanceOf(Function)
    })

    describe('profile/extension', () => {
      afterEach(() => {
        return mockfs.restore()
      })

      it('always clear user profile if it already exists', async () => {
        mockfs({
          '/path/to/appData/firefox-stable/interactive/': {
            'chrome': { 'userChrome.css': '[foo userChrome.css]' },
          },
        })

        await firefox.open(browser as any, 'http://', options as any, automation as any)

        expect(specUtil.getFsPath('/path/to/appData/firefox-stable/interactive')).toBeUndefined()
      })

      it('creates chrome/userChrome.css if not exist', async () => {
        await firefox.open(browser as any, 'http://', options as any, automation as any)

        expectCalledWith(vi.mocked(fsExtra.writeFile), '/path/to/appData/firefox-stable/interactive/chrome/userChrome.css')
      })

      it('clears browser cache', async () => {
        mockfs({
          '/path/to/appData/firefox-stable/interactive/': {
            'CypressCache': { 'foo': 'bar' },
          },
        })

        options.isTextTerminal = false

        await firefox.open(browser as any, 'http://', options as any, automation as any)
        expect(specUtil.getFsPath('/path/to/appData/firefox-stable/interactive')).toBeUndefined()
      })

      // when Cypress is installed in a read-only location (e.g. the Nix store), the
      // source extension is read-only and fs.copy preserves those permissions. The
      // copied extension must be made writable, otherwise rimraf cannot unlink the
      // files when cleaning up the profile on exit.
      // @see https://github.com/cypress-io/cypress/issues/31300
      it('grants write access to the copied extension so the profile can be cleaned up on exit', async () => {
        // the read-only source extension, as it would be installed in the Nix store
        const extensionSrc = extension.getPathToExtension()
        // getExtensionDir resolves the real (un-stubbed) destination the extension is copied to
        const extensionDir = utils.getExtensionDir(browser as any, true)

        mockfs({
          [extensionSrc]: mockfs.directory({
            mode: 0o555,
            items: {
              'background.js': mockfs.file({ content: 'CHANGE_ME_HOST CHANGE_ME_PATH', mode: 0o444 }),
            },
          }),
          '/path/to/appData/firefox-stable/interactive': {
            'chrome': { 'userChrome.css': '[foo userChrome.css]' },
          },
        })

        vi.mocked(utils.writeExtension).mockRestore()
        vi.mocked(fsExtra.writeFile).mockRestore()

        options.isTextTerminal = true

        await firefox.open(browser as any, 'http://', options as any, automation as any)

        // the owner write bit must be set on both the directory and its contents,
        // otherwise rimraf cannot unlink the files when removing the profile on exit
        expect((await fsExtra.stat(extensionDir)).mode & 0o200, 'extension directory is writable').toBe(0o200)
        expect((await fsExtra.stat(path.join(extensionDir, 'background.js'))).mode & 0o200, 'background.js is writable').toBe(0o200)
      })
    })

    it('does not execute after:browser:launch if not registered', async () => {
      vi.mocked(plugins.has).mockImplementation((event) => event === 'after:browser:launch' ? false : undefined as any)

      await firefox.open(browser as any, 'http://', options as any, automation as any)
      expectNotCalledWith(vi.mocked(plugins.execute), 'after:browser:launch')
    })

    describe('returns BrowserInstanceWrapper as EventEmitter', () => {
      it('from browsers.launch', async () => {
        const instance = await firefox.open(browser as any, 'http://', options as any, automation as any)

        expect(instance).toBeInstanceOf(EventEmitter)
      })

      it('kills the driver and browser PIDs when the kill method is called and emits the exit event', async () => {
        const kill = vi.spyOn(process, 'kill').mockReturnValue(true)
        const instance = await firefox.open(browser as any, 'http://', options as any, automation as any)

        const emit = vi.spyOn(instance, 'emit')
        const killResult = instance.kill()

        expect(killResult).toBe(true)
        // kills the browser
        expectCalledWith(kill, 1234)
        // kills the webdriver process/ geckodriver process
        expectCalledWith(kill, 5678)
        // makes sure the exit event is called to signal to the rest of cypress server that the processes are killed
        expectCalledWith(emit, 'exit')
      })

      it('swallows ESRCH in kill method if thrown', async () => {
        const ESRCHErr: Error & { code?: string } = new Error('BOOM')

        ESRCHErr.code = 'ESRCH'
        const kill = vi.spyOn(process, 'kill').mockImplementation(() => {
          throw ESRCHErr
        })

        const instance = await firefox.open(browser as any, 'http://', options as any, automation as any)

        const emit = vi.spyOn(instance, 'emit')
        const killResult = instance.kill()

        expect(killResult).toBe(true)
        // kills the browser
        expectCalledWith(kill, 1234)
        // kills the webdriver process/ geckodriver process
        expectCalledWith(kill, 5678)
        // makes sure the exit event is called to signal to the rest of cypress server that the processes are killed
        expectCalledWith(emit, 'exit')
      })
    })
  })

  describe('#connectProtocolToBrowser', () => {
    it('throws error', () => {
      expect(firefox.connectProtocolToBrowser).toThrow('Protocol is not yet supported in firefox.')
    })
  })
})
