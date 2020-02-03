import _ from 'lodash'
import os from 'os'
import path from 'path'
import Bluebird from 'bluebird'
import la from 'lazy-ass'
import check from 'check-more-types'
import extension from '@packages/extension'
import { FoundBrowser } from '@packages/launcher'
import debugModule from 'debug'
import fs from '../util/fs'
import appData from '../util/app_data'
import utils from './utils'
import protocol from './protocol'
import { CdpAutomation } from './cdp_automation'
import * as CriClient from './cri-client'
const errors = require('../errors')

// TODO: this is defined in `cypress-npm-api` but there is currently no way to get there
type CypressConfiguration = any

type Browser = FoundBrowser & {
  isHeadless: boolean
  isHeaded: boolean
}

const plugins = require('../plugins')

const debug = debugModule('cypress:server:browsers:chrome')

const LOAD_EXTENSION = '--load-extension='
const CHROME_VERSIONS_WITH_BUGGY_ROOT_LAYER_SCROLLING = '66 67'.split(' ')
const CHROME_VERSION_INTRODUCING_PROXY_BYPASS_ON_LOOPBACK = 72

const pathToExtension = extension.getPathToExtension()
const pathToTheme = extension.getPathToTheme()

const defaultArgs = [
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
  '--disable-save-password-bubble',
  '--disable-single-click-autofill',
  '--disable-prompt-on-repos',
  '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding',
  '--disable-renderer-throttling',
  '--disable-restore-session-state',
  '--disable-translate',
  '--disable-new-profile-management',
  '--disable-new-avatar-menu',
  '--allow-insecure-localhost',
  '--reduce-security-for-testing',
  '--enable-automation',

  '--disable-device-discovery-notifications',
  '--disable-infobars',

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
  '--safebrowsing-disable-auto-update',
  '--safebrowsing-disable-download-protection',
  '--disable-client-side-phishing-detection',
  '--disable-component-update',
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
]

const getRemoteDebuggingPort = async () => {
  let port

  port = Number(process.env.CYPRESS_REMOTE_DEBUGGING_PORT)

  if (port) {
    return port
  }

  return utils.getPort()
}

const pluginsBeforeBrowserLaunch = async function (browser, options) {
  // bail if we're not registered to this event
  if (!plugins.has('before:browser:launch')) {
    return null
  }

  return plugins.execute('before:browser:launch', browser, options)
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

  const extensions = [].concat(userExtensions, extPath, pathToTheme)

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
    let profile

    profile = preferences.profile

    if (profile) {
      if ((profile['exit_type'] !== 'Normal') || (profile['exited_cleanly'] !== true)) {
        debug('cleaning up unclean exit status')

        profile['exit_type'] = 'Normal'
        profile['exited_cleanly'] = true

        return fs.writeJson(prefsPath, preferences)
      }
    }
  }).catch(() => {})
}

// After the browser has been opened, we can connect to
// its remote interface via a websocket.
const _connectToChromeRemoteInterface = function (port) {
  // @ts-ignore
  la(check.userPort(port), 'expected port number to connect CRI to', port)

  debug('connecting to Chrome remote interface at random port %d', port)

  return protocol.getWsTargetFor(port)
  .then((wsUrl) => {
    debug('received wsUrl %s for port %d', wsUrl, port)

    return CriClient.create(wsUrl)
  })
}

