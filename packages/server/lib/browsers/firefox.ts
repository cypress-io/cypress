import _ from 'lodash'
import fs from 'fs-extra'
import Debug from 'debug'
import getPort from 'get-port'
import path from 'path'
import urlUtil from 'url'
import { debug as launcherDebug, launch } from '@packages/launcher/lib/browsers'
import { doubleEscape } from '@packages/launcher/lib/windows'
import FirefoxProfile from 'firefox-profile'
import * as errors from '../errors'
import firefoxUtil from './firefox-util'
import utils from './utils'
import type { Browser, BrowserInstance } from './types'
import { EventEmitter } from 'events'
import os from 'os'
import treeKill from 'tree-kill'
import mimeDb from 'mime-db'
import { getRemoteDebuggingPort } from './protocol'
import type { BrowserCriClient } from './browser-cri-client'
import type { Automation } from '../automation'
import { getCtx } from '@packages/data-context'
import { getError } from '@packages/errors'
import type { BrowserLaunchOpts, BrowserNewTabOpts, RunModeVideoApi } from '@packages/types'

const debug = Debug('cypress:server:browsers:firefox')

// used to prevent the download prompt for the specified file types.
// this should cover most/all file types, but if it's necessary to
// discover more, open Firefox DevTools, download the file yourself
// and observe the Response Headers content-type in the Network tab
const downloadMimeTypes = Object.keys(mimeDb).filter((mimeType) => {
  return mimeDb[mimeType].extensions?.length
}).join(',')

