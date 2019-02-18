_ = require("lodash")
Promise = require("bluebird")

$dom = require("../../dom")
$utils = require("../../cypress/utils")
$Location = require("../../cypress/location")

COOKIE_PROPS = "name value path secure httpOnly expiry domain".split(" ")

commandNameRe = /(:)(\w)/

getCommandFromEvent = (event) ->
  event.replace commandNameRe, (match, p1, p2) ->
    p2.toUpperCase()

mergeDefaults = (obj) ->
  ## we always want to be able to see and influence cookies
  ## on our superdomain
  { superDomain } = $Location.create(window.location.href)
  # { hostname } = $Location.create(window.location.href)

  merge = (o) ->
    ## we are hostOnly if we dont have an
    ## explicit domain
    # o.hostOnly = !o.domain

    ## and if the user did not provide a domain
    ## then we know to set the default to be origin
    _.defaults o, {domain: superDomain}

  if _.isArray(obj)
    _.map(obj, merge)
  else
    merge(obj)

module.exports = (Commands, Cypress, cy, state, config) ->
  automateCookies = (event, obj = {}, log, timeout) ->
    automate = ->
      Cypress.automation(event, mergeDefaults(obj))
      .catch (err) ->
        $utils.throwErr(err, { onFail: log })

    if not timeout
      automate()
    else
      ## need to remove the current timeout
      ## because we're handling timeouts ourselves
      cy.clearTimeout(event)

      automate()
      .timeout(timeout)
      .catch Promise.TimeoutError, (err) ->
        $utils.throwErrByPath "cookies.timed_out", {
          onFail: log
          args: {
            cmd:     getCommandFromEvent(event)
            timeout: timeout
          }
        }

  getAndClear = (log, timeout) ->
    automateCookies("get:cookies", {}, log, timeout)
    .then (resp) =>
      ## bail early if we got no cookies!
      return resp if resp and resp.length is 0

      ## iterate over all of these and ensure none are whitelisted
      ## or preserved
      cookies = Cypress.Cookies.getClearableCookies(resp)

      automateCookies("clear:cookies", cookies, log, timeout)

  Cypress.on "test:start:async", ->
    ## TODO: handle failure here somehow
    ## maybe by tapping into the Cypress reset
    ## stuff, or handling this in the runner itself?
    getAndClear()

  Commands.addAll({
    getCookie: (name, options = {}) ->
      _.defaults options, {
        log: true
        timeout: config("responseTimeout")
      }

      if options.log
        options._log = Cypress.log({
          message: name
          displayName: "get cookie"
          consoleProps: ->
            obj = {}

            if c = options.cookie
              obj["Yielded"] = c
            else
              obj["Yielded"] = "null"
              obj["Note"] = "No cookie with the name: '#{name}' was found."

            obj
        })

      if not _.isString(name)
        $utils.throwErrByPath("getCookie.invalid_argument", { onFail: options._log })

      automateCookies("get:cookie", {name: name}, options._log, options.timeout)
      .then (resp) ->
        options.cookie = resp

        return resp

    getCookies: (options = {}) ->
      _.defaults options, {
        log: true
        timeout: config("responseTimeout")
      }

      if options.log
        options._log = Cypress.log({
          message: ""
          displayName: "get cookies"
          consoleProps: ->
            obj = {}

            if c = options.cookies
              obj["Yielded"] = c
              obj["Num Cookies"] = c.length

            obj
        })

      automateCookies("get:cookies", {}, options._log, options.timeout)
      .then (resp) ->
        options.cookies = resp

        return resp

    setCookie: (name, value, options = {}) ->
      _.defaults options, {
        name: name
        value: value
        path: "/"
        secure: false
        httpOnly: false
        log: true
        expiry: $utils.addTwentyYears()
        timeout: config("responseTimeout")
      }

      cookie = _.pick(options, COOKIE_PROPS)

      if options.log
        options._log = Cypress.log({
          message: [name, value]
          displayName: "set cookie"
          consoleProps: ->
            obj = {}

            if c = options.cookie
              obj["Yielded"] = c

            obj
        })

      if not _.isString(name) or not _.isString(value)
        $utils.throwErrByPath("setCookie.invalid_arguments", { onFail: options._log })

      automateCookies("set:cookie", cookie, options._log, options.timeout)
      .then (resp) ->
        options.cookie = resp

        return resp

    clearCookie: (name, options = {}) ->
      _.defaults options, {
        log: true
        timeout: config("responseTimeout")
      }

      if options.log
        options._log = Cypress.log({
          message: name
          displayName: "clear cookie"
          consoleProps: ->
            obj = {}

            obj["Yielded"] = "null"

            if c = options.cookie
              obj["Cleared Cookie"] = c
            else
              obj["Note"] = "No cookie with the name: '#{name}' was found or removed."

            obj
        })

      if not _.isString(name)
        $utils.throwErrByPath("clearCookie.invalid_argument", { onFail: options._log })

      ## TODO: prevent clearing a cypress namespace
      automateCookies("clear:cookie", {name: name}, options._log, options.timeout)
      .then (resp) ->
        options.cookie = resp

        ## null out the current subject
        return null

    clearCookies: (options = {}) ->
      _.defaults options, {
        log: true
        timeout: config("responseTimeout")
      }

      if options.log
        options._log = Cypress.log({
          message: ""
          displayName: "clear cookies"
          consoleProps: ->
            obj = {}

            obj["Yielded"] = "null"

            if (c = options.cookies) and c.length
              obj["Cleared Cookies"] = c
              obj["Num Cookies"] = c.length
            else
              obj["Note"] = "No cookies were found or removed."

            obj
        })

      getAndClear(options._log, options.timeout)
      .then (resp) ->
        options.cookies = resp

        ## null out the current subject
        return null
      .catch (err) ->
        ## make sure we always say to clearCookies
        err.message = err.message.replace("getCookies", "clearCookies")
        throw err
  })
