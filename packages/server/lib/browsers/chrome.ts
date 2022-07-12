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
import type { Protocol } from 'devtools-protocol'

import appData from '../util/app_data'
import { fs } from '../util/fs'
import { CdpAutomation, screencastOpts } from './cdp_automation'
import * as protocol from './protocol'
import utils from './utils'
import type { Browser } from './types'
import { BrowserCriClient } from './browser-cri-client'
import type { LaunchedBrowser } from '@packages/launcher/lib/browsers'
import type { CRIWrapper } from './cri-client'
import type { Automation } from '../automation'

// TODO: this is defined in `cypress-npm-api` but there is currently no way to get there
type CypressConfiguration = any

const debug = debugModule('cypress:server:browsers:chrome')

const LOAD_EXTENSION = '--load-extension='
const CHROME_VERSIONS_WITH_BUGGY_ROOT_LAYER_SCROLLING = '66 67'.split(' ')
const CHROME_VERSION_INTRODUCING_PROXY_BYPASS_ON_LOOPBACK = 72
const CHROME_VERSION_WITH_FPS_INCREASE = 89

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

const pathToExtension = extension.getPathToExtension()
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

  '--disable-device-discovery-notifications',

  // https://github.com/cypress-io/cypress/issues/2376
  '--autoplay-policy=no-user-gesture-required',

  // http://www.chromium.org/Home/chromium-security/site-isolation
  // https://github.com/cypress-io/cypress/issues/1951
  '--disable-site-isolation-trials',

  // the following come frome chromedriver
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
]

let browserCriClient

