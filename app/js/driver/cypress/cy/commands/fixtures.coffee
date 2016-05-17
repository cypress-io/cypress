$Cypress.register "Fixtures", (Cypress, _, $, Promise) ->

  cache = {}

  fixturesRe = /^(fx:|fixture:)/

  clone = (obj) ->
    JSON.parse(JSON.stringify(obj))

  fixture = (fixture) =>
    new Promise (resolve) ->
      Cypress.trigger "fixture", fixture, resolve

  ## reset the cache whenever we
  ## completely stop
  Cypress.on "stop", ->
    cache = {}

  Cypress.addParentCommand
    fixture: (fx, options = {}) ->
      ## if we already have cached
      ## this fixture then just return it

      ## always return a promise here
      ## to make our interface consistent
      ## for use by other code
      if resp = cache[fx]
        ## clone the object first to prevent
        ## accidentally mutating the one in the cache
        return Promise.resolve clone(resp)

      _.defaults options, {
        timeout: Cypress.config("responseTimeout")
      }

      ## need to remove the current timeout
      ## because we're handling timeouts ourselves
      @_clearTimeout()

      fixture(fx)
      .timeout(options.timeout)
      .then (response) =>
        if err = response.__error
          $Cypress.Utils.throwErr(err)
        else
          ## add the fixture to the cache
          ## so it can just be returned next time
          cache[fx] = response

          ## return the cloned response
          return clone(response)
      .catch Promise.TimeoutError, (err) ->
        $Cypress.Utils.throwErrByPath "fixture.timed_out", {
          args: { timeout: options.timeout }
        }

  Cypress.Cy.extend
    matchesFixture: (fixture) ->
      fixturesRe.test(fixture)

    parseFixture: (fixture) ->
      fixture.replace(fixturesRe, "")
