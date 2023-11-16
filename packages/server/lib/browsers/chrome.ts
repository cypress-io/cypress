import Bluebird from 'bluebird'
import check from 'check-more-types'
import debugModule from 'debug'
import la from 'lazy-ass'
import _ from 'lodash'
import os from 'os'
import path from 'path'
import extension from '@packages/extension'
import mime from 'mime'
import { launch } from '@packages/launcher'

import appData from '../util/app_data'
import { fs } from '../util/fs'
import { CdpAutomation, screencastOpts } from './cdp_automation'
import * as protocol from './protocol'
import utils from './utils'
import * as errors from '../errors'
import { BrowserCriClient } from './browser-cri-client'
import type { Browser, BrowserInstance, GracefulShutdownOptions } from './types'
import type { CriClient } from './cri-client'
import type { Automation } from '../automation'
import memory from './memory'

import type { BrowserLaunchOpts, BrowserNewTabOpts, ProtocolManagerShape, RunModeVideoApi } from '@packages/types'
import type { CDPSocketServer } from '@packages/socket/lib/cdp-socket'

const debug = debugModule('cypress:server:browsers:chrome')

const LOAD_EXTENSION = '--load-extension='
const CHROME_VERSIONS_WITH_BUGGY_ROOT_LAYER_SCROLLING = '66 67'.split(' ')
const CHROME_VERSION_INTRODUCING_PROXY_BYPASS_ON_LOOPBACK = 72
const CHROME_VERSION_WITH_FPS_INCREASE = 89
const CHROME_VERSION_INTRODUCING_HEADLESS_NEW = 112

const CHROME_PREFERENCE_PATHS = {
  default: path.join('Default', 'Preferences'),
  defaultSecure: path.join('Default', 'Secure Preferences'),
  localState: 'Local State',
}

type ChromePreferences = {
  default: object
  defaultSecure: object
  localState: object
}

const pathToExtension = extension.getPathToV3Extension()
const pathToTheme = extension.getPathToTheme()

// Common Chrome Flags for Automation
// https://github.com/GoogleChrome/chrome-launcher/blob/master/docs/chrome-flags-for-tools.md
const DEFAULT_ARGS = [
  '--test-type',
  '--ignore-certificate-errors',
  '--start-maximized',
  '--silent-debugger-extension-api',
  '--no-default-browser-check',
  '--no-first-run',
  '--noerrdialogs',
  '--enable-fixed-layout',
  '--disable-popup-blocking',
  '--disable-password-generation',
  '--disable-single-click-autofill',
  '--disable-prompt-on-repos',
  '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding',
  '--disable-renderer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-restore-session-state',
  '--disable-new-profile-management',
  '--disable-new-avatar-menu',
  '--allow-insecure-localhost',
  '--reduce-security-for-testing',
  '--enable-automation',
  '--disable-print-preview',
  '--disable-component-extensions-with-background-pages',

  '--disable-device-discovery-notifications',

  // https://github.com/cypress-io/cypress/issues/2376
  '--autoplay-policy=no-user-gesture-required',

  // http://www.chromium.org/Home/chromium-security/site-isolation
  // https://github.com/cypress-io/cypress/issues/1951
  '--disable-site-isolation-trials',

  // the following come from chromedriver
  // https://code.google.com/p/chromium/codesearch#chromium/src/chrome/test/chromedriver/chrome_launcher.cc&sq=package:chromium&l=70
  '--metrics-recording-only',
  '--disable-prompt-on-repost',
  '--disable-hang-monitor',
  '--disable-sync',
  // this flag is causing throttling of XHR callbacks for
  // as much as 30 seconds. If you VNC in and open dev tools or
  // click on a button, it'll "instantly" work. with this
  // option enabled, it will time out some of our tests in circle
  // "--disable-background-networking"
  '--disable-web-resources',
  '--safebrowsing-disable-download-protection',
  '--disable-client-side-phishing-detection',
  '--disable-component-update',
  // Simulate when chrome needs an update.
  // This prevents an 'update' from displaying til the given date
  `--simulate-outdated-no-au='Tue, 31 Dec 2099 23:59:59 GMT'`,
  '--disable-default-apps',

  // Disable manual option and popup prompt of Chrome translation
  // https://github.com/cypress-io/cypress/issues/28225
  '--disable-features=Translate',

  // These flags are for webcam/WebRTC testing
  // https://github.com/cypress-io/cypress/issues/2704
  '--use-fake-ui-for-media-stream',
  '--use-fake-device-for-media-stream',

  // so Cypress commands don't get throttled
  // https://github.com/cypress-io/cypress/issues/5132
  '--disable-ipc-flooding-protection',

  // misc. options puppeteer passes
  // https://github.com/cypress-io/cypress/issues/3633
  '--disable-backgrounding-occluded-window',
  '--disable-breakpad',
  '--password-store=basic',
  '--use-mock-keychain',

  // write shared memory files into '/tmp' instead of '/dev/shm'
  // https://github.com/cypress-io/cypress/issues/5336
  '--disable-dev-shm-usage',

  // enable precise memory info so performance.memory returns more accurate values
  '--enable-precise-memory-info',
]

