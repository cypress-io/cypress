Promise = require("bluebird")
fs = Promise.promisifyAll(require("fs-extra"))
debug = require("debug")("cypress:server:browsers")
path = require("path")
urlUtil = require("url")
FirefoxProfile = require("firefox-profile")
webExt = require("web-ext").default

utils = require("./utils")

preferences = {
  "network.proxy.type": 1

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
  open: (browserName, url, options = {}, automation) ->
    utils.writeExtension(options.proxyUrl, options.socketIoRoute)
    .then (extensionDest) ->
      if ps = options.proxyServer
        {hostname, port, protocol} = urlUtil.parse(ps)

        port ?= if protocol is "https:" then 443 else 80

        port = parseFloat(port)

        preferences["network.proxy.http"] = hostname
        preferences["network.proxy.https"] = hostname
        preferences["network.proxy.http_port"] = port
        preferences["network.proxy.https_port"] = port
        preferences["network.proxy.no_proxies_on"] = ''

      # new Promise (resolve) ->
      #   profile.addExtension extensionPath, ->
      #     resolve(profile)
    # .then ->
      profile = new FirefoxProfile()
      debug("firefox profile dir:", profile.path())

      # for pref, value of preferences
      #   profile.setPreference(pref, value)
      # profile.updatePreferences()

      args = [
        "-profile"
        profile.path()
      ]

      debug("launch in firefox: %s, %s", url, args)

      webExt.cmd.run({
        startUrl: url
        firefoxProfile: profile.path()
        sourceDir: extensionDest
        pref: preferences
        noInput: true ## keeps from messing up killing with ctrl-c in terminal
      })
    .then (runner) ->
      return {
        kill: ->
          runner.exit()
        removeAllListeners: ->
        once: (event, fn) ->
          if event is "exit"
            runner.registerCleanup(fn)
          else
            throw new Error("firefox instance does not fire '#{event}' event")
      }

      # utils.launch(browserName, url, args)

}
