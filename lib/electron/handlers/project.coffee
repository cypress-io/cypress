_         = require("lodash")
Promise   = require("bluebird")
extension = require("@cypress/core-extension")
files     = require("../../controllers/files")
config    = require("../../config")
errors    = require("../../errors")
cache     = require("../../cache")
Project   = require("../../project")
launcher  = require("../../launcher")

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

    ## open the project and return
    ## the config for the project instance
    Promise.all([
      openProject.open(options)
      launcher.getBrowsers()
    ])
    .spread (project, browsers) ->
      ## TODO: maybe if there are no
      ## browsers here we should just
      ## immediately close the server?
      ## but continue sending the config
      Promise.all([
        project.setBrowsers(browsers)
        project.getConfig()
        .then (cfg) ->
          extension.setHostAndPath(cfg.clientUrlDisplay, cfg.socketIoRoute)
      ])
      .return(project)

  opened: -> openProject

  launch: (browser, url, spec, options = {}) ->
    openProject.getConfig()
    .then (cfg) ->
      if spec
        url = openProject.getUrlBySpec(cfg.clientUrl, spec)

      url            ?= cfg.clientUrl
      openBrowser     = browser
      openBrowserOpts = options
      options.proxyServer = cfg.clientUrlDisplay

      launcher.launch(browser, url, options)

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
      launcher.launch(b, url, openBrowserOpts)

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
      console.log currentSpecs, specs, _.isEqual(specs, currentSpecs), Math.random()

      return if _.isEqual(specs, currentSpecs)

      currentSpecs = specs
      options.onChange(specs)

    checkForSpecUpdates = ->
      get()
      .then(sendIfChanged)
      .catch(options.onError)

    get = ->
      openProject.getConfig()
      .then (cfg) ->
        files.getTestFiles(cfg)

    specIntervalId = setInterval(checkForSpecUpdates, 2500)

    ## immediately check the first time around
    checkForSpecUpdates()

  changeToSpec: (spec) ->
    openProject.getConfig()
    .then (cfg) ->
      url = openProject.getUrlBySpec(cfg.clientUrl, spec)

      ## TODO: the problem here is that we really need
      ## an 'ack' event when changing the url because
      ## the runner may not even be connected, which
      ## in that case we need to open a new tab or
      ## spawn a new browser instance!
      openProject.changeToUrl(url)

  getBrowsers: ->
    ## always return an array of open browsers
    Promise.resolve(_.compact([openBrowser]))

  closeBrowser: ->
    launcher.close()

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