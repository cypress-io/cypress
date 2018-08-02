_             = require("lodash")
path          = require("path")
Promise       = require("bluebird")
debug         = require("debug")("cypress:server:browsers")
utils         = require("./utils")
errors        = require("../errors")
fs            = require("../util/fs")

instance = null

kill = (unbind) ->
  ## cleanup our running browser
  ## instance
  return Promise.resolve() if not instance

  new Promise (resolve) ->
    if unbind
      instance.removeAllListeners()

    instance.once "exit", (code, sigint) ->
      debug("browser process killed")

      resolve.apply(null, arguments)

    debug("killing browser process")

    instance.kill()
    cleanup()

cleanup = ->
  instance = null

getBrowser = (name) ->
  switch name
    ## normalize all the chrome* browsers
    when "chrome", "chromium", "canary"
      require("./chrome")
    when "electron"
      require("./electron")

find = (browser, browsers = []) ->
  _.find(browsers, { name: browser })

ensureAndGetByName = (name) ->
  utils.getBrowsers()
  .then (browsers = []) ->
    find(name, browsers) or throwBrowserNotFound(name, browsers)

throwBrowserNotFound = (browser, browsers = []) ->
  names = _.map(browsers, "name").join(", ")
  errors.throw("BROWSER_NOT_FOUND", browser, names)

process.once "exit", kill

module.exports = {
  find

  ensureAndGetByName

  throwBrowserNotFound

  get: utils.getBrowsers

  launch: utils.launch

  close: kill

  open: (name, options = {}, automation) ->
    kill(true)
    .then ->
      _.defaults(options, {
        onBrowserOpen: ->
        onBrowserClose: ->
      })

      if not browser = getBrowser(name)
        return throwBrowserNotFound(name, options.browsers)

      if not url = options.url
        throw new Error("options.url must be provided when opening a browser. You passed:", options)

      debug("opening browser %s", name)

      browser.open(name, url, options, automation)
      .then (i) ->
        debug("browser opened")
        ## TODO: bind to process.exit here
        ## or move this functionality into cypress-core-launder

        instance = i

        ## TODO: normalizing opening and closing / exiting
        ## so that there is a default for each browser but
        ## enable the browser to configure the interface
        instance.once "exit", ->
          options.onBrowserClose()
          cleanup()

        ## TODO: instead of waiting an arbitrary
        ## amount of time here we could instead
        ## wait for the socket.io connect event
        ## which would mean that our browser is
        ## completely rendered and open. that would
        ## mean moving this code out of here and
        ## into the project itself
        ## (just like headless code)
        ## ----------------------------
        ## give a little padding around
        ## the browser opening
        Promise.delay(1000)
        .then ->
          options.onBrowserOpen()

          return instance

}