const _maybeRecordVideo = async function (client, options) {
  if (!options.onScreencastFrame) {
    debug('options.onScreencastFrame is false')

    return client
  }

  debug('starting screencast')
  client.on('Page.screencastFrame', options.onScreencastFrame)

  await client.send('Page.startScreencast', {
    format: 'jpeg',
  })

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

const _setAutomation = (client, automation) => {
  return automation.use(
    CdpAutomation(client.send)
  )
}

module.exports = {
  //
  // tip:
  //   by adding utility functions that start with "_"
  //   as methods here we can easily stub them from our unit tests
  //

  _normalizeArgExtensions,

  _removeRootExtension,

  _connectToChromeRemoteInterface,

  _maybeRecordVideo,

  _navigateUsingCRI,

  _setAutomation,

  async _writeExtension (browser: Browser, options) {
    if (browser.isHeadless) {
      debug('chrome is running headlessly, not installing extension')

      return
    }

    // get the string bytes for the final extension file
    const str = await extension.setHostAndPath(options.proxyUrl, options.socketIoRoute)
    let extensionBg; let extensionDest

    extensionDest = utils.getExtensionDir(browser, options.isTextTerminal)
    extensionBg = path.join(extensionDest, 'background.js')

    // copy the extension src to the extension dist
    await utils.copyExtension(pathToExtension, extensionDest)
    await fs.writeFileAsync(extensionBg, str)

    return extensionDest
  },

  // expose for stubbing during tests
  _getArgs (options: CypressConfiguration = {}, port: string) {
    let ps; let ua

    _.defaults(options, {
      browser: {},
    })

    const args = ([] as string[]).concat(defaultArgs)

    if (os.platform() === 'linux') {
      args.push('--disable-gpu')
      args.push('--no-sandbox')
    }

    ua = options.userAgent

    if (ua) {
      args.push(`--user-agent=${ua}`)
    }

    ps = options.proxyServer

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
    const { majorVersion } = options.browser

    if (CHROME_VERSIONS_WITH_BUGGY_ROOT_LAYER_SCROLLING.includes(majorVersion)) {
      args.push('--disable-blink-features=RootLayerScrolling')
    }

    // https://chromium.googlesource.com/chromium/src/+/da790f920bbc169a6805a4fb83b4c2ab09532d91
    // https://github.com/cypress-io/cypress/issues/1872
    if (majorVersion >= CHROME_VERSION_INTRODUCING_PROXY_BYPASS_ON_LOOPBACK) {
      args.push('--proxy-bypass-list=<-loopback>')
    }

    if (options.browser.isHeadless) {
      args.push('--headless')
    }

    // force ipv4
    // https://github.com/cypress-io/cypress/issues/5912
    args.push(`--remote-debugging-port=${port}`)
    args.push('--remote-debugging-address=127.0.0.1')

    return args
  },

  async open (browser: Browser, url, options: CypressConfiguration = {}, automation) {
    const { isTextTerminal } = options

    const userDir = utils.getProfileDir(browser, isTextTerminal)

    const port = await getRemoteDebuggingPort()

    let defaultArgs = this._getArgs(options, port)

    let launchOptions = {
      args: defaultArgs,
      extensions: [],
    }

    let [cacheDir, pluginConfigResult] = await Bluebird.all([
      // ensure that we have a clean cache dir
      // before launching the browser every time
      utils.ensureCleanCache(browser, isTextTerminal),
      pluginsBeforeBrowserLaunch(options.browser, launchOptions),
    ])

    if (pluginConfigResult) {
      if (pluginConfigResult[0]) {
        options.onWarning(errors.get(
          'DEPRECATED_BEFOREBROWSERLAUNCH_ARGS'
        ))

        pluginConfigResult = {
          args: _.filter(pluginConfigResult, (_val, key) => _.isNumber(key)),
          extensions: [],
        }
      }

      // use whatever the user returns as pluginConfig
      // @ts-ignore
      if (pluginConfigResult.args) {
        launchOptions.args = pluginConfigResult.args
      }

      if (pluginConfigResult.extensions) {
        launchOptions.extensions = pluginConfigResult.extensions
      }

      if (pluginConfigResult.preferences) {
        // _.extend(launchOptions.preferences, pluginConfigResult.preferences)
      }
    }

    const [extDest] = await Bluebird.all([
      this._writeExtension(
        browser,
        options
      ),
      _removeRootExtension(),
      _disableRestorePagesPrompt(userDir),
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
    const launchedBrowser = await utils.launch(browser, 'about:blank', args)

    la(launchedBrowser, 'did not get launched browser instance')

    // SECOND connect to the Chrome remote interface
    // and when the connection is ready
    // navigate to the actual url
    const criClient = await this._connectToChromeRemoteInterface(port)

    la(criClient, 'expected Chrome remote interface reference', criClient)

    await criClient.ensureMinimumProtocolVersion('1.3')
    .catch((err) => {
      throw new Error(`Cypress requires at least Chrome 64.\n\nDetails:\n${err.message}`)
    })

    this._setAutomation(criClient, automation)

    // monkey-patch the .kill method to that the CDP connection is closed
    const originalBrowserKill = launchedBrowser.kill

    launchedBrowser.kill = async (...args) => {
      debug('closing remote interface client')

      await criClient.close()
      debug('closing chrome')

      await originalBrowserKill.apply(launchedBrowser, args)
    }

    await this._maybeRecordVideo(criClient, options)
    await this._navigateUsingCRI(criClient, url)

    // return the launched browser process
    // with additional method to close the remote connection
    return launchedBrowser
  },
}