let browserCriClient: BrowserCriClient | undefined

/**
 * Reads all known preference files (CHROME_PREFERENCE_PATHS) from disk and return
 * @param userDir
 */
const _getChromePreferences = (userDir: string): Bluebird<ChromePreferences> => {
  debug('reading chrome preferences... %o', { userDir, CHROME_PREFERENCE_PATHS })

  return Bluebird.props(_.mapValues(CHROME_PREFERENCE_PATHS, (prefPath) => {
    return fs.readJson(path.join(userDir, prefPath))
    .catch((err) => {
      // return empty obj if it doesn't exist
      if (err.code === 'ENOENT') {
        return {}
      }

      throw err
    })
  }))
}

const _mergeChromePreferences = (originalPrefs: ChromePreferences, newPrefs: ChromePreferences): ChromePreferences => {
  return _.mapValues(CHROME_PREFERENCE_PATHS, (_v, prefPath) => {
    const original = _.cloneDeep(originalPrefs[prefPath])

    if (!newPrefs[prefPath]) {
      return original
    }

    let deletions: any[] = []

    _.mergeWith(original, newPrefs[prefPath], (_objValue, newValue, key, obj) => {
      if (newValue == null) {
        // setting a key to null should remove it
        deletions.push([obj, key])
      }
    })

    deletions.forEach(([obj, key]) => {
      delete obj[key]
    })

    return original
  })
}

const _writeChromePreferences = (userDir: string, originalPrefs: ChromePreferences, newPrefs: ChromePreferences) => {
  return Bluebird.map(_.keys(originalPrefs), (key) => {
    const originalJson = originalPrefs[key]
    const newJson = newPrefs[key]

    if (!newJson || _.isEqual(originalJson, newJson)) {
      return
    }

    return fs.outputJson(path.join(userDir, CHROME_PREFERENCE_PATHS[key]), newJson)
  })
  .return()
}

/**
 * Merge the different `--load-extension` arguments into one.
 *
 * @param extPath path to Cypress extension
 * @param args all browser args
 * @param browser the current browser being launched
 * @returns the modified list of arguments
 */
const _normalizeArgExtensions = function (extPath, args, pluginExtensions, browser: Browser): string[] {
  if (browser.isHeadless) {
    return args
  }

  let userExtensions = []
  const loadExtension = _.find(args, (arg) => {
    return arg.includes(LOAD_EXTENSION)
  })

  if (loadExtension) {
    args = _.without(args, loadExtension)

    // form into array, enabling users to pass multiple extensions
    userExtensions = userExtensions.concat(loadExtension.replace(LOAD_EXTENSION, '').split(','))
  }

  if (pluginExtensions) {
    userExtensions = userExtensions.concat(pluginExtensions)
  }

  const extensions = ([] as any).concat(userExtensions, extPath, pathToTheme)

  args.push(LOAD_EXTENSION + _.compact(extensions).join(','))

  return args
}

// we now store the extension in each browser profile
const _removeRootExtension = () => {
  return fs
  .removeAsync(appData.path('extensions'))
  .catchReturn(null)
} // noop if doesn't exist fails for any reason

// https://github.com/cypress-io/cypress/issues/2048
const _disableRestorePagesPrompt = function (userDir) {
  const prefsPath = path.join(userDir, 'Default', 'Preferences')

  return fs.readJson(prefsPath)
  .then((preferences) => {
    const profile = preferences.profile

    if (profile) {
      if ((profile['exit_type'] !== 'Normal') || (profile['exited_cleanly'] !== true)) {
        debug('cleaning up unclean exit status')

        profile['exit_type'] = 'Normal'
        profile['exited_cleanly'] = true

        return fs.outputJson(prefsPath, preferences)
      }
    }

    return
  })
  .catch(() => { })
}

