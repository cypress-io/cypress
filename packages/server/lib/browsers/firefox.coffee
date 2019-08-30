_ = require("lodash")
Promise = require("bluebird")
fs = Promise.promisifyAll(require("fs-extra"))
debug = require("debug")("cypress:server:browsers")
path = require("path")
urlUtil = require("url")
FirefoxProfile = require("firefox-profile")
webExt = require("web-ext").default
firefoxUtil = require("./firefox-util")

plugins = require("../plugins")
utils = require("./utils")

defaultPreferences = {
  "network.proxy.type": 1

  ## necessary for adding extensions
  "devtools.debugger.remote-enabled": true
  "devtools.debugger.prompt-connection": false
  # "devtools.debugger.remote-websocket": true
  "devtools.chrome.enabled": true
  ## http://hg.mozilla.org/mozilla-central/file/1dd81c324ac7/build/automation.py.in//l372
  ## Only load extensions from the application and user profile.
  ## AddonManager.SCOPE_PROFILE + AddonManager.SCOPE_APPLICATION
  "extensions.enabledScopes": 5
  ## Disable metadata caching for installed add-ons by default.
  "extensions.getAddons.cache.enabled": false
  ## Disable intalling any distribution add-ons.
  "extensions.installDistroAddons": false

  ## https://github.com/SeleniumHQ/selenium/blob/master/javascript/firefox-driver/webdriver.json
  "app.update.auto": false
  "app.update.enabled": false
  "browser.displayedE10SNotice": 4
  "browser.download.manager.showWhenStarting": false
  "browser.EULA.override": true
  "browser.EULA.3.accepted": true
  "browser.link.open_external": 2
  "browser.link.open_newwindow": 2
  "browser.offline": false
  "browser.reader.detectedFirstArticle": true
  "browser.safebrowsing.enabled": false
  "browser.safebrowsing.malware.enabled": false
  "browser.search.update": false
  "browser.selfsupport.url" : ""
  "browser.sessionstore.resume_from_crash": false
  "browser.shell.checkDefaultBrowser": false
  "browser.tabs.warnOnClose": false
  "browser.tabs.warnOnOpen": false
  "datareporting.healthreport.service.enabled": false
  "datareporting.healthreport.uploadEnabled": false
  "datareporting.healthreport.service.firstRun": false
  "datareporting.healthreport.logging.consoleEnabled": false
  "datareporting.policy.dataSubmissionEnabled": false
  "datareporting.policy.dataSubmissionPolicyAccepted": false
  "devtools.errorconsole.enabled": true
  "dom.disable_open_during_load": false
  "extensions.autoDisableScopes": 10
  "extensions.blocklist.enabled": false
  "extensions.checkCompatibility.nightly": false
  "extensions.logging.enabled": true
  "extensions.update.enabled": false
  "extensions.update.notifyUser": false
  "javascript.enabled": true
  "network.manage-offline-status": false
  "network.http.phishy-userpass-length": 255
  "offline-apps.allow_by_default": true
  "prompts.tab_modal.enabled": false
  "security.fileuri.origin_policy": 3
  "security.fileuri.strict_origin_policy": false
  "signon.rememberSignons": false
  "toolkit.networkmanager.disable": true
  "toolkit.telemetry.prompted": 2
  "toolkit.telemetry.enabled": false
  "toolkit.telemetry.rejected": true
  "xpinstall.signatures.required": false
  "xpinstall.whitelist.required": false
  "browser.dom.window.dump.enabled": true
  "browser.laterrun.enabled": false
  "browser.newtab.url": "about:blank"
  "browser.newtabpage.enabled": false
  "browser.startup.page": 0
  "browser.startup.homepage": "about:blank"
  "browser.startup.homepage_override.mstone": "ignore"
  "browser.usedOnWindows10.introURL": "about:blank"
  "dom.max_chrome_script_run_time": 30
  "dom.max_script_run_time": 30
  "dom.report_all_js_exceptions": true
  "javascript.options.showInConsole": true
  "network.captive-portal-service.enabled": false
  "security.csp.enable": false
  "startup.homepage_welcome_url": "about:blank"
  "startup.homepage_welcome_url.additional": "about:blank"
  "webdriver_accept_untrusted_certs": true
  "webdriver_assume_untrusted_issuer": true
}

module.exports = {
  send: firefoxUtil.send,

  open: (browserName, url, options = {}) ->
    preferences = _.extend({}, defaultPreferences)
    extensions = []

    debug('firefox open', options)
    if ps = options.proxyServer
      {hostname, port, protocol} = urlUtil.parse(ps)
      port ?= if protocol is "https:" then 443 else 80
      port = parseFloat(port)

      _.extend(preferences, {
        "network.proxy.allow_hijacking_localhost": true
        "network.proxy.http": hostname
        "network.proxy.ssl": hostname
        "network.proxy.http_port": port
        "network.proxy.ssl_port": port
        "network.proxy.no_proxies_on": ""
      })

    if ua = options.userAgent
      preferences["general.useragent.override"] = ua

    Promise
    .try ->
      return if not plugins.has("before:browser:launch")

      plugins.execute("before:browser:launch", options.browser, { preferences, extensions })
      .then (result) ->
        debug("got user args for 'before:browser:launch'", result)
        return if not result

        if _.isPlainObject(result.preferences)
          preferences = result.preferences
        if _.isArray(result.extensions)
          extensions = result.extensions
    .then ->
      Promise.all([
        utils.ensureCleanCache(browserName)
        utils.writeExtension(options.browser, options.visTextTerminal, options.proxyUrl, options.socketIoRoute)
        utils.ensureCleanCache(browserName)
      ])
    .spread (cacheDir, extensionDest, profileDir) ->
      extensions.push(extensionDest)

      profile = new FirefoxProfile({
        destinationDirectory: profileDir
      })
      debug("firefox profile dir:", profile.path())

      preferences["browser.cache.disk.parent_directory"] = cacheDir
      for pref, value of preferences
        profile.setPreference(pref, value)
      profile.updatePreferences()

      args = [
        "-profile"
        profile.path()
        "-marionette"
        "-new-instance"
        "-foreground"
      ]

      debug("launch in firefox: %s, %s", url, args)

      utils.launch(browserName, null, args)
    .then (browserInstance) ->
      firefoxUtil.setup(extensions, url)
      .then ->
        return browserInstance
    .catch (err) ->
      debug("launch error:", err.stack)
      throw err

}
