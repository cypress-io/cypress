_         = require("lodash")
Promise   = require("bluebird")
files     = require("./controllers/files")
config    = require("./config")
errors    = require("./errors")
cache     = require("./cache")
Project   = require("./project")
browsers  = require("./browsers")

create = ->
  openProject     = null
  specIntervalId  = null
  relaunchBrowser = null

  reset = ->
    openProject     = null
    relaunchBrowser = null

  tryToCall = (method, args...) ->
    return ->
      if openProject
        openProject[method].apply(openProject, args)
      else
        Promise.resolve(null)

  return {
    getConfig: tryToCall("getConfig")

    createCiProject: tryToCall("createCiProject")

    getRecordKeys: tryToCall("getRecordKeys")

    getBuilds: tryToCall("getBuilds")

    requestAccess: tryToCall("requestAccess")

    getProject: -> openProject

    launch: (browserName, url, spec, options = {}) ->
      @reboot()
      .then ->
        openProject.getConfig()
      .then (cfg) ->
        if spec
          url = openProject.getUrlBySpec(cfg.browserUrl, spec)

        url                      ?= cfg.browserUrl
        options.proxyServer      ?= cfg.proxyUrl
        options.chromeWebSecurity = cfg.chromeWebSecurity

        options.url = url

        ## automation = openProject.getAutomation()

        do relaunchBrowser = ->
          browsers.open(browserName, openProject.automation, cfg, options)

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
      @clearSpecInterval()
      @closeOpenProjectAndBrowsers()

    reboot: -> Promise.resolve()

    create: (path, args = {}, options = {}) ->
      open = ->
        ## store the currently open project
        openProject = Project(path)

        ## open the project and return
        ## the config for the project instance
        openProject.open(options)

      _.defaults(options, {
        onReloadBrowser: (url, browser) =>
          if relaunchBrowser
            relaunchBrowser()
      })

      @reboot = ->
        @closeOpenProjectAndBrowsers()
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
