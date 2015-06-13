$Cypress.register "Fixtures", (Cypress, _, $) ->

  cache = {}

  Cypress.addParentCommand
    fixture: (fixture, options = {}) ->
      ## if we already have cached
      ## this fixture then just return it
      if resp = cache[fixture]
        return resp

      new Promise (resolve, reject) =>

        Cypress.trigger "fixture", fixture, (response) =>
          if err = response.__error
            @throwErr(err)
          else
            ## add the fixture to the cache
            ## so it can just be returned next time
            cache[fixture] = response
            resolve(response)