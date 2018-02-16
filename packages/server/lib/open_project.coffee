_         = require("lodash")
Promise   = require("bluebird")
files     = require("./controllers/files")
config    = require("./config")
Project   = require("./project")
browsers  = require("./browsers")
log       = require('./log')

create = ->
  openProject     = null
  specIntervalId  = null
  relaunchBrowser = null
  currentBrowser = null

  reset = ->
    openProject     = null
    relaunchBrowser = null

  tryToCall = (method) ->
    return (args...) ->
      if openProject
        openProject[method].apply(openProject, args)
      else
        Promise.resolve(null)

  return {
    reset: tryToCall("reset")

    getConfig: tryToCall("getConfig")

    createCiProject: tryToCall("createCiProject")

    getRecordKeys: tryToCall("getRecordKeys")

    getRuns: tryToCall("getRuns")

    requestAccess: tryToCall("requestAccess")

    emit: tryToCall("emit")

    getProject: -> openProject

    launch: (browserName, spec, options = {}) ->
      log("launching browser %s spec %s", browserName, spec)
      currentBrowser = browserName
      ## reset to reset server and socket state because
      ## of potential domain changes, request buffers, etc
      @reset()
      .then ->
        openProject.ensureSpecUrl(spec)
      .then (url) ->
        openProject.getConfig()
        .then (cfg) ->
          options.browsers          = cfg.browsers
          options.proxyUrl          = cfg.proxyUrl
          options.userAgent         = cfg.userAgent
          options.proxyServer       = cfg.proxyUrl
          options.socketIoRoute     = cfg.socketIoRoute
          options.chromeWebSecurity = cfg.chromeWebSecurity

          options.url = url

          automation = openProject.getAutomation()

          ## use automation middleware if its
          ## been defined here
          if am = options.automationMiddleware
            automation.use(am)

          do relaunchBrowser = ->
            log "launching project in browser #{browserName}"
            browsers.open(browserName, options, automation)

    getCurrentBrowser: (config) ->
      _.find(config.browsers, { name: currentBrowser })

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

      checkForSpecUpdates = =>
        if not openProject
          return @clearSpecInterval()

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

    clearSpecInterval: ->
      if specIntervalId
        clearInterval(specIntervalId)
        specIntervalId = null

    closeBrowser: ->
      currentBrowser = null
      browsers.close()

    closeOpenProjectAndBrowsers: ->
      Promise.all([
        @closeBrowser()
        openProject.close() if openProject
      ])
      .then ->
        reset()

        return null

    close:  ->
      log "closing opened project"
      @clearSpecInterval()
      @closeOpenProjectAndBrowsers()

    create: (path, args = {}, options = {}) ->
      ## store the currently open project
      openProject = Project(path)

      _.defaults(options, {
        onReloadBrowser: (url, browser) =>
          if relaunchBrowser
            relaunchBrowser()
      })

      options = _.extend {}, args.config, options

      browsers.get()
      .then (b = []) ->
        options.browsers = b

        ## open the project and return
        ## the config for the project instance
        log("opening project %s", path)
        openProject.open(options)
      .return(@)
  }

module.exports = create()
module.exports.Factory = create
