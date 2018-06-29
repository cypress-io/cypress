_         = require("lodash")
la        = require("lazy-ass")
debug     = require("debug")("cypress:server:openproject")
Promise   = require("bluebird")
files     = require("./controllers/files")
config    = require("./config")
Project   = require("./project")
browsers  = require("./browsers")
specsUtil = require("./util/specs")
preprocessor = require("./plugins/preprocessor")

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
    reset: tryToCall("reset")

    getConfig: tryToCall("getConfig")

    createCiProject: tryToCall("createCiProject")

    getRecordKeys: tryToCall("getRecordKeys")

    getRuns: tryToCall("getRuns")

    requestAccess: tryToCall("requestAccess")

    emit: tryToCall("emit")

    getProject: -> openProject

    launch: (browser, spec, options = {}) ->
      debug("resetting project state, preparing to launch browser")

      la(_.isPlainObject(browser), "expected browser object:", browser)

      browserName = browser.name

      ## reset to reset server and socket state because
      ## of potential domain changes, request buffers, etc
      @reset()
      .then ->
        openProject.getSpecUrl(spec.absolute)
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

          options.isTextTerminal = cfg.isTextTerminal

          ## if we don't have the isHeaded property
          ## then we're in interactive mode and we
          ## can assume its a headed browser
          ## TODO: we should clean this up
          if not _.has(browser, "isHeaded")
            browser.isHeaded = true
            browser.isHeadless = false

          ## set the current browser object on options
          ## so we can pass it down
          options.browser = browser

          openProject.setCurrentSpecAndBrowser(spec, browser)

          automation = openProject.getAutomation()

          ## use automation middleware if its
          ## been defined here
          if am = options.automationMiddleware
            automation.use(am)

          automation.use({
            onBeforeRequest: (message, data) ->
              if message is "take:screenshot"
                data.specName = spec.name
                data
          })

          onBrowserClose = options.onBrowserClose
          options.onBrowserClose = ->
            if spec and spec.absolute
              preprocessor.removeFile(spec.absolute, cfg)

            if onBrowserClose
              onBrowserClose()

          do relaunchBrowser = ->
            debug(
              "launching browser: %s, spec: %s",
              browserName,
              spec.relative
            )

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
          specsUtil.find(cfg)
        .then (specs = []) ->
          ## TODO: put back 'integration' property
          ## on the specs
          return {
            integration: specs
          }

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
      debug("closing opened project")

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
        debug("opening project %s", path)

        openProject.open(options)
      .return(@)
  }

module.exports = create()
module.exports.Factory = create
