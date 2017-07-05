_ = require("lodash")
Promise = require("bluebird")
moment = require("moment")

$Cy = require("../../cypress/cy")
$Location = require("../../cypress/location")
$Log = require("../../cypress/log")
utils = require("../../cypress/utils")

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

getAndClear = (log, timeout) ->
  @_automateCookies("get:cookies", {}, log, timeout)
  .then (resp) =>
    ## bail early if we got no cookies!
    return resp if resp and resp.length is 0

    ## iterate over all of these and ensure none are whitelisted
    ## or preserved
    cookies = Cypress.Cookies.getClearableCookies(resp)
    @_automateCookies("clear:cookies", cookies, log, timeout)

$Cy.extend({
  _addTwentyYears: ->
    moment().add(20, "years").unix()

  _automateCookies: (event, obj = {}, log, timeout) ->
    automate = ->
      new Promise (resolve, reject) ->
        fn = (resp) ->
          if e = resp.__error
            err = utils.cypressErr(e)
            err.name = resp.__name
            err.stack = resp.__stack

            try
              utils.throwErr(err, { onFail: log })
            catch e
              reject(e)
          else
            resolve(resp.response)

        Cypress.trigger(event, mergeDefaults(obj), fn)

    if not timeout
      automate()
    else
      ## need to remove the current timeout
      ## because we're handling timeouts ourselves
      @_clearTimeout()

      automate()
      .timeout(timeout)
      .catch Promise.TimeoutError, (err) ->
        utils.throwErrByPath "cookies.timed_out", {
          onFail: log
          args: {
            cmd:     getCommandFromEvent(event)
            timeout: timeout
          }
        }
})

module.exports = (Cypress, Commands) ->
  Cypress.on "test:before:hooks", ->
    ## TODO: handle failure here somehow
    ## maybe by tapping into the Cypress reset
    ## stuff, or handling this in the runner itself?
    getAndClear.call(@)

  Commands.addAll({
    getCookie: (name, options = {}) ->
      _.defaults options, {
        log: true
        timeout: Cypress.config("responseTimeout")
      }

      if options.log
        options._log = $Log.command({
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
        utils.throwErrByPath("getCookie.invalid_argument", { onFail: options._log })

      @_automateCookies("get:cookie", {name: name}, options._log, options.timeout)
      .then (resp) ->
        options.cookie = resp

        return resp

    getCookies: (options = {}) ->
      _.defaults options, {
        log: true
        timeout: Cypress.config("responseTimeout")
      }

      if options.log
        options._log = $Log.command({
          message: ""
          displayName: "get cookies"
          consoleProps: ->
            obj = {}

            if c = options.cookies
              obj["Yielded"] = c
              obj["Num Cookies"] = c.length

            obj
        })

      @_automateCookies("get:cookies", {}, options._log, options.timeout)
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
        expiry: @_addTwentyYears()
        timeout: Cypress.config("responseTimeout")
      }

      cookie = _.pick(options, COOKIE_PROPS)

      if options.log
        options._log = $Log.command({
          message: [name, value]
          displayName: "set cookie"
          consoleProps: ->
            obj = {}

            if c = options.cookie
              obj["Yielded"] = c

            obj
        })

      if not _.isString(name) or not _.isString(value)
        utils.throwErrByPath("setCookie.invalid_arguments", { onFail: options._log })

      @_automateCookies("set:cookie", cookie, options._log, options.timeout)
      .then (resp) ->
        options.cookie = resp

        return resp

    clearCookie: (name, options = {}) ->
      _.defaults options, {
        log: true
        timeout: Cypress.config("responseTimeout")
      }

      if options.log
        options._log = $Log.command({
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
        utils.throwErrByPath("clearCookie.invalid_argument", { onFail: options._log })

      ## TODO: prevent clearing a cypress namespace
      @_automateCookies("clear:cookie", {name: name}, options._log, options.timeout)
      .then (resp) ->
        options.cookie = resp

        ## null out the current subject
        return null

    clearCookies: (options = {}) ->
      _.defaults options, {
        log: true
        timeout: Cypress.config("responseTimeout")
      }

      if options.log
        options._log = $Log.command({
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

      getAndClear.call(@, options._log, options.timeout, "clearCookies")
      .then (resp) ->
        options.cookies = resp

        ## null out the current subject
        return null
      .catch (err) ->
        ## make sure we always say to clearCookies
        err.message = err.message.replace("getCookies", "clearCookies")
        throw err
  })
