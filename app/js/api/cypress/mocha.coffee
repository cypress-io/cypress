do (Cypress, _, Mocha) ->

  runnerRun   = Mocha.Runner::run
  runnerFail  = Mocha.Runner::fail
  runnableRun = Mocha.Runnable::run

  Cypress.Mocha = {
    restore: ->
      Mocha.Runner::run   = runnerRun
      Mocha.Runner::fail  = runnerFail
      Mocha.Runnable::run = runnableRun

    override: ->
      @patchRunnerRun()
      @patchRunnerFail()
      @patchRunnableRun()

    patchRunnerRun: ->
      ## for the moment just hack this together by making
      ## this.suite lookup dynamic
      ## refactor this in the upcoming days as per notes
      ## on instantiating mocha + the runner on each test go-around
      ## instead of calling into runSuite directly
      ## expand the interface between the client app + Cypress.Mocha
      Mocha.Runner::run = _.wrap runnerRun, (orig, fn) ->
        _this = @

        ## create a new function which will
        ## actually invoke the original runner
        @startRunner = (fn2) ->
          fn = fn2 ? fn
          orig.call(_this, fn)

        return @

    patchRunnerFail: ->
      ## matching the current Mocha.Runner.prototype.fail except
      ## changing the logic for determing whether this is a valid err
      Mocha.Runner::fail = _.wrap runnerFail, (orig, test, err) ->
        ## if this isnt a correct error object then just bail
        ## and call the original function
        if Object.prototype.toString.call(err) isnt "[object Error]"
          return orig.call(@, test, err)

        ## else replicate the normal mocha functionality
        ++@failures

        test.state = "failed"

        @emit("fail", test, err)

    patchRunnableRun: ->
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
