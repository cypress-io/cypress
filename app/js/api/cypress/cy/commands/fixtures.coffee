$Cypress.register "Fixtures", (Cypress, _, $, Promise) ->

  cache = {}

  fixturesRe = /^(fx:|fixture:)/

  clone = (obj) ->
    JSON.parse(JSON.stringify(obj))

  ## reset the cache whenever we
  ## completely stop
  Cypress.on "stop", ->
    cache = {}

  Cypress.addParentCommand
    fixture: (fixture, options = {}) ->
      ## always return a promise here
      ## to make our interface consistent
      ## for use by other code
      new Promise (resolve, reject) =>

        ## if we already have cached
        ## this fixture then just return it
        if resp = cache[fixture]
          ## clone the object first to prevent
          ## accidentally mutating the one in the cache
          return resolve clone(resp)

        Cypress.trigger "fixture", fixture, (response) =>
          if err = response.__error
            try
              @throwErr(err)
            catch e
              ## test that this properly catches
              ## the error and inserts a command
              reject(e)
          else
            ## add the fixture to the cache
            ## so it can just be returned next time
            cache[fixture] = response

            ## resolve the cloned response
            resolve clone(response)

  Cypress.Cy.extend
    matchesFixture: (fixture) ->
      fixturesRe.test(fixture)

    parseFixture: (fixture) ->
      fixture.replace(fixturesRe, "")