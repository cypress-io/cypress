_ = require("lodash")
Promise = require("bluebird")

$errUtils = require("../../cypress/error_utils")

fixturesRe = /^(fx:|fixture:)/

clone = (obj) ->
  JSON.parse(JSON.stringify(obj))

module.exports = (Commands, Cypress, cy, state, config) ->
  ## this is called at the beginning of run, so clear the cache
  cache = {}

  reset = ->
    cache = {}

  Cypress.on("clear:fixtures:cache", reset)

  Commands.addAll({
    fixture: (fixture, args...) ->
      if config("fixturesFolder") is false
        $errUtils.throwErrByPath("fixture.set_to_false")

      ## if we already have cached
      ## this fixture then just return it

      ## always return a promise here
      ## to make our interface consistent
      ## for use by other code
      if resp = cache[fixture]
        ## clone the object first to prevent
        ## accidentally mutating the one in the cache
        return Promise.resolve(clone(resp))

      options = {}

      switch
        when _.isObject(args[0])
          options = args[0]

        when _.isObject(args[1])
          options = args[1]

      if _.isString(args[0])
        options.encoding = args[0]

      timeout = options.timeout ? Cypress.config("responseTimeout")

      ## need to remove the current timeout
      ## because we're handling timeouts ourselves
      cy.clearTimeout("get:fixture")

      Cypress.backend("get:fixture", fixture, _.pick(options, "encoding"))
      .timeout(timeout)
      .then (response) =>
        if err = response.__error
          $errUtils.throwErr(err)
        else
          ## add the fixture to the cache
          ## so it can just be returned next time
          cache[fixture] = response

          ## return the cloned response
          return clone(response)
      .catch Promise.TimeoutError, (err) ->
        $errUtils.throwErrByPath "fixture.timed_out", {
          args: { timeout }
        }
  })
