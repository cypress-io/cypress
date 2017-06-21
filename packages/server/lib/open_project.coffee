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
    getConfig: tryToCall("getConfig")

    createCiProject: tryToCall("createCiProject")

    getRecordKeys: tryToCall("getRecordKeys")

    getRuns: tryToCall("getRuns")

    requestAccess: tryToCall("requestAccess")

    getProject: -> openProject

    launch: (browserName, spec, options = {}) ->
      log("launching browser %s spec %s", browserName, spec)
      @reboot()
      .then ->
        openProject.ensureSpecUrl(spec)
      .then (url) ->
        openProject.getConfig()
        .then (cfg) ->
          options.proxyServer       = cfg.proxyUrl
          options.chromeWebSecurity = cfg.chromeWebSecurity

          options.url = url

          automation = openProject.getAutomation()

          ## use automation middleware if its
          ## been defined here
          if am = options.automationMiddleware
            automation.use(am)

          ## merge options into config
          ## without mutating cfg
          options = _.extend({}, cfg, options)

          do relaunchBrowser = ->
            log "launching project in browser #{browserName}"
            browsers.open(browserName, options, automation)

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

    reboot: -> Promise.resolve()

    create: (path, args = {}, options = {}) ->
      ## store the currently open project
      openProject = Project(path)

      _.defaults(options, {
        onReloadBrowser: (url, browser) =>
          if relaunchBrowser
            relaunchBrowser()
      })

      open = ->
        ## open the project and return
        ## the config for the project instance
        log("opening project %s", path)
        openProject.open(options)

      @reboot = ->
        openProject.close()
        .then(open)

      options = _.extend {}, config.whitelist(args), options

      browsers.get()
      .then (b = []) ->
        options.browsers = b

        open()
      .return(@)
  }

module.exports = create()
module.exports.Factory = create
