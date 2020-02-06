import _ from 'lodash'
import Bluebird from 'bluebird'
import fs from 'fs-extra'
import Debug from 'debug'
import getPort from 'get-port'
import path from 'path'
import urlUtil from 'url'
import FirefoxProfile from 'firefox-profile'
import firefoxUtil from './firefox-util'
import utils from './utils'
import { Browser } from './types'

const debug = Debug('cypress:server:browsers:firefox')

const defaultPreferences = {
  'network.proxy.type': 1,

  // necessary for adding extensions
  'devtools.debugger.remote-enabled': true,
  // bind foxdriver to 127.0.0.1
  'devtools.debugger.remote-host': '127.0.0.1',
  // devtools.debugger.remote-port is set per-launch

  'devtools.debugger.prompt-connection': false,
  // "devtools.debugger.remote-websocket": true
  'devtools.chrome.enabled': true,
  // http://hg.mozilla.org/mozilla-central/file/1dd81c324ac7/build/automation.py.in//l372
  // Only load extensions from the application and user profile.
  // AddonManager.SCOPE_PROFILE + AddonManager.SCOPE_APPLICATION
  'extensions.enabledScopes': 5,
  // Disable metadata caching for installed add-ons by default.
  'extensions.getAddons.cache.enabled': false,
  // Disable intalling any distribution add-ons.
  'extensions.installDistroAddons': false,

  'app.normandy.api_url': '',
  // https://github.com/SeleniumHQ/selenium/blob/master/javascript/firefox-driver/webdriver.json
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
  'browser.search.update': false,
  'browser.selfsupport.url': '',
  'browser.sessionstore.resume_from_crash': false,
  'browser.shell.checkDefaultBrowser': false,
  'browser.tabs.warnOnClose': false,
  'browser.tabs.warnOnOpen': false,
  'datareporting.healthreport.service.enabled': false,
  'datareporting.healthreport.uploadEnabled': false,
  'datareporting.healthreport.service.firstRun': false,
  'datareporting.healthreport.logging.consoleEnabled': false,
  'datareporting.policy.dataSubmissionEnabled': false,
  'datareporting.policy.dataSubmissionPolicyAccepted': false,
  'datareporting.policy.dataSubmissionPolicyBypassNotification': false,
  'devtools.errorconsole.enabled': true,
  'dom.disable_open_during_load': false,
  'extensions.autoDisableScopes': 10,
  'extensions.blocklist.enabled': false,
  'extensions.checkCompatibility.nightly': false,
  'extensions.logging.enabled': true,
  'extensions.update.enabled': false,
  'extensions.update.notifyUser': false,
  'javascript.enabled': true,
  'network.manage-offline-status': false,
  'network.http.phishy-userpass-length': 255,
  'offline-apps.allow_by_default': true,
  'prompts.tab_modal.enabled': false,
  'security.fileuri.origin_policy': 3,
  'security.fileuri.strict_origin_policy': false,
  'signon.rememberSignons': false,
  'toolkit.networkmanager.disable': true,
  'toolkit.telemetry.prompted': 2,
  'toolkit.telemetry.enabled': false,
  'toolkit.telemetry.rejected': true,
  'xpinstall.signatures.required': false,
  'xpinstall.whitelist.required': false,
  'browser.dom.window.dump.enabled': true,
  'browser.laterrun.enabled': false,
  'browser.newtab.url': 'about:blank',
  'browser.newtabpage.enabled': false,
  'browser.startup.page': 0,
  'browser.startup.homepage': 'about:blank',
  'browser.startup.homepage_override.mstone': 'ignore',
  'browser.usedOnWindows10.introURL': 'about:blank',
  'dom.max_chrome_script_run_time': 30,
  'dom.max_script_run_time': 30,
  'dom.report_all_js_exceptions': true,
  'javascript.options.showInConsole': true,
  'network.captive-portal-service.enabled': false,
  'security.csp.enable': false,
  'startup.homepage_welcome_url': 'about:blank',
  'startup.homepage_welcome_url.additional': 'about:blank',
  'webdriver_accept_untrusted_certs': true,
  'webdriver_assume_untrusted_issuer': true,
  // prevent going into safe mode after crash
  'toolkit.startup.max_resumed_crashes': -1,
  'toolkit.legacyUserProfileCustomizations.stylesheets': true,
  // setting to true hides system window bar, but causes weird resizing issues.
  'browser.tabs.drawInTitlebar': false,

  'geo.provider.testing': true,

  // allow playing videos w/o user interaction
  'media.autoplay.default': 0,

  'browser.safebrowsing.enabled': false,
  'browser.safebrowsing.blockedURIs.enabled': false,
  'browser.safebrowsing.downloads.enabled': false,
  'browser.safebrowsing.passwords.enabled': false,
  'browser.safebrowsing.malware.enabled': false,
  'browser.safebrowsing.phishing.enabled': false,

  // allow capturing screen through getUserMedia(...)
  // and auto-accept the permissions prompt
  'media.getusermedia.browser.enabled': true,
  'media.navigator.permission.disabled': true,

  'dom.min_background_timeout_value': 4,
  'dom.timeout.enable_budget_timer_throttling': false,

  'media.devices.insecure.enabled':	true,
  'media.getusermedia.insecure.enabled': true,
}

