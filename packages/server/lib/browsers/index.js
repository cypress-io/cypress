_             = require("lodash")
path          = require("path")
Promise       = require("bluebird")
debug         = require("debug")("cypress:server:browsers")
pluralize     = require("pluralize")
utils         = require("./utils")
errors        = require("../errors")
fs            = require("../util/fs")
la            = require("lazy-ass")
check         = require("check-more-types")

# returns true if the passed string is a known browser family name
isBrowserFamily = check.oneOf(["electron", "chrome"])

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

getBrowserLauncherByFamily = (family) ->
  debug("getBrowserLauncherByFamily %o", { family })
  if not isBrowserFamily(family)
    debug("unknown browser family", family)

  switch family
    when "electron"
      require("./electron")
    when "chrome"
      require("./chrome")

isValidPathToBrowser = (str) ->
  path.basename(str) isnt str

ensureAndGetByNameOrPath = (nameOrPath, returnAll = false, browsers = null) ->
  findBrowsers = if Array.isArray(browsers) then Promise.resolve(browsers) else utils.getBrowsers()

  findBrowsers
  .then (browsers = []) ->
    debug("searching for browser %o", { nameOrPath, knownBrowsers: browsers })

    ## try to find the browser by name with the highest version property
    sortedBrowsers = _.sortBy(browsers, ['version'])
    if browser = _.findLast(sortedBrowsers, { name: nameOrPath })
      ## short circuit if found
      if returnAll
        return browsers
      return browser

    ## did the user give a bad name, or is this actually a path?
    if isValidPathToBrowser(nameOrPath)
      ## looks like a path - try to resolve it to a FoundBrowser
      return utils.getBrowserByPath(nameOrPath)
      .then (browser) ->
        if returnAll
          return [browser].concat(browsers)
        return browser
      .catch (err) ->
        errors.throw("BROWSER_NOT_FOUND_BY_PATH", nameOrPath, err.message)

    ## not a path, not found by name
    throwBrowserNotFound(nameOrPath, browsers)

throwBrowserNotFound = (browserName, browsers = []) ->
  names = _.map(browsers, "name").join(", ")
  errors.throw("BROWSER_NOT_FOUND_BY_NAME", browserName, names)

process.once "exit", kill

module.exports = {
  ensureAndGetByNameOrPath

  isBrowserFamily

  removeOldProfiles: utils.removeOldProfiles

  get: utils.getBrowsers

  launch: utils.launch

  close: kill

  getAllBrowsersWith: (nameOrPath) ->
    debug("getAllBrowsersWith %o", { nameOrPath })
    if nameOrPath
      return ensureAndGetByNameOrPath(nameOrPath, true)
    utils.getBrowsers()

  open: (browser, options = {}, automation) ->
    kill(true)
    .then ->
      _.defaults(options, {
        onBrowserOpen: ->
        onBrowserClose: ->
      })

      if not browserLauncher = getBrowserLauncherByFamily(browser.family)
        return throwBrowserNotFound(browser.name, options.browsers)

      if not url = options.url
        throw new Error("options.url must be provided when opening a browser. You passed:", options)

      debug("opening browser %o", browser)

      browserLauncher.open(browser, url, options, automation)
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