async function _recordVideo (cdpAutomation: CdpAutomation, videoOptions: RunModeVideoApi, browserMajorVersion: number) {
  const screencastOptions = browserMajorVersion >= CHROME_VERSION_WITH_FPS_INCREASE ? screencastOpts() : screencastOpts(1)

  const { writeVideoFrame } = await videoOptions.useFfmpegVideoController()

  await cdpAutomation.startVideoRecording(writeVideoFrame, screencastOptions)
}

// a utility function that navigates to the given URL
// once Chrome remote interface client is passed to it.
const _navigateUsingCRI = async function (client, url) {
  // @ts-ignore
  la(check.url(url), 'missing url to navigate to', url)
  la(client, 'could not get CRI client')
  debug('received CRI client')
  debug('navigating to page %s', url)

  // when opening the blank page and trying to navigate
  // the focus gets lost. Restore it and then navigate.
  await client.send('Page.bringToFront')
  await client.send('Page.navigate', { url })
}

const _handleDownloads = async function (client, downloadsFolder: string, automation) {
  client.on('Page.downloadWillBegin', (data) => {
    const downloadItem = {
      id: data.guid,
      url: data.url,
    }

    const filename = data.suggestedFilename

    if (filename) {
      // @ts-ignore
      downloadItem.filePath = path.join(downloadsFolder, data.suggestedFilename)
      // @ts-ignore
      downloadItem.mime = mime.getType(data.suggestedFilename)
    }

    automation.push('create:download', downloadItem)
  })

  client.on('Page.downloadProgress', (data) => {
    if (data.state === 'completed') {
      automation.push('complete:download', {
        id: data.guid,
      })
    }

    if (data.state === 'canceled') {
      automation.push('canceled:download', {
        id: data.guid,
      })
    }
  })

  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadsFolder,
  })
}

let onReconnect: (client: CriClient) => Promise<void> = async () => undefined

const _setAutomation = async (client: CriClient, automation: Automation, resetBrowserTargets: (shouldKeepTabOpen: boolean) => Promise<void>, options: BrowserLaunchOpts) => {
  const cdpAutomation = await CdpAutomation.create(client.send, client.on, client.off, resetBrowserTargets, automation, options.protocolManager)

  automation.use(cdpAutomation)

  return cdpAutomation
}