export async function open (browser: Browser, url, options: any = {}) {
  const defaultLaunchOptions = utils.getDefaultLaunchOptions({
    extensions: [] as string[],
    preferences: _.extend({}, defaultPreferences),
    args: [
      '-marionette',
      '-new-instance',
      '-foreground',
      '-start-debugger-server', // uses the port+host defined in devtools.debugger.remote
    ],
  })

  if (browser.isHeadless) {
    defaultLaunchOptions.args.push('-headless')
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
    })
  }

  const ua = options.userAgent

  if (ua) {
    defaultLaunchOptions.preferences['general.useragent.override'] = ua
  }

  const [
    foxdriverPort,
    marionettePort,
  ] = await Bluebird.all([getPort(), getPort()])

  defaultLaunchOptions.preferences['devtools.debugger.remote-port'] = foxdriverPort
  defaultLaunchOptions.preferences['marionette.port'] = marionettePort

  debug('available ports: %o', { foxdriverPort, marionettePort })

  const [
    cacheDir,
    extensionDest,
    launchOptions,
  ] = await Bluebird.all([
    utils.ensureCleanCache(browser, options.isTextTerminal),
    utils.writeExtension(browser, options.isTextTerminal, options.proxyUrl, options.socketIoRoute, options.onScreencastFrame),
    utils.executeBeforeBrowserLaunch(browser, defaultLaunchOptions, options),
  ])

  launchOptions.extensions.push(extensionDest)
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
  for (let pref in launchOptions.preferences) {
    const value = launchOptions.preferences[pref]

    profile.setPreference(pref, value)
  }

  // TODO: fix this - synchronous FS operation
  profile.updatePreferences()

  const userCSSPath = path.join(profileDir, 'chrome')

  if (!await fs.pathExists(path.join(userCSSPath, 'userChrome.css'))) {
    const userCss = `
    #urlbar:not(.megabar), #urlbar.megabar > #urlbar-background, #searchbar {
      background: -moz-Field !important;
      color: -moz-FieldText !important;
    }
  `

    try {
      await fs.mkdir(userCSSPath)
    } catch {
      // probably the folder already exists, this is fine
    }
    await fs.writeFile(path.join(profileDir, 'chrome', 'userChrome.css'), userCss)
  }

  launchOptions.args = launchOptions.args.concat([
    '-profile',
    profile.path(),
  ])

  debug('launch in firefox', { url, args: launchOptions.args })

  const browserInstance = await utils.launch(browser, 'about:blank', launchOptions.args)

  await firefoxUtil.setup({ extensions: launchOptions.extensions, url, foxdriverPort, marionettePort })

  return browserInstance
}
