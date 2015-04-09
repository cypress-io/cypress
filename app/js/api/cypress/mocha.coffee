$Cypress.Mocha = do ($Cypress, _, Mocha) ->

  runnerRun   = Mocha.Runner::run
  runnerFail  = Mocha.Runner::fail
  runnableRun = Mocha.Runnable::run

  class $Mocha
    constructor: (@Cypress, specWindow) ->
      @mocha = new Mocha reporter: ->

      @override()
      @listeners()

      @set(specWindow)

    override: ->
      ## these should probably be class methods
      ## since they alter the global Mocha and
      ## are not localized to this mocha instance
      @patchRunnerFail()
      @patchRunnableRun()

      return @

    listeners: ->
      @Cypress.on "abort", =>
        ## during abort we always want to reset
        ## the mocha instance grep to all
        ## so its picked back up by mocha
        ## naturally when the iframe spec reloads
        @grep /.*/

      @Cypress.on "stop", => @stop()

      return @

    ## pass our options down to the runner
    options: (runner) ->
      runner.options(@mocha.options)

    grep: (re) ->
      @mocha.grep(re)

    getRunner: ->
      _this = @

      Mocha.Runner::run = ->
        ## reset our runner#run function
        ## so the next time we call it
        ## its normal again!
        _this.restoreRunnerRun()

        ## return the runner instance
        return @

      @mocha.run()

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
      Cypress = @Cypress

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

    set: (contentWindow) ->
      ## create our own mocha objects from our parents if its not already defined
      ## Mocha is needed for the id generator
      contentWindow.Mocha ?= Mocha
      contentWindow.mocha ?= @mocha

      @clone(contentWindow)

      ## this needs to be part of the configuration of eclectus.json
      ## we can't just forcibly use bdd
      @ui(contentWindow, "bdd")

    clone: (contentWindow) ->
      mocha = contentWindow.mocha

      ## remove all of the listeners from the previous root suite
      @mocha.suite.removeAllListeners()

      ## We clone the outermost root level suite - and replace
      ## the existing root suite with a new one. this wipes out
      ## all references to hooks / tests / suites and thus
      ## prevents holding reference to old suites / tests
      @mocha.suite = mocha.suite.clone()

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
      @restore()

      ## remove any listeners from the mocha.suite
      @mocha.suite.removeAllListeners()

      ## null it out to break any references
      @mocha.suite = null

      @Cypress.mocha = null

      return @

    restore: ->
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

    @create = (Cypress, specWindow) ->
      ## we dont want the default global mocha instance on our window
      delete window.mocha
      Cypress.mocha = new $Mocha Cypress, specWindow

  return $Mocha