export = {
  //
  // tip:
  //   by adding utility functions that start with "_"
  //   as methods here we can easily stub them from our unit tests
  //

  _normalizeArgExtensions,

  _removeRootExtension,

  _recordVideo,

  _navigateUsingCRI,

  _handleDownloads,

  _setAutomation,

  _getChromePreferences,

  _mergeChromePreferences,

  _writeChromePreferences,

  _getBrowserCriClient () {
    return browserCriClient
  },

  async _writeExtension (browser: Browser, options: BrowserLaunchOpts) {
    if (browser.isHeadless) {
      debug('chrome is running headlessly, not installing extension')

      return
    }

    const extensionDest = utils.getExtensionDir(browser, options.isTextTerminal)

    // copy the extension src to the extension dist
    await utils.copyExtension(pathToExtension, extensionDest)

    return extensionDest
  },

  _getArgs (browser: Browser, options: BrowserLaunchOpts, port: string) {
    const args = ([] as string[]).concat(DEFAULT_ARGS)

    if (os.platform() === 'linux') {
      args.push('--disable-gpu')
      args.push('--no-sandbox')
    }

    const ua = options.userAgent

    if (ua) {
      args.push(`--user-agent=${ua}`)
    }

    const ps = options.proxyServer

    if (ps) {
      args.push(`--proxy-server=${ps}`)
    }

    if (options.chromeWebSecurity === false) {
      args.push('--disable-web-security')
      args.push('--allow-running-insecure-content')
    }

    // prevent AUT shaking in 66 & 67, but flag breaks chrome in 68+
    // https://github.com/cypress-io/cypress/issues/2037
    // https://github.com/cypress-io/cypress/issues/2215
    // https://github.com/cypress-io/cypress/issues/2223
    const { majorVersion, isHeadless } = browser

    if (CHROME_VERSIONS_WITH_BUGGY_ROOT_LAYER_SCROLLING.includes(majorVersion)) {
      args.push('--disable-blink-features=RootLayerScrolling')
    }

    // https://chromium.googlesource.com/chromium/src/+/da790f920bbc169a6805a4fb83b4c2ab09532d91
    // https://github.com/cypress-io/cypress/issues/1872
    if (majorVersion >= CHROME_VERSION_INTRODUCING_PROXY_BYPASS_ON_LOOPBACK) {
      args.push('--proxy-bypass-list=<-loopback>')
    }

    if (isHeadless) {
      if (majorVersion >= CHROME_VERSION_INTRODUCING_HEADLESS_NEW) {
        args.push('--headless=new')
      } else {
        args.push('--headless')
      }

      // set default headless size to 1280x720
      // https://github.com/cypress-io/cypress/issues/6210
      args.push('--window-size=1280,720')

      // set default headless DPR to 1
      // https://github.com/cypress-io/cypress/issues/17375
      args.push('--force-device-scale-factor=1')
    }

    // force ipv4
    // https://github.com/cypress-io/cypress/issues/5912
    args.push(`--remote-debugging-port=${port}`)
    args.push('--remote-debugging-address=127.0.0.1')

    return args
  },

  /**
  * Clear instance state for the chrome instance, this is normally called in on kill or on exit.
  */
  clearInstanceState (options: GracefulShutdownOptions = {}) {
    debug('closing remote interface client', { options })
    // Do nothing on failure here since we're shutting down anyway
    browserCriClient?.close(options.gracefulShutdown).catch(() => {})
    browserCriClient = undefined
  },

  async connectProtocolToBrowser (options: { protocolManager?: ProtocolManagerShape }) {
    const browserCriClient = this._getBrowserCriClient()

    if (!browserCriClient?.currentlyAttachedTarget) throw new Error('Missing pageCriClient in connectProtocolToBrowser')

    await options.protocolManager?.connectToBrowser(browserCriClient.currentlyAttachedTarget)
  },

  async connectToNewSpec (browser: Browser, options: BrowserNewTabOpts, automation: Automation, socketServer?: CDPSocketServer) {
    debug('connecting to new chrome tab in existing instance with url and debugging port', { url: options.url })

    const browserCriClient = this._getBrowserCriClient()

    if (!browserCriClient) throw new Error('Missing browserCriClient in connectToNewSpec')

    const pageCriClient = browserCriClient.currentlyAttachedTarget

    if (!pageCriClient) throw new Error('Missing pageCriClient in connectToNewSpec')

    if (!options.url) throw new Error('Missing url in connectToNewSpec')

    await this.connectProtocolToBrowser({ protocolManager: options.protocolManager })
    await socketServer?.attachCDPClient(pageCriClient)

    await this.attachListeners(options.url, pageCriClient, automation, options, browser)
  },

  async connectToExisting (browser: Browser, options: BrowserLaunchOpts, automation: Automation, cdpSocketServer?: CDPSocketServer) {
    const port = await protocol.getRemoteDebuggingPort()

    debug('connecting to existing chrome instance with url and debugging port', { url: options.url, port })
    if (!options.onError) throw new Error('Missing onError in connectToExisting')

    const browserCriClient = await BrowserCriClient.create({ hosts: ['127.0.0.1'], port, browserName: browser.displayName, onAsynchronousError: options.onError, onReconnect, fullyManageTabs: false })

    if (!options.url) throw new Error('Missing url in connectToExisting')

    const pageCriClient = await browserCriClient.attachToTargetUrl(options.url)

    await cdpSocketServer?.attachCDPClient(pageCriClient)

    await this._setAutomation(pageCriClient, automation, browserCriClient.resetBrowserTargets, options)
  },

  async attachListeners (url: string, pageCriClient: CriClient, automation: Automation, options: BrowserLaunchOpts | BrowserNewTabOpts, browser: Browser) {
    const browserCriClient = this._getBrowserCriClient()

    // Handle chrome tab crashes.
    pageCriClient.on('Target.targetCrashed', async (event) => {
      if (event.targetId !== browserCriClient?.currentlyAttachedTarget?.targetId) {
        return
      }

      const err = errors.get('RENDERER_CRASHED', browser.displayName)

      await memory.endProfiling()

      if (!options.onError) {
        errors.log(err)
        throw new Error('Missing onError in attachListeners')
      }

      options.onError(err)
    })

    if (!browserCriClient) throw new Error('Missing browserCriClient in attachListeners')

    debug('attaching listeners to chrome %o', { url, options })

    const cdpAutomation = await this._setAutomation(pageCriClient, automation, browserCriClient.resetBrowserTargets, options)

    onReconnect = (client: CriClient) => {
      // if the client disconnects (e.g. due to a computer sleeping), update
      // the frame tree on reconnect in cases there were changes while
      // the client was disconnected
      // @ts-expect-error
      return cdpAutomation._updateFrameTree(client, 'onReconnect')()
    }

    await pageCriClient.send('Page.enable')

    await options['onInitializeNewBrowserTab']?.()

    await Promise.all([
      options.videoApi && this._recordVideo(cdpAutomation, options.videoApi, Number(options.browser.majorVersion)),
      this._handleDownloads(pageCriClient, options.downloadsFolder, automation),
      utils.handleDownloadLinksViaCDP(pageCriClient, automation),
    ])

    await this._navigateUsingCRI(pageCriClient, url)

    await cdpAutomation._handlePausedRequests(pageCriClient)
    cdpAutomation._listenForFrameTreeChanges(pageCriClient)

    return cdpAutomation
  },

  async open (browser: Browser, url, options: BrowserLaunchOpts, automation: Automation, cdpSocketServer?: CDPSocketServer): Promise<BrowserInstance> {
    const { isTextTerminal } = options

    const userDir = utils.getProfileDir(browser, isTextTerminal)

    const [port, preferences] = await Bluebird.all([
      protocol.getRemoteDebuggingPort(),
      _getChromePreferences(userDir),
    ])

    const defaultArgs = this._getArgs(browser, options, port)

    const defaultLaunchOptions = utils.getDefaultLaunchOptions({
      preferences,
      args: defaultArgs,
    })

    const [cacheDir, launchOptions] = await Bluebird.all([
      // ensure that we have a clean cache dir
      // before launching the browser every time
      utils.ensureCleanCache(browser, isTextTerminal),
      utils.executeBeforeBrowserLaunch(browser, defaultLaunchOptions, options),
    ])

    if (launchOptions.preferences) {
      launchOptions.preferences = _mergeChromePreferences(preferences, launchOptions.preferences as ChromePreferences)
    }

    const [extDest] = await Bluebird.all([
      this._writeExtension(
        browser,
        options,
      ),
      _removeRootExtension(),
      _disableRestorePagesPrompt(userDir),
      // Chrome adds a lock file to the user data dir. If we are restarting the run and browser, we need to remove it.
      fs.unlink(path.join(userDir, 'SingletonLock')).catch(() => {}),
      _writeChromePreferences(userDir, preferences, launchOptions.preferences as ChromePreferences),
    ])
    // normalize the --load-extensions argument by
    // massaging what the user passed into our own
    const args = _normalizeArgExtensions(extDest, launchOptions.args, launchOptions.extensions, browser)

    // this overrides any previous user-data-dir args
    // by being the last one
    args.push(`--user-data-dir=${userDir}`)
    args.push(`--disk-cache-dir=${cacheDir}`)

    debug('launching in chrome with debugging port %o', { url, args, port })

    // FIRST load the blank page
    // first allows us to connect the remote interface,
    // start video recording and then
    // we will load the actual page
    const launchedBrowser = await launch(browser, 'about:blank', port, args, launchOptions.env) as unknown as BrowserInstance & { browserCriClient: BrowserCriClient}

    la(launchedBrowser, 'did not get launched browser instance')

    // SECOND connect to the Chrome remote interface
    // and when the connection is ready
    // navigate to the actual url
    if (!options.onError) throw new Error('Missing onError in chrome#open')

    browserCriClient = await BrowserCriClient.create({ hosts: ['127.0.0.1'], port, browserName: browser.displayName, onAsynchronousError: options.onError, onReconnect, protocolManager: options.protocolManager, fullyManageTabs: true })

    la(browserCriClient, 'expected Chrome remote interface reference', browserCriClient)

    try {
      browserCriClient.ensureMinimumProtocolVersion('1.3')
    } catch (err: any) {
      // if this minimum chrome version changes, sync it with
      // packages/web-config/webpack.config.base.ts and
      // npm/webpack-batteries-included-preprocessor/index.js
      throw new Error(`Cypress requires at least Chrome 64.\n\nDetails:\n${err.message}`)
    }

    // monkey-patch the .kill method to that the CDP connection is closed
    const originalBrowserKill = launchedBrowser.kill

    launchedBrowser.browserCriClient = browserCriClient

    launchedBrowser.kill = (...args) => {
      this.clearInstanceState({ gracefulShutdown: true })

      debug('closing chrome')

      originalBrowserKill.apply(launchedBrowser, args)
    }

    const pageCriClient = await browserCriClient.attachToTargetUrl('about:blank')

    await cdpSocketServer?.attachCDPClient(pageCriClient)

    await this.attachListeners(url, pageCriClient, automation, options, browser)

    await utils.executeAfterBrowserLaunch(browser, {
      webSocketDebuggerUrl: browserCriClient.getWebSocketDebuggerUrl(),
    })

    // return the launched browser process
    // with additional method to close the remote connection
    return launchedBrowser
  },
}
