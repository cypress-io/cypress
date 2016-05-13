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
    fixture: (fx) ->
      ## if we already have cached
      ## this fixture then just return it

      ## always return a promise here
      ## to make our interface consistent
      ## for use by other code
      if resp = cache[fx]
        ## clone the object first to prevent
        ## accidentally mutating the one in the cache
        return Promise.resolve clone(resp)

      fixture(fx).then (response) =>
        if err = response.__error
          @throwUnexpectedErr(err)
        else
          ## add the fixture to the cache
          ## so it can just be returned next time
          cache[fx] = response

          ## return the cloned response
          return clone(response)

  Cypress.Cy.extend
    matchesFixture: (fixture) ->
      fixturesRe.test(fixture)

    parseFixture: (fixture) ->
      fixture.replace(fixturesRe, "")
