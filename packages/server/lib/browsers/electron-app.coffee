# launching an Electron application to be tested by Cypress
# is very similar to launching the Chrome browser
# with just extra flag to let the app know that Cypress wants to control it

debug = require("debug")("cypress:server:browsers")
R = require("ramda")
_ = require("lodash")
la = require("lazy-ass")
tough = require("tough-cookie")

chrome = require("./chrome")

# prevent messing Chrome's arguments by cloning the object
electronAppLauncher = R.clone(chrome)
_defaultArgs = electronAppLauncher.defaultArgs

# TODO find the Electron app and main.js equivalent file to launch
# something like "<electron path> ."

# TODO remove duplicate code, the cookie normalization taken from PR
# https://github.com/cypress-io/cypress/blob/1fdca23e446cfae6031ca7773ccaf9a8e8faa6f2/packages/server/lib/browsers/electron.coffee#L267

invokeViaDebugger = (message, data) ->
  global.remoteDebuggerClient.send(message, data)

normalizeGetCookieProps = (cookie) ->
  if cookie.expires == -1
    delete cookie.expires
  cookie.expirationDate = cookie.expires
  delete cookie.expires
  return cookie

normalizeGetCookies = (cookies) ->
  _.map(cookies, normalizeGetCookieProps)

normalizeSetCookieProps = (cookie) ->
  cookie.name or= "" ## name can't be undefined/null
  cookie.value or= "" ## ditto
  cookie.expires = cookie.expirationDate

  ## see Chromium's GetCookieDomainWithString for the logic here:
  ## https://cs.chromium.org/chromium/src/net/cookies/cookie_util.cc?l=120&rcl=1b63a4b7ba498e3f6d25ec5d33053d7bc8aa4404
  if !cookie.hostOnly and cookie.domain[0] != '.'
    parsedDomain = cors.parseDomain(cookie.domain)
    ## not a top-level domain (localhost, ...) or IP address
    if parsedDomain && parsedDomain.tld != cookie.domain
      cookie.domain = ".#{cookie.domain}"

  delete cookie.hostOnly
  delete cookie.expirationDate
  return cookie

getAllCookies = (data) ->
  invokeViaDebugger("Network.getAllCookies")
  .then (result) ->
    normalizeGetCookies(result.cookies)
    .filter (cookie) ->
      _.every([
        !data.domain || tough.domainMatch(cookie.domain, data.domain)
        !data.path || tough.pathMatch(cookie.path, data.path)
        !data.name || data.name == cookie.name
      ])

# TODO find the name and the version of the app from "package.json" file?
electronAppLauncher.name = "electron-app"
electronAppLauncher.open = (browser, url, options = {}, automation) ->
  # TODO overwrite the url to load with local host for experimentation
  # url = "http://localhost:5556/__/#/tests/integration/spec.js"

  # TODO pass actual discovered start file
  # pathToMainElectronFile = '.'
  pathToMainElectronFile = "/Users/gleb/git/cypress-example-electron/main.js"

  # cliArgs = R.clone(_defaultArgs)
  cliArgs = []
  cliArgs.push("--cypress-runner-url=#{url}")
  # cliArgs.push("--inspect=5858")
  electronAppLauncher.defaultArgs = cliArgs
  # pass the real url to load later
  options.loadUrl = url

  chrome.open.call(electronAppLauncher, browser, pathToMainElectronFile, options, automation)
  .tap () ->

    debug("checking if global debugger client has been created")
    la(global.remoteDebuggerClient, "missing global.remoteDebuggerClient")

    automation.use({
      onRequest: (message, data) ->
        console.log("automation message #{message}")
        switch message
          when "get:cookies"
            # TODO call either getCookies or getAllCookies
            # if data?.url
            #   return getCookiesByUrl(data.url)
            # getAllCookies(data)
            debug('get:cookies', data)
            return getAllCookies(data)
          when "clear:cookie"
            debug("clear:cookie", data)
            return global.remoteDebuggerClient.send("Network.deleteCookies", data)
          # when "clear:cookies"
          #   debug("clear:cookies", data)
            # return true
          when "is:automation:client:connected"
            console.log("is:automation:client:connected ?")
            return Boolean(global.remoteDebuggerClient)
          else
            throw new Error("No automation handler registered for: '#{message}'")
    })

module.exports = electronAppLauncher
