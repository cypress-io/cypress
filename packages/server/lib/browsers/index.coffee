_             = require("lodash")
fs            = require("fs-extra")
path          = require("path")
Promise       = require("bluebird")
log           = require("debug")("cypress:server:browsers")
utils         = require("./utils")
errors        = require("../errors")

fs              = Promise.promisifyAll(fs)
instance        = null

kill = (unbind) ->
  ## cleanup our running browser
  ## instance
  return Promise.resolve() if not instance

  new Promise (resolve) ->
    if unbind
      instance.removeAllListeners()

    instance.once("exit", resolve)

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

process.once "exit", kill

module.exports = {
  get: utils.getBrowsers

  launch: utils.launch

  close: kill

  getByName: (browser) ->
    utils.getBrowsers()
    .then (browsers = []) ->
      _.find(browsers, { name: browser })

  open: (name, options = {}, automation) ->
    kill(true)
    .then ->
      _.defaults(options, {
        onBrowserOpen: ->
        onBrowserClose: ->
      })

      if not browser = getBrowser(name)
        names = _.map(options.browsers, "name").join(", ")
        return errors.throw("BROWSER_NOT_FOUND", name, names)

      if not url = options.url
        throw new Error("options.url must be provided when opening a browser. You passed:", options)

      log("open browser %s", name)
      browser.open(name, url, options, automation)
      .then (i) ->
        log("browser opened")
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
