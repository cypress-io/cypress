do (Cypress, _, chai) ->

  runnableRun = Mocha.Runnable::run

  Cypress.Mocha = {
    restore: ->
      Mocha.Runnable::run = runnableRun

    override: ->
      Mocha.Runnable::run = _.wrap runnableRun, (orig, args...) ->
        runnable = @

        ## if cy was enqueued within the test
        ## then we know we should forcibly return cy
        invokedCy = _.once ->
          runnable._invokedCy = true

        @fn = _.wrap @fn, (orig) ->
          Cypress.on "enqueue", invokedCy

          unbind = ->
            Cypress.off "enqueue", invokedCy

          try
            ## call the original function with
            ## our called ctx (from mocha)
            result = orig.call(@)

            unbind()

            ## if we invoked cy in this function
            ## then forcibly return last cy chain
            if runnable._invokedCy
              return Cypress.cy.prop("chain")

            ## else return regular result
            return result
          catch e
            unbind()
            throw e

        orig.apply(@, args)
  }