/**
 * Reads all known preference files (CHROME_PREFERENCE_PATHS) from disk and retur
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

const _maybeRecordVideo = async function (client, options, browserMajorVersion) {
  if (!options.onScreencastFrame) {
    debug('options.onScreencastFrame is false')

    return client
  }

  debug('starting screencast')
  client.on('Page.screencastFrame', (meta) => {
    options.onScreencastFrame(meta)
    client.send('Page.screencastFrameAck', { sessionId: meta.sessionId })
  })

  await client.send('Page.startScreencast', browserMajorVersion >= CHROME_VERSION_WITH_FPS_INCREASE ? screencastOpts() : screencastOpts(1))

  return client
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

const _handleDownloads = async function (client, dir, automation) {
  client.on('Page.downloadWillBegin', (data) => {
    const downloadItem = {
      id: data.guid,
      url: data.url,
    }

    const filename = data.suggestedFilename

    if (filename) {
      // @ts-ignore
      downloadItem.filePath = path.join(dir, data.suggestedFilename)
      // @ts-ignore
      downloadItem.mime = mime.getType(data.suggestedFilename)
    }

    automation.push('create:download', downloadItem)
  })

  client.on('Page.downloadProgress', (data) => {
    if (data.state !== 'completed') return

    automation.push('complete:download', {
      id: data.guid,
    })
  })

  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: dir,
  })
}

let frameTree
let gettingFrameTree

const onReconnect = (client: CRIWrapper.Client) => {
  // if the client disconnects (e.g. due to a computer sleeping), update
  // the frame tree on reconnect in cases there were changes while
  // the client was disconnected
  return _updateFrameTree(client, 'onReconnect')()
}

// eslint-disable-next-line @cypress/dev/arrow-body-multiline-braces
const _updateFrameTree = (client: CRIWrapper.Client, eventName) => async () => {
  debug(`update frame tree for ${eventName}`)

  gettingFrameTree = new Promise<void>(async (resolve) => {
    try {
      frameTree = (await client.send('Page.getFrameTree')).frameTree
      debug('frame tree updated')
    } catch (err) {
      debug('failed to update frame tree:', err.stack)
    } finally {
      gettingFrameTree = null

      resolve()
    }
  })
}

// we can't get the frame tree during the Fetch.requestPaused event, because
// the CDP is tied up during that event and can't be utilized. so we maintain
// a reference to it that's updated when it's likely to have been changed
const _listenForFrameTreeChanges = (client) => {
  debug('listen for frame tree changes')

  client.on('Page.frameAttached', _updateFrameTree(client, 'Page.frameAttached'))
  client.on('Page.frameDetached', _updateFrameTree(client, 'Page.frameDetached'))
}

const _continueRequest = (client, params, header?) => {
  const details: Protocol.Fetch.ContinueRequestRequest = {
    requestId: params.requestId,
  }

  if (header) {
    // headers are received as an object but need to be an array
    // to modify them
    const currentHeaders = _.map(params.request.headers, (value, name) => ({ name, value }))

    details.headers = [
      ...currentHeaders,
      header,
    ]
  }

  debug('continueRequest: %o', details)

  client.send('Fetch.continueRequest', details).catch((err) => {
    // swallow this error so it doesn't crash Cypress.
    // an "Invalid InterceptionId" error can randomly happen in the driver tests
    // when testing the redirection loop limit, when a redirect request happens
    // to be sent after the test has moved on. this shouldn't crash Cypress, in
    // any case, and likely wouldn't happen for standard user tests, since they
    // will properly fail and not move on like the driver tests
    debug('continueRequest failed, url: %s, error: %s', params.request.url, err?.stack || err)
  })
}

interface HasFrame {
  frame: Protocol.Page.Frame
}

const _isAUTFrame = async (frameId: string) => {
  debug('need frame tree')

  // the request could come in while in the middle of getting the frame tree,
  // which is asynchronous, so wait for it to be fetched
  if (gettingFrameTree) {
    debug('awaiting frame tree')

    await gettingFrameTree
  }

  const frame = _.find(frameTree?.childFrames || [], ({ frame }) => {
    return frame?.name?.startsWith('Your project:')
  }) as HasFrame | undefined

  if (frame) {
    return frame.frame.id === frameId
  }

  return false
}

const _handlePausedRequests = async (client) => {
  await client.send('Fetch.enable')

  // adds a header to the request to mark it as a request for the AUT frame
  // itself, so the proxy can utilize that for injection purposes
  client.on('Fetch.requestPaused', async (params: Protocol.Fetch.RequestPausedEvent) => {
    if (
      // is a script, stylesheet, image, etc
      params.resourceType !== 'Document'
      || !(await _isAUTFrame(params.frameId))
    ) {
      return _continueRequest(client, params)
    }

    debug('add X-Cypress-Is-AUT-Frame header to: %s', params.request.url)

    _continueRequest(client, params, {
      name: 'X-Cypress-Is-AUT-Frame',
      value: 'true',
    })
  })
}

const _setAutomation = async (client: CRIWrapper.Client, automation: Automation, resetBrowserTargets: (shouldKeepTabOpen: boolean) => Promise<void>, options: CypressConfiguration = {}) => {
  const cdpAutomation = await CdpAutomation.create(client.send, client.on, resetBrowserTargets, automation, options.experimentalSessionAndOrigin)

  return automation.use(cdpAutomation)
}

export = {
  //
  // tip:
  //   by adding utility functions that start with "_"
  //   as methods here we can easily stub them from our unit tests
  //

  _normalizeArgExtensions,

  _removeRootExtension,

  _maybeRecordVideo,

  _navigateUsingCRI,

  _handleDownloads,

  _handlePausedRequests,

  _setAutomation,

  _getChromePreferences,

  _mergeChromePreferences,

  _writeChromePreferences,

  _getBrowserCriClient () {
    return browserCriClient
  },

  async _writeExtension (browser: Browser, options) {
    if (browser.isHeadless) {
      debug('chrome is running headlessly, not installing extension')

      return
    }

    // get the string bytes for the final extension file
    const str = await extension.setHostAndPath(options.proxyUrl, options.socketIoRoute)
    const extensionDest = utils.getExtensionDir(browser, options.isTextTerminal)
    const extensionBg = path.join(extensionDest, 'background.js')

    // copy the extension src to the extension dist
    await utils.copyExtension(pathToExtension, extensionDest)
    await fs.chmod(extensionBg, 0o0644)
    await fs.writeFileAsync(extensionBg, str)

    return extensionDest
  },

  _getArgs (browser: Browser, options: CypressConfiguration, port: string) {
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
      args.push('--headless')

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

  async connectToNewSpec (browser: Browser, options: CypressConfiguration = {}, automation: Automation) {
    debug('connecting to new chrome tab in existing instance with url and debugging port', { url: options.url })

    const browserCriClient = this._getBrowserCriClient()
    const pageCriClient = browserCriClient.currentlyAttachedTarget

    await this._setAutomation(pageCriClient, automation, browserCriClient.resetBrowserTargets, options)

    // make sure page events are re enabled or else frame tree updates will NOT work as well as other items listening for page events
    await pageCriClient.send('Page.enable')

    await options.onInitializeNewBrowserTab()

    await Promise.all([
      this._maybeRecordVideo(pageCriClient, options, browser.majorVersion),
      this._handleDownloads(pageCriClient, options.downloadsFolder, automation),
    ])

    await this._navigateUsingCRI(pageCriClient, options.url)

    if (options.experimentalSessionAndOrigin) {
      await this._handlePausedRequests(pageCriClient)
      _listenForFrameTreeChanges(pageCriClient)
    }
  },

  async connectToExisting (browser: Browser, options: CypressConfiguration = {}, automation) {
    const port = await protocol.getRemoteDebuggingPort()

    debug('connecting to existing chrome instance with url and debugging port', { url: options.url, port })
    const browserCriClient = await BrowserCriClient.create(port, browser.displayName, options.onError, onReconnect)
    const pageCriClient = await browserCriClient.attachToTargetUrl(options.url)

    await this._setAutomation(pageCriClient, automation, browserCriClient.resetBrowserTargets, options)
  },

  async open (browser: Browser, url, options: CypressConfiguration = {}, automation: Automation): Promise<LaunchedBrowser> {
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
      _writeChromePreferences(userDir, preferences, launchOptions.preferences as ChromePreferences),
    ])
    // normalize the --load-extensions argument by
    // massaging what the user passed into our own
    const args = _normalizeArgExtensions(extDest, launchOptions.args, launchOptions.extensions, browser)

    // this overrides any previous user-data-dir args
    // by being the last one
    args.push(`--user-data-dir=${userDir}`)
    args.push(`--disk-cache-dir=${cacheDir}`)

    debug('launching in chrome with debugging port', { url, args, port })

    // FIRST load the blank page
    // first allows us to connect the remote interface,
    // start video recording and then
    // we will load the actual page
    const launchedBrowser = await launch(browser, 'about:blank', port, args) as LaunchedBrowser & { browserCriClient: BrowserCriClient}

    la(launchedBrowser, 'did not get launched browser instance')

    // SECOND connect to the Chrome remote interface
    // and when the connection is ready
    // navigate to the actual url
    browserCriClient = await BrowserCriClient.create(port, browser.displayName, options.onError, onReconnect)

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

    /* @ts-expect-error */
    launchedBrowser.kill = (...args) => {
      debug('closing remote interface client')

      // Do nothing on failure here since we're shutting down anyway
      browserCriClient.close().catch()
      browserCriClient = undefined

      debug('closing chrome')

      originalBrowserKill.apply(launchedBrowser, args)
    }

    const pageCriClient = await browserCriClient.attachToTargetUrl('about:blank')

    await this._setAutomation(pageCriClient, automation, browserCriClient.resetBrowserTargets, options)

    await pageCriClient.send('Page.enable')

    await Promise.all([
      this._maybeRecordVideo(pageCriClient, options, browser.majorVersion),
      this._handleDownloads(pageCriClient, options.downloadsFolder, automation),
    ])

    await this._navigateUsingCRI(pageCriClient, url)

    if (options.experimentalSessionAndOrigin) {
      await this._handlePausedRequests(pageCriClient)
      _listenForFrameTreeChanges(pageCriClient)
    }

    // return the launched browser process
    // with additional method to close the remote connection
    return launchedBrowser
  },
}