const defaultPreferences = {
  /**
   * Taken from https://github.com/puppeteer/puppeteer/blob/8b49dc62a62282543ead43541316e23d3450ff3c/lib/Launcher.js#L520
   * with minor modifications
   * BEGIN: Copyright 2017 Google Inc. All rights reserved. Licensed under the Apache License, Version 2.0
   */

  // Make sure Shield doesn't hit the network.
  'app.normandy.api_url': '',
  // Disable Firefox old build background check
  'app.update.checkInstallTime': false,
  // Disable automatically upgrading Firefox
  'app.update.disabledForTesting': true,

  // Increase the APZ content response timeout to 1 minute
  'apz.content_response_timeout': 60000,

  // Prevent various error message on the console
  // jest-puppeteer asserts that no error message is emitted by the console
  'browser.contentblocking.features.standard': '-tp,tpPrivate,cookieBehavior0,-cm,-fp',

  // Enable the dump function: which sends messages to the system
  // console
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1543115
  'browser.dom.window.dump.enabled': true,
  // Disable topstories
  'browser.newtabpage.activity-stream.feeds.section.topstories': false,
  // Always display a blank page
  'browser.newtabpage.enabled': false,
  // Background thumbnails in particular cause grief: and disabling
  // thumbnails in general cannot hurt
  'browser.pagethumbnails.capturing_disabled': true,

  // Disable safebrowsing components.
  'browser.safebrowsing.blockedURIs.enabled': false,
  'browser.safebrowsing.downloads.enabled': false,
  'browser.safebrowsing.malware.enabled': false,
  'browser.safebrowsing.passwords.enabled': false,
  'browser.safebrowsing.phishing.enabled': false,

  // Disable updates to search engines.
  'browser.search.update': false,
  // Do not restore the last open set of tabs if the browser has crashed
  'browser.sessionstore.resume_from_crash': false,
  // Skip check for default browser on startup
  'browser.shell.checkDefaultBrowser': false,

  // Disable newtabpage
  'browser.startup.homepage': 'about:blank',
  // Do not redirect user when a milstone upgrade of Firefox is detected
  'browser.startup.homepage_override.mstone': 'ignore',
  // Start with a blank page about:blank
  'browser.startup.page': 0,
  // Disable notification banners related to session restoration.
  // Any presented banners can result in incorrectly sized screenshots.
  'browser.startup.couldRestoreSession.count': 0,

  // Do not allow background tabs to be zombified on Android: otherwise for
  // tests that open additional tabs: the test harness tab itself might get
  // unloaded
  'browser.tabs.disableBackgroundZombification': false,
  // Do not warn when closing all other open tabs
  'browser.tabs.warnOnCloseOtherTabs': false,
  // Do not warn when multiple tabs will be opened
  'browser.tabs.warnOnOpen': false,

  // Disable the UI tour.
  'browser.uitour.enabled': false,
  // Turn off search suggestions in the location bar so as not to trigger
  // network connections.
  'browser.urlbar.suggest.searches': false,
  // Disable first run splash page on Windows 10
  'browser.usedOnWindows10.introURL': '',
  // Do not warn on quitting Firefox
  'browser.warnOnQuit': false,

  // Do not show datareporting policy notifications which can
  // interfere with tests
  'datareporting.healthreport.about.reportUrl': '',
  'datareporting.healthreport.documentServerURI': '',
  'datareporting.healthreport.logging.consoleEnabled': false,
  'datareporting.healthreport.service.enabled': false,
  'datareporting.healthreport.service.firstRun': false,
  'datareporting.healthreport.uploadEnabled': false,
  'datareporting.policy.dataSubmissionEnabled': false,
  'datareporting.policy.dataSubmissionPolicyAccepted': false,
  'datareporting.policy.dataSubmissionPolicyBypassNotification': true,

  // DevTools JSONViewer sometimes fails to load dependencies with its require.js.
  // This doesn't affect Puppeteer but spams console (Bug 1424372)
  'devtools.jsonview.enabled': false,

  // Disable popup-blocker
  'dom.disable_open_during_load': false,

  // Enable the support for File object creation in the content process
  // Required for |Page.setFileInputFiles| protocol method.
  'dom.file.createInChild': true,

  // Disable the ProcessHangMonitor
  'dom.ipc.reportProcessHangs': false,

  // Disable slow script dialogues
  'dom.max_chrome_script_run_time': 0,
  'dom.max_script_run_time': 0,

  // Only load extensions from the application and user profile
  // AddonManager.SCOPE_PROFILE + AddonManager.SCOPE_APPLICATION
  'extensions.autoDisableScopes': 0,
  'extensions.enabledScopes': 5,

  // Disable metadata caching for installed add-ons by default
  'extensions.getAddons.cache.enabled': false,

  // Disable installing any distribution extensions or add-ons.
  'extensions.installDistroAddons': false,

  // Disabled screenshots extension
  'extensions.screenshots.disabled': true,

  // Turn off extension updates so they do not bother tests
  'extensions.update.enabled': false,

  // Turn off extension updates so they do not bother tests
  'extensions.update.notifyUser': false,

  // Make sure opening about:addons will not hit the network
  'extensions.webservice.discoverURL': '',

  // Allow the application to have focus even it runs in the background
  'focusmanager.testmode': true,
  // Disable useragent updates
  'general.useragent.updates.enabled': false,
  // Always use network provider for geolocation tests so we bypass the
  // macOS dialog raised by the corelocation provider
  'geo.provider.testing': true,
  // Do not scan Wifi
  'geo.wifi.scan': false,
  // No hang monitor
  'hangmonitor.timeout': 0,
  // Show chrome errors and warnings in the error console
  'javascript.options.showInConsole': true,

  // Disable download and usage of OpenH264: and Widevine plugins
  'media.gmp-manager.updateEnabled': false,
  // Prevent various error message on the console
  // jest-puppeteer asserts that no error message is emitted by the console
  'network.cookie.cookieBehavior': 0,

  // Do not prompt for temporary redirects
  'network.http.prompt-temp-redirect': false,

  // Disable speculative connections so they are not reported as leaking
  // when they are hanging around
  'network.http.speculative-parallel-limit': 0,

  // Do not automatically switch between offline and online
  'network.manage-offline-status': false,

  // Make sure SNTP requests do not hit the network
  'network.sntp.pools': '',

  // Disable Flash.
  'plugin.state.flash': 0,

  'privacy.trackingprotection.enabled': false,

  // Enable Remote Agent
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1544393
  'remote.enabled': true,

  // Don't do network connections for mitm priming
  'security.certerrors.mitm.priming.enabled': false,
  // Local documents have access to all other local documents,
  // including directory listings
  'security.fileuri.strict_origin_policy': false,
  // Do not wait for the notification button security delay
  'security.notification_enable_delay': 0,

  // Ensure blocked updates do not hit the network
  'services.settings.server': '',

  // Do not automatically fill sign-in forms with known usernames and
  // passwords
  'signon.autofillForms': false,
  // Disable password capture, so that tests that include forms are not
  // influenced by the presence of the persistent doorhanger notification
  'signon.rememberSignons': false,

  // Disable first-run welcome page
  'startup.homepage_welcome_url': 'about:blank',

  // Disable first-run welcome page
  'startup.homepage_welcome_url.additional': '',

  // Disable browser animations (tabs, fullscreen, sliding alerts)
  'toolkit.cosmeticAnimations.enabled': false,

  'toolkit.telemetry.server': `''`,
  // Prevent starting into safe mode after application crashes
  'toolkit.startup.max_resumed_crashes': -1,

  /**
   * END: Copyright 2017 Google Inc. All rights reserved.
   */

  'network.proxy.type': 1,

  // necessary for adding extensions
  'devtools.debugger.remote-enabled': true,
  // bind foxdriver to 127.0.0.1
  'devtools.debugger.remote-host': '127.0.0.1',
  // devtools.debugger.remote-port is set per-launch

  'devtools.debugger.prompt-connection': false,
  // "devtools.debugger.remote-websocket": true
  'devtools.chrome.enabled': true,
  'app.update.auto': false,
  'app.update.enabled': false,
  'browser.displayedE10SNotice': 4,
  'browser.download.manager.showWhenStarting': false,
  'browser.EULA.override': true,
  'browser.EULA.3.accepted': true,
  'browser.link.open_external': 2,
  'browser.link.open_newwindow': 2,
  'browser.offline': false,
  'browser.reader.detectedFirstArticle': true,
  'browser.selfsupport.url': '',
  'browser.tabs.warnOnClose': false,
  'devtools.errorconsole.enabled': true,
  'extensions.blocklist.enabled': false,
  'extensions.checkCompatibility.nightly': false,
  'extensions.logging.enabled': true,
  'javascript.enabled': true,
  'network.http.phishy-userpass-length': 255,
  'offline-apps.allow_by_default': true,
  'prompts.tab_modal.enabled': false,
  'security.fileuri.origin_policy': 3,
  'toolkit.networkmanager.disable': true,
  'toolkit.telemetry.prompted': 2,
  'toolkit.telemetry.enabled': false,
  'toolkit.telemetry.rejected': true,
  'xpinstall.signatures.required': false,
  'xpinstall.whitelist.required': false,
  'browser.laterrun.enabled': false,
  'browser.newtab.url': 'about:blank',
  'dom.report_all_js_exceptions': true,
  'network.captive-portal-service.enabled': false,
  'security.csp.enable': false,
  'webdriver_accept_untrusted_certs': true,
  'webdriver_assume_untrusted_issuer': true,
  'toolkit.legacyUserProfileCustomizations.stylesheets': true,

  // setting to true hides system window bar, but causes weird resizing issues.
  'browser.tabs.drawInTitlebar': false,

  // allow playing videos w/o user interaction
  'media.autoplay.default': 0,

  'browser.safebrowsing.enabled': false,

  // allow capturing screen through getUserMedia(...)
  // and auto-accept the permissions prompt
  'media.getusermedia.browser.enabled': true,
  'media.navigator.permission.disabled': true,

  'dom.min_background_timeout_value': 4,
  'dom.timeout.enable_budget_timer_throttling': false,

  // allow getUserMedia APIs on insecure domains
  'media.devices.insecure.enabled':	true,
  'media.getusermedia.insecure.enabled': true,

  'marionette.log.level': launcherDebug.enabled ? 'Debug' : undefined,

  // where to download files
  // 0: desktop
  // 1: default "Downloads" directory
  // 2: directory specified with 'browser.download.dir' (set dynamically below)
  'browser.download.folderList': 2,
  // prevents the download prompt for the specified types of files
  'browser.helperApps.neverAsk.saveToDisk': downloadMimeTypes,
}

