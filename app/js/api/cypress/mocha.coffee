do (Cypress, _, Mocha) ->

  runnerRun   = Mocha.Runner::run
  runnerFail  = Mocha.Runner::fail
  runnableRun = Mocha.Runnable::run

  Cypress.getMocha = ->
    @_mocha ? throw new Error("Cypress._mocha instance not found!")

  Cypress.Mocha = {
    create: ->
      ## we dont want the default global mocha instance on our window
      delete window.mocha

      ## instantiate mocha instance and hold onto this like runner does
      Cypress._mocha = new Mocha reporter: ->

      ## start up our overrides
      @override()

    set: (contentWindow) ->
      ## create our own mocha objects from our parents if its not already defined
      contentWindow.Mocha ?= Mocha
      contentWindow.mocha ?= Cypress.getMocha()

      @clone(contentWindow)

      ## this needs to be part of the configuration of eclectus.json
      ## we can't just forcibly use bdd
      @ui(contentWindow, "bdd")

    clone: (contentWindow) ->
      mocha = contentWindow.mocha

      ## remove all of the listeners from the previous root suite
      mocha.suite.removeAllListeners()

      ## We clone the outermost root level suite - and replace
      ## the existing root suite with a new one. this wipes out
      ## all references to hooks / tests / suites and thus
      ## prevents holding reference to old suites / tests
      mocha.suite = mocha.suite.clone()

    ui: (contentWindow, name) ->
      mocha = contentWindow.mocha

      ## Override mocha.ui so that the pre-require event is emitted
      ## with the iframe's `window` reference, rather than the parent's.
      mocha.ui = (name) ->
        @_ui = Mocha.interfaces[name]
        throw new Error('invalid interface "' + name + '"') if not @_ui
        @_ui = @_ui(@suite)
        @suite.emit 'pre-require', contentWindow, null, @
        return @

      mocha.ui name

    stop: ->
      ## remove any listeners from the mocha.suite
      Cypress.getMocha().suite.removeAllListeners()

      ## null it out to break any references
      Cypress.getMocha().suite = null

      ## delete the globals to cleanup memory
      delete Cypress._mocha

    restore: (items) ->
      @stop()

      @restoreRunnerRun()
      @restoreRunnerFail()
      @restoreRunnableRun()

      return @

    restoreRunnerRun: ->
      Mocha.Runner::run   = runnerRun

    restoreRunnerFail: ->
      Mocha.Runner::fail  = runnerFail

    restoreRunnableRun: ->
      Mocha.Runnable::run = runnableRun

    override: ->
      @patchRunnerRun()
      @patchRunnerFail()
      @patchRunnableRun()

      return @

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

        @fn = _.wrap @fn, (orig, args...) ->
          Cypress.on "enqueue", invokedCy

          unbind = ->
            Cypress.off "enqueue", invokedCy

          try
            ## call the original function with
            ## our called ctx (from mocha)
            ## and apply the new args in case
            ## we have a done callback
            result = orig.apply(@, args)

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
