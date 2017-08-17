_ = require("lodash")
Promise = require("bluebird")

$Cy = require("../../cypress/cy")
utils = require("../../cypress/utils")

fixturesRe = /^(fx:|fixture:)/

clone = (obj) ->
  JSON.parse(JSON.stringify(obj))

module.exports = (Cypress, Commands) ->
  ## this is called at the beginning of run, so clear the cache
  cache = {}

  fixture = (fixture, options) =>
    new Promise (resolve) ->
      Cypress.trigger("fixture", fixture, options, resolve)

  Commands.addAll({
    fixture: (fx, args...) ->
      if Cypress.config("fixturesFolder") is false
        utils.throwErrByPath("fixture.set_to_false")

      ## if we already have cached
      ## this fixture then just return it

      ## always return a promise here
      ## to make our interface consistent
      ## for use by other code
      if resp = cache[fx]
        ## clone the object first to prevent
        ## accidentally mutating the one in the cache
        return Promise.resolve clone(resp)

      options = {}

      switch
        when _.isObject(args[0])
          options = args[0]

        when _.isObject(args[1])
          options = args[1]

        when _.isString(args[0])
          options.encoding = args[0]

      _.defaults options, {
        timeout: Cypress.config("responseTimeout")
      }

      ## need to remove the current timeout
      ## because we're handling timeouts ourselves
      @_clearTimeout()

      fixture(fx, options)
      .timeout(options.timeout)
      .then (response) =>
        if err = response.__error
          utils.throwErr(err)
        else
          ## add the fixture to the cache
          ## so it can just be returned next time
          cache[fx] = response

          ## return the cloned response
          return clone(response)
      .catch Promise.TimeoutError, (err) ->
        utils.throwErrByPath "fixture.timed_out", {
          args: { timeout: options.timeout }
        }
  })
