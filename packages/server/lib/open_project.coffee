_         = require("lodash")
la        = require("lazy-ass")
debug     = require("debug")("cypress:server:openproject")
Promise   = require("bluebird")
path      = require("path")
chokidar  = require("chokidar")
files     = require("./controllers/files")
config    = require("./config")
Project   = require("./project")
browsers  = require("./browsers")
specsUtil = require("./util/specs")
preprocessor = require("./plugins/preprocessor")

moduleFactory = ->
  openProject     = null
  relaunchBrowser = null
  specsWatcher    = null

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
              "launching browser: %o, spec: %s",
              browser,
              spec.relative
            )

            browsers.open(browser, options, automation)

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

      checkForSpecUpdates = _.debounce =>
        if not openProject
          return @stopSpecsWatcher()

        debug("check for spec updates")

        get()
        .then(sendIfChanged)
        .catch(options.onError)
      , 250, { leading: true }

      createSpecsWatcher = (cfg) ->
        return if specsWatcher

        debug("watch test files: %s in %s", cfg.testFiles, cfg.integrationFolder)

        specsWatcher = chokidar.watch(cfg.testFiles, {
          cwd: cfg.integrationFolder
          ignored: cfg.ignoreTestFiles
          ignoreInitial: true
        })
        specsWatcher.on("add", checkForSpecUpdates)
        specsWatcher.on("unlink", checkForSpecUpdates)

      get = ->
        openProject.getConfig()
        .then (cfg) ->
          createSpecsWatcher(cfg)
          specsUtil.find(cfg)
        .then (specs = []) ->
          ## TODO: put back 'integration' property
          ## on the specs
          return {
            integration: specs
          }

      ## immediately check the first time around
      checkForSpecUpdates()

    stopSpecsWatcher: ->
      debug("stop spec watcher")
      Promise.try ->
        specsWatcher?.close()

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

      @stopSpecsWatcher()
      @closeOpenProjectAndBrowsers()

    create: (path, args = {}, options = {}) ->
      debug("open_project create %s", path)
      debug("and options %o", options)

      ## store the currently open project
      openProject = Project(path)

      _.defaults(options, {
        onReloadBrowser: (url, browser) =>
          if relaunchBrowser
            relaunchBrowser()
      })

      if !_.isUndefined(args.configFile)
        options.configFile = args.configFile

      options = _.extend {}, args.config, options

      ## open the project and return
      ## the config for the project instance
      debug("opening project %s", path)
      debug("and options %o", options)

      openProject.open(options)
      .return(@)
  }

module.exports = moduleFactory()
module.exports.Factory = moduleFactory