const FIREFOX_HEADED_USERCSS = `\
#urlbar:not(.megabar), #urlbar.megabar > #urlbar-background, #searchbar {
  background: -moz-Field !important;
  color: -moz-FieldText !important;
}`

const FIREFOX_HEADLESS_USERCSS = `\
#urlbar {
  height: 0px !important;
  min-height: 0px !important;
  overflow: hidden !important;
}
#toolbar {
  height: 0px !important;
  min-height: 0px !important;
  overflow: hidden !important;
}
toolbar {
  height: 0px !important;
  min-height: 0px !important;
  overflow: hidden !important;
}
#titlebar {
  height: 0px !important;
  min-height: 0px !important;
  overflow: hidden !important;
  display: none;
}

`

let browserCriClient

export function _createDetachedInstance (browserInstance: BrowserInstance, browserCriClient?: BrowserCriClient): BrowserInstance {
  const detachedInstance: BrowserInstance = new EventEmitter() as BrowserInstance

  detachedInstance.pid = browserInstance.pid

  // kill the entire process tree, from the spawned instance up
  detachedInstance.kill = (): void => {
    // Close browser cri client socket. Do nothing on failure here since we're shutting down anyway
    if (browserCriClient) {
      browserCriClient.close().catch()
      browserCriClient = undefined
    }

    treeKill(browserInstance.pid as number, (err?, result?) => {
      debug('force-exit of process tree complete %o', { err, result })
      detachedInstance.emit('exit')
    })
  }

  return detachedInstance
}

