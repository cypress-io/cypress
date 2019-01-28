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
    when "electron"
      require("./electron")
    else
      require("./chrome")

find = (browser, browsers = []) ->
  _.find(browsers, { name: browser })

ensureAndGetByPredicate = (predicate) ->
  utils.getBrowsers()
  .then (browsers = []) ->
    _.find(browsers, predicate) or throwBrowserNotFound(name, browsers)

throwBrowserNotFound = (browser, browsers = []) ->
  names = _.map(browsers, "name").join(", ")
  errors.throw("BROWSER_NOT_FOUND", browser, names)

process.once "exit", kill

module.exports = {
  find

  ensureAndGetByPredicate

  throwBrowserNotFound

  removeOldProfiles: utils.removeOldProfiles

  get: utils.getBrowsers

  launch: utils.launch

  close: kill

  open: (browser, options = {}, automation) ->
    kill(true)
    .then ->
      _.defaults(options, {
        onBrowserOpen: ->
        onBrowserClose: ->
      })

      if not browserHelper = getBrowser(browser.name)
        return throwBrowserNotFound(browser.name, options.browsers)

      if not url = options.url
        throw new Error("options.url must be provided when opening a browser. You passed:", options)

      debug("opening browser %o", browser)

      browserHelper.open(browser, url, options, automation)
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
