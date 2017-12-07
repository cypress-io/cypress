_             = require("lodash")
fs            = require("fs-extra")
path          = require("path")
Promise       = require("bluebird")
log           = require("debug")("cypress:server:browsers")
utils         = require("./utils")
errors        = require("../errors")
la            = require("lazy-ass")
check         = require("check-more-types")
treeKill      = require("tree-kill")

fs              = Promise.promisifyAll(fs)
instance        = null

kill = (unbind) ->
  log("killing browser instance")

  ## cleanup our running browser
  ## instance
  if not instance
    log("there is no browser instance")
    return Promise.resolve()

  new Promise (resolve) ->
    if unbind
      log("removing all listeners")
      instance.removeAllListeners()

    instance.once("exit", (x) ->
      log("browser instance on exit in kill")
      resolve(x)
    )

    la(check.number(instance.pid), "browser instance without PID", instance)
    log("sending kill signal to the instance", instance.pid)
    treeKill(instance.pid)
    cleanup()

cleanup = ->
  instance = null

getBrowser = (name) ->
  la(check.unemptyString(name), "missing browser name", name)
  switch name
    ## normalize all the chrome* browsers
    when "chrome", "chromium", "canary"
      require("./chrome")
    when "electron"
      require("./electron")
    else
      log("will run browser %s as Chrome", name)
      require("./chrome")

process.once "exit", kill

module.exports = {
  get: utils.getBrowsers

  launch: utils.launch

  close: kill

  getByName: (browser) ->
    if not browser
      return Promise.resolve()

    la(check.unemptyString(browser), "missing browser name", browser)
    log("getting browser by name", browser)

    utils.getBrowsers(browser)
    .then (browsers = []) ->
      log("utils returned browsers", browsers)
      _.find(browsers, { name: browser })

  open: (name, options = {}, automation) ->
    log("open browser by name", name)
    la(check.unemptyString(name), "missing browser name", name)

    kill(true)
    .then ->
      _.defaults(options, {
        browserArgs: []
        onBrowserOpen: ->
        onBrowserClose: ->
      })

      throwNotFoundError = () ->
        log("could not find browser by name", name)
        log("options.browsers has")
        log(options.browsers)
        names = _.map(options.browsers, "name").join(", ")
        return errors.throw("BROWSER_NOT_FOUND", name, names)

      if not browser = getBrowser(name)
        throwNotFoundError()

      if not url = options.url
        throw new Error("options.url must be provided when opening a browser. You passed:", options)

      log("open browser %s", name)

      onBrowserFailedToLaunch = (e) ->
        # we assume that the browser launch failed because it was not found
        log("browser failed to launch")
        log(e)
        throwNotFoundError()

      onBrowserLaunched = (i) ->
        if not i
          log("did not get an instance of browser", name)
          return errors.throw("BROWSER_DID_NOT_OPEN", name)

        log("browser opened", i)
        ## TODO: bind to process.exit here
        ## or move this functionality into cypress-core-launder
        instance = i

        ## TODO: normalizing opening and closing / exiting
        ## so that there is a default for each browser but
        ## enable the browser to configure the interface
        instance.once "exit", ->
          log("browser instance on exit")
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

      browser.open(name, url, options, automation)
      .then onBrowserLaunched, onBrowserFailedToLaunch

}
