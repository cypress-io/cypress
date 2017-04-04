_         = require("lodash")
Promise   = require("bluebird")
extension = require("@cypress/core-extension")
# automation = require("./automation")
files     = require("../controllers/files")
config    = require("../config")
errors    = require("../errors")
cache     = require("../cache")
Project   = require("../project")
browsers  = require("../browsers")

## global reference to open objects
onRelaunch      = null
openProject     = null
openBrowser     = null
specIntervalId  = null
openBrowserOpts = null

module.exports = {
  open: (path, args = {}, options = {}) ->
    _.defaults options, {
      sync: true
      onReloadBrowser: (url, browser) =>
        @relaunch(url, browser)
    }

    options = _.extend {}, config.whitelist(args), options

    ## store the currently open project
    openProject = Project(path)

    browsers.get()
    .then (b = []) ->
      ## TODO: maybe if there are no
      ## browsers here we should just
      ## immediately close the server?
      ## but continue sending the config
      version = process.versions.chrome or ""
      electronBrowser = {
        name: "electron"
        version: version
        path: ""
        majorVersion: version.split(".")[0]
        info: "The Electron browser is the version of Chrome that is bundled with Electron. Cypress uses this browser when running headlessly, so it may be useful for debugging issues that occur only in headless mode."
      }
      options.browsers = b.concat(electronBrowser)
      # options.onAutomationRequest = launcher.onAutomationRequest

      ## open the project and return
      ## the config for the project instance
      openProject.open(options)
    .return(openProject)

  opened: -> openProject

  launch: (browser, url, spec, options = {}) ->
    openProject.getConfig()
    .then (cfg) ->
      if spec
        url = openProject.getUrlBySpec(cfg.browserUrl, spec)

      url            ?= cfg.browserUrl
      openBrowser     = browser
      openBrowserOpts = options
      options.proxyServer ?= cfg.proxyUrl
      options.chromeWebSecurity = cfg.chromeWebSecurity

      browsers.launch(browser, url, options)

  onRelaunch: (fn) ->
    onRelaunch = fn

  relaunch: (url, browser) ->
    if (b = browser) and onRelaunch
      onRelaunch({
        browser: b, url: url
      })
    else
      ## if we didnt specify a browser and
      ## theres not a currently open browser then bail
      return if not b = openBrowser

      ## assume there are openBrowserOpts
      browsers.launch(b, url, openBrowserOpts)

  reboot: ->
    @close({
      sync: false
      clearInterval: false
    })

  getSpecChanges: (options = {}) ->
    currentSpecs = null

    _.defaults(options, {
      onChange: ->
      onError: ->
    })

    sendIfChanged = (specs = []) ->
      ## dont do anything if the specs haven't changed
      return if _.isEqual(specs, currentSpecs)

      currentSpecs = specs
      options.onChange(specs)

    checkForSpecUpdates = ->
      get()
      .then(sendIfChanged)
      .catch(options.onError)

    get = ->
      Promise.try ->
        openProject.getConfig()
      .then (cfg) ->
        files.getTestFiles(cfg)

    specIntervalId = setInterval(checkForSpecUpdates, 2500)

    ## immediately check the first time around
    checkForSpecUpdates()

  changeToSpec: (spec) ->
    openProject.getConfig()
    .then (cfg) ->
      ## always reset the state when swapping specs
      ## so that our document.domain is reset back to <root>
      openProject.resetState()

      url = openProject.getUrlBySpec(cfg.browserUrl, spec)

      ## TODO: the problem here is that we really need
      ## an 'ack' event when changing the url because
      ## the runner may not even be connected, which
      ## in that case we need to open a new tab or
      ## spawn a new browser instance!
      openProject.changeToUrl(url)

  getBrowsers: ->
    ## always return an array of open browsers
    Promise.resolve(_.compact([openBrowser]))

  getRecordKeys: ->
    openProject.getRecordKeys()

  requestAccess: (projectId) ->
    openProject.requestAccess(projectId)

  createCiProject: (projectDetails) ->
    openProject.createCiProject(projectDetails)

  getBuilds: ->
    openProject.getBuilds()

  closeBrowser: ->
    browsers.close()

    if openProject
      openProject.resetState()

    openBrowser     = null
    openBrowserOpts = null

    Promise.resolve(null)

  close: (options = {}) ->
    _.defaults options, {
      sync: true
      clearInterval: true
    }

    nullify = ->
      ## null these back out
      onRelaunch      = null
      openProject     = null

      if options.clearInterval
        clearInterval(specIntervalId)
        specIntervalId  = null

      Promise.resolve(null)

    if not openProject
      nullify()
    else
      Promise.all([
        @closeBrowser()
        openProject.close(options)
      ])
      .then(nullify)
}