/**
* Clear instance state for the chrome instance, this is normally called in on kill or on exit.
*/
export function clearInstanceState () {
  debug('closing remote interface client')
  if (browserCriClient) {
    browserCriClient.close().catch()
    browserCriClient = undefined
  }
}

export async function connectToNewSpec (browser: Browser, options: BrowserNewTabOpts, automation: Automation) {
  await firefoxUtil.connectToNewSpec(options, automation, browserCriClient)
}

export function connectToExisting () {
  getCtx().onWarning(getError('UNEXPECTED_INTERNAL_ERROR', new Error('Attempting to connect to existing browser for Cypress in Cypress which is not yet implemented for firefox')))
}

async function recordVideo (videoApi: RunModeVideoApi) {
  const { writeVideoFrame } = await videoApi.useFfmpegVideoController({ webmInput: true })

  videoApi.onProjectCaptureVideoFrames(writeVideoFrame)
}

export async function open (browser: Browser, url: string, options: BrowserLaunchOpts, automation: Automation): Promise<BrowserInstance> {
  // see revision comment here https://wiki.mozilla.org/index.php?title=WebDriver/RemoteProtocol&oldid=1234946
  const hasCdp = browser.majorVersion >= 86
  const defaultLaunchOptions = utils.getDefaultLaunchOptions({
    extensions: [] as string[],
    preferences: _.extend({}, defaultPreferences),
    args: [
      '-marionette',
      '-new-instance',
      '-foreground',
      '-start-debugger-server', // uses the port+host defined in devtools.debugger.remote
      '-no-remote', // @see https://github.com/cypress-io/cypress/issues/6380
    ],
  })

  let remotePort

  if (hasCdp) {
    remotePort = await getRemoteDebuggingPort()

    defaultLaunchOptions.args.push(`--remote-debugging-port=${remotePort}`)
  }

  if (browser.isHeadless) {
    defaultLaunchOptions.args.push('-headless')
    // we don't need to specify width/height since MOZ_HEADLESS_ env vars will be set
    // and the browser will spawn maximized. The user may still supply these args to override
    // defaultLaunchOptions.args.push('--width=1920')
    // defaultLaunchOptions.args.push('--height=1081')
  }

  debug('firefox open %o', options)

  const ps = options.proxyServer

  if (ps) {
    let { hostname, port, protocol } = urlUtil.parse(ps)

    if (port == null) {
      port = protocol === 'https:' ? '443' : '80'
    }

    _.extend(defaultLaunchOptions.preferences, {
      'network.proxy.allow_hijacking_localhost': true,
      'network.proxy.http': hostname,
      'network.proxy.ssl': hostname,
      'network.proxy.http_port': +port,
      'network.proxy.ssl_port': +port,
      'network.proxy.no_proxies_on': '',
      'browser.download.dir': os.platform() === 'win32' ? doubleEscape(options.downloadsFolder) : options.downloadsFolder,
    })
  }

  const ua = options.userAgent

  if (ua) {
    defaultLaunchOptions.preferences['general.useragent.override'] = ua
  }

  const [
    foxdriverPort,
    marionettePort,
  ] = await Promise.all([getPort(), getPort()])

  defaultLaunchOptions.preferences['devtools.debugger.remote-port'] = foxdriverPort
  defaultLaunchOptions.preferences['marionette.port'] = marionettePort

  debug('available ports: %o', { foxdriverPort, marionettePort })

  const [
    cacheDir,
    extensionDest,
    launchOptions,
  ] = await Promise.all([
    utils.ensureCleanCache(browser, options.isTextTerminal),
    utils.writeExtension(browser, options.isTextTerminal, options.proxyUrl, options.socketIoRoute),
    utils.executeBeforeBrowserLaunch(browser, defaultLaunchOptions, options),
    options.videoApi && recordVideo(options.videoApi),
  ])

  if (Array.isArray(launchOptions.extensions)) {
    launchOptions.extensions.push(extensionDest)
  } else {
    launchOptions.extensions = [extensionDest]
  }

  const profileDir = utils.getProfileDir(browser, options.isTextTerminal)

  const profile = new FirefoxProfile({
    destinationDirectory: profileDir,
  })

  debug('firefox directories %o', { path: profile.path(), cacheDir, extensionDest })

  const xulStorePath = path.join(profile.path(), 'xulstore.json')

  // if user has set custom window.sizemode pref or it's the first time launching on this profile, write to xulStore.
  if (!await fs.pathExists(xulStorePath)) {
    // this causes the browser to launch maximized, which chrome does by default
    // otherwise an arbitrary size will be picked for the window size
    // this will not have an effect after first launch in 'interactive' mode
    const sizemode = 'maximized'

    await fs.writeJSON(xulStorePath, { 'chrome://browser/content/browser.xhtml': { 'main-window': { 'width': 1280, 'height': 1024, sizemode } } })
  }

  launchOptions.preferences['browser.cache.disk.parent_directory'] = cacheDir
  for (const pref in launchOptions.preferences) {
    const value = launchOptions.preferences[pref]

    profile.setPreference(pref, value)
  }

  // TODO: fix this - synchronous FS operation
  profile.updatePreferences()

  const userCSSPath = path.join(profileDir, 'chrome')

  if (!await fs.pathExists(path.join(userCSSPath, 'userChrome.css'))) {
    try {
      await fs.mkdir(userCSSPath)
    } catch {
      // probably the folder already exists, this is fine
    }

    // if we're headed we change the yellow automation mode url bar back to a normal color
    //
    // if we're headless we use userCss to 'trick' the browser
    //  into having a consistent browser window size that's near-fullscreen
    //  however it unfortunately still leaves 1px of padding at the top)
    //  without this trick there would be ~74px of padding at the top instead of 1px.
    //
    // TODO: allow configuring userCss through launchOptions

    const userCss = options.browser.isHeadless ? FIREFOX_HEADLESS_USERCSS : FIREFOX_HEADED_USERCSS

    await fs.writeFile(path.join(profileDir, 'chrome', 'userChrome.css'), userCss)
  }

  launchOptions.args = launchOptions.args.concat([
    '-profile',
    profile.path(),
  ])

  debug('launch in firefox', { url, args: launchOptions.args })

  const browserInstance = launch(browser, 'about:blank', remotePort, launchOptions.args, {
    // sets headless resolution to 1280x720 by default
    // user can overwrite this default with these env vars or --height, --width arguments
    MOZ_HEADLESS_WIDTH: '1280',
    MOZ_HEADLESS_HEIGHT: '721',
    ...launchOptions.env,
  })

  try {
    browserCriClient = await firefoxUtil.setup({ automation, extensions: launchOptions.extensions, url, foxdriverPort, marionettePort, remotePort, onError: options.onError })

    if (os.platform() === 'win32') {
      // override the .kill method for Windows so that the detached Firefox process closes between specs
      // @see https://github.com/cypress-io/cypress/issues/6392
      return _createDetachedInstance(browserInstance, browserCriClient)
    }

    // monkey-patch the .kill method to that the CDP connection is closed
    const originalBrowserKill = browserInstance.kill

    browserInstance.kill = (...args) => {
      // Do nothing on failure here since we're shutting down anyway
      clearInstanceState()

      debug('closing firefox')

      return originalBrowserKill.apply(browserInstance, args)
    }
  } catch (err) {
    errors.throwErr('FIREFOX_COULD_NOT_CONNECT', err)
  }

  return browserInstance
}
