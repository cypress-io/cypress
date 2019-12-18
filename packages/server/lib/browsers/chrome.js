'use strict'
let __importDefault = (this && this.__importDefault) || function (mod) {
  return (mod && mod.__esModule) ? mod : { 'default': mod }
}
let __importStar = (this && this.__importStar) || function (mod) {
  if (mod && mod.__esModule) return mod

  let result = {}

  if (mod != null) for (let k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k]

  result['default'] = mod

  return result
}

Object.defineProperty(exports, '__esModule', { value: true })
let lodash_1 = __importDefault(require('lodash'))
let os_1 = __importDefault(require('os'))
let path_1 = __importDefault(require('path'))
let bluebird_1 = __importDefault(require('bluebird'))
let lazy_ass_1 = __importDefault(require('lazy-ass'))
let check_more_types_1 = __importDefault(require('check-more-types'))
let extension_1 = __importDefault(require('@packages/extension'))
let debug_1 = __importDefault(require('debug'))
let fs_1 = __importDefault(require('../util/fs'))
let app_data_1 = __importDefault(require('../util/app_data'))
let utils_1 = __importDefault(require('./utils'))
let protocol_1 = __importDefault(require('./protocol'))
let cdp_automation_1 = require('./cdp_automation')
let CriClient = __importStar(require('./cri-client'))
let plugins = require('../plugins')
let debug = debug_1.default('cypress:server:browsers:chrome')
let LOAD_EXTENSION = '--load-extension='
let CHROME_VERSIONS_WITH_BUGGY_ROOT_LAYER_SCROLLING = '66 67'.split(' ')
let CHROME_VERSION_INTRODUCING_PROXY_BYPASS_ON_LOOPBACK = 72
let pathToExtension = extension_1.default.getPathToExtension()
let pathToTheme = extension_1.default.getPathToTheme()
let defaultArgs = [
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
let getRemoteDebuggingPort = bluebird_1.default.method(function () {
  let port

  port = Number(process.env.CYPRESS_REMOTE_DEBUGGING_PORT)
  if (port) {
    return port
  }

  return utils_1.default.getPort()
})
let pluginsBeforeBrowserLaunch = function (browser, args) {
  // bail if we're not registered to this event
  if (!plugins.has('before:browser:launch')) {
    return args
  }

  return plugins.execute('before:browser:launch', browser, args)
  .then(function (newArgs) {
    debug('got user args for \'before:browser:launch\'', newArgs)

    // reset args if we got 'em
    return newArgs != null ? newArgs : args
  })
}
/**
 * Merge the different `--load-extension` arguments into one.
 *
 * @param extPath path to Cypress extension
 * @param args all browser args
 * @param browser the current browser being launched
 * @returns the modified list of arguments
 */
let _normalizeArgExtensions = function (extPath, args, browser) {
  if (browser.isHeadless) {
    return args
  }

  let userExtensions
  let loadExtension = lodash_1.default.find(args, function (arg) {
    return arg.includes(LOAD_EXTENSION)
  })

  if (loadExtension) {
    args = lodash_1.default.without(args, loadExtension)
    // form into array, enabling users to pass multiple extensions
    userExtensions = loadExtension.replace(LOAD_EXTENSION, '').split(',')
  }

  let extensions = [].concat(userExtensions, extPath, pathToTheme)

  args.push(LOAD_EXTENSION + lodash_1.default.compact(extensions).join(','))

  return args
}
// we now store the extension in each browser profile
let _removeRootExtension = function () {
  return fs_1.default
  .removeAsync(app_data_1.default.path('extensions'))
  .catchReturn(null)
} // noop if doesn't exist fails for any reason
// https://github.com/cypress-io/cypress/issues/2048
let _disableRestorePagesPrompt = function (userDir) {
  let prefsPath = path_1.default.join(userDir, 'Default', 'Preferences')

  return fs_1.default.readJson(prefsPath)
  .then(function (preferences) {
    let profile

    profile = preferences.profile
    if (profile) {
      if ((profile['exit_type'] !== 'Normal') || (profile['exited_cleanly'] !== true)) {
        debug('cleaning up unclean exit status')
        profile['exit_type'] = 'Normal'
        profile['exited_cleanly'] = true

        return fs_1.default.writeJson(prefsPath, preferences)
      }
    }
  }).catch(function () { })
}
// After the browser has been opened, we can connect to
// its remote interface via a websocket.
let _connectToChromeRemoteInterface = function (port) {
  // @ts-ignore
  lazy_ass_1.default(check_more_types_1.default.userPort(port), 'expected port number to connect CRI to', port)
  debug('connecting to Chrome remote interface at random port %d', port)

  return protocol_1.default.getWsTargetFor(port)
  .then(function (wsUrl) {
    debug('received wsUrl %s for port %d', wsUrl, port)

    return CriClient.create(wsUrl)
  })
}
let _maybeRecordVideo = function (options) {
  return (function (client) {
    if (!options.screencastFrame) {
      debug('screencastFrame is false')

      return client
    }

    debug('starting screencast')
    client.on('Page.screencastFrame', options.screencastFrame)

    return client.send('Page.startScreencast', {
      format: 'jpeg',
    })
    .then(function () {
      return client
    })
  })
}
// a utility function that navigates to the given URL
// once Chrome remote interface client is passed to it.
let _navigateUsingCRI = function (url) {
  // @ts-ignore
  lazy_ass_1.default(check_more_types_1.default.url(url), 'missing url to navigate to', url)

  return function (client) {
    lazy_ass_1.default(client, 'could not get CRI client')
    debug('received CRI client')
    debug('navigating to page %s', url)

    // when opening the blank page and trying to navigate
    // the focus gets lost. Restore it and then navigate.
    return client.send('Page.bringToFront')
    .then(function () {
      return client.send('Page.navigate', { url })
    })
  }
}
let _setAutomation = function (client, automation) {
  return automation.use(cdp_automation_1.CdpAutomation(client.send))
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
  _writeExtension (browser, options) {
    if (browser.isHeadless) {
      debug('chrome is running headlessly, not installing extension')

      return
    }

    // get the string bytes for the final extension file
    return extension_1.default.setHostAndPath(options.proxyUrl, options.socketIoRoute).then(function (str) {
      let extensionBg
      let extensionDest

      extensionDest = utils_1.default.getExtensionDir(browser, options.isTextTerminal)
      extensionBg = path_1.default.join(extensionDest, 'background.js')

      // copy the extension src to the extension dist
      return utils_1.default.copyExtension(pathToExtension, extensionDest).then(function () {
        // and overwrite background.js with the final string bytes
        return fs_1.default.writeFileAsync(extensionBg, str)
      }).return(extensionDest)
    })
  },
  _getArgs (options) {
    if (options === void 0) {
      options = {}
    }

    let ps
    let ua

    lodash_1.default.defaults(options, {
      browser: {},
    })

    let args = [].concat(defaultArgs)

    if (os_1.default.platform() === 'linux') {
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
    let majorVersion = options.browser.majorVersion

    if (CHROME_VERSIONS_WITH_BUGGY_ROOT_LAYER_SCROLLING.includes(majorVersion)) {
      args.push('--disable-blink-features=RootLayerScrolling')
    }

    // https://chromium.googlesource.com/chromium/src/+/da790f920bbc169a6805a4fb83b4c2ab09532d91
    // https://github.com/cypress-io/cypress/issues/1872
    if (majorVersion >= CHROME_VERSION_INTRODUCING_PROXY_BYPASS_ON_LOOPBACK) {
      args.push('--proxy-bypass-list=<-loopback>')
    }

    return args
  },
  open (browser, url, options, automation) {
    let _this = this

    if (options === void 0) {
      options = {}
    }

    let isTextTerminal = options.isTextTerminal
    let userDir = utils_1.default.getProfileDir(browser, isTextTerminal)

    return bluebird_1.default
    .try(function () {
      let args = _this._getArgs(options)

      if (browser.isHeadless) {
        args.push('--headless')
      }

      return getRemoteDebuggingPort()
      .then(function (port) {
        args.push(`--remote-debugging-port=${port}`)

        return bluebird_1.default.all([
          // ensure that we have a clean cache dir
          // before launching the browser every time
          utils_1.default.ensureCleanCache(browser, isTextTerminal),
          pluginsBeforeBrowserLaunch(options.browser, args),
          port,
        ])
      })
    }).spread(function (cacheDir, args, port) {
      return bluebird_1.default.all([
        _this._writeExtension(browser, options),
        _removeRootExtension(),
        _disableRestorePagesPrompt(userDir),
      ])
      .spread(function (extDest) {
        // normalize the --load-extensions argument by
        // massaging what the user passed into our own
        args = _normalizeArgExtensions(extDest, args, browser)
        // this overrides any previous user-data-dir args
        // by being the last one
        args.push(`--user-data-dir=${userDir}`)
        args.push(`--disk-cache-dir=${cacheDir}`)
        debug('launching in chrome with debugging port', { url, args, port })

        // FIRST load the blank page
        // first allows us to connect the remote interface,
        // start video recording and then
        // we will load the actual page
        return utils_1.default.launch(browser, 'about:blank', args)
      }).then(function (launchedBrowser) {
        lazy_ass_1.default(launchedBrowser, 'did not get launched browser instance')

        // SECOND connect to the Chrome remote interface
        // and when the connection is ready
        // navigate to the actual url
        return _this._connectToChromeRemoteInterface(port)
        .then(function (criClient) {
          lazy_ass_1.default(criClient, 'expected Chrome remote interface reference', criClient)

          return criClient.ensureMinimumProtocolVersion('1.3')
          .catch(function (err) {
            throw new Error(`Cypress requires at least Chrome 64.\n\nDetails:\n${err.message}`)
          }).then(function () {
            _this._setAutomation(criClient, automation)
            // monkey-patch the .kill method to that the CDP connection is closed
            let originalBrowserKill = launchedBrowser.kill

            launchedBrowser.kill = function () {
              let args = []

              for (let _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i]
              }
              debug('closing remote interface client')

              return criClient.close()
              .then(function () {
                debug('closing chrome')

                return originalBrowserKill.apply(launchedBrowser, args)
              })
            }

            return criClient
          })
        }).then(_this._maybeRecordVideo(options))
        .then(_this._navigateUsingCRI(url))
        // return the launched browser process
        // with additional method to close the remote connection
        .return(launchedBrowser)
      })
    })
  },
}
