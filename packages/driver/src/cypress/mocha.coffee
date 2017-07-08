_ = require("lodash")
Backbone = require("backbone")
utils = require("./utils")

mocha = require("mocha")

## don't let mocha polute the global namespace
delete window.mocha

Mocha = mocha.Mocha ? mocha
Runner = Mocha.Runner
Runnable = Mocha.Runnable

runnerRun            = Runner::run
runnerFail           = Runner::fail
runnableRun          = Runnable::run
runnableResetTimeout = Runnable::resetTimeout

# listeners: ->
#   @listenTo @Cypress, "abort", =>
#     ## during abort we always want to reset
#     ## the mocha instance grep to all
#     ## so its picked back up by mocha
#     ## naturally when the iframe spec reloads
#     @grep /.*/
#
#   @listenTo @Cypress, "stop", => @stop()
#
#   return @

  grep: (re) ->
    @_mocha.grep(re)

ui = (specWindow, _mocha) ->
  ## Override mocha.ui so that the pre-require event is emitted
  ## with the iframe's `window` reference, rather than the parent's.
  _mocha.ui = (name) ->
    @_ui = Mocha.interfaces[name]

    if not @_ui
      utils.throwErrByPath("mocha.invalid_interface", { args: { name } })

    @_ui = @_ui(@suite)

    @suite.emit("pre-require", specWindow, null, @)

    return @

  _mocha.ui("bdd")

## TODO: is this necessary anymore?
## we create new mocha instances all the time
clone = (_mocha) ->
  ## remove all of the listeners from the previous root suite
  _mocha.suite.removeAllListeners()

  ## We clone the outermost root level suite - and replace
  ## the existing root suite with a new one. this wipes out
  ## all references to hooks / tests / suites and thus
  ## prevents holding reference to old suites / tests
  _mocha.suite = _mocha.suite.clone()

set = (specWindow, _mocha) ->
  ## create our own mocha objects from our parents if its not already defined
  ## Mocha is needed for the id generator
  # specWindow.Mocha ?= Mocha
  specWindow.mocha ?= _mocha

  clone(_mocha)

  ## this needs to be part of the configuration of cypress.json
  ## we can't just forcibly use bdd
  ui(specWindow, _mocha)

getRunner = (_mocha) ->
  Runner::run = ->
    ## reset our runner#run function
    ## so the next time we call it
    ## its normal again!
    restoreRunnerRun()

    ## return the runner instance
    return @

  _mocha.run()

restoreRunnableResetTimeout = ->
  Runnable::resetTimeout = runnableResetTimeout

restoreRunnerRun = ->
  Runner::run = runnerRun

restoreRunnerFail = ->
  Runner::fail = runnerFail

restoreRunnableRun = ->
  Runnable::run = runnableRun

patchRunnerFail = ->
  ## matching the current Runner.prototype.fail except
  ## changing the logic for determing whether this is a valid err
  Runner::fail = _.wrap runnerFail, (orig, runnable, err) ->
    ## if this isnt a correct error object then just bail
    ## and call the original function
    if Object.prototype.toString.call(err) isnt "[object Error]"
      return orig.call(@, runnable, err)

    ## else replicate the normal mocha functionality
    ++@failures

    runnable.state = "failed"

    @emit("fail", runnable, err)

patchRunnableRun = ->
  _this = @
  Cypress = @Cypress

  Runnable::run = _.wrap runnableRun, (orig, args...) ->

    runnable = @

    ## if cy was enqueued within the test
    ## then we know we should forcibly return cy
    invokedCy = _.once ->
      runnable._invokedCy = true

    @fn = _.wrap @fn, (orig, args...) ->
      _this.listenTo Cypress, "enqueue", invokedCy

      unbind = ->
        _this.stopListening Cypress, "enqueue", invokedCy
        runnable.fn = orig

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
          return Cypress.cy.state("chain")

        ## else return regular result
        return result
      catch e
        unbind()
        throw e

    orig.apply(@, args)

patchRunnableResetTimeout = ->
  Runnable::resetTimeout = _.wrap runnableResetTimeout, (orig) ->
    runnable = @

    ms = @timeout() or 1e9

    @clearTimeout()

    getErrPath = ->
      ## we've yield an explicit done callback
      if runnable.async
        "mocha.async_timed_out"
      else
        "mocha.timed_out"

    @timer = setTimeout ->
      errMessage = utils.errMessageByPath(getErrPath(), { ms })
      runnable.callback new Error(errMessage)
      runnable.timedOut = true
    , ms

restore = ->
  restoreRunnerRun()
  restoreRunnerFail()
  restoreRunnableRun()
  restoreRunnableResetTimeout()

override = ->
  patchRunnerFail()
  patchRunnableRun()
  patchRunnableResetTimeout()

create = (specWindow, ee, reporter) ->
  restore()

  override()

  reporter ?= ->

  _mocha = new Mocha({
    reporter: reporter
    enableTimeouts: false
  })

  _runner = getRunner(_mocha)

  ## set mocha props on the specWindow
  set(specWindow, _mocha)

  return {
    _mocha

    getRunner: ->
      _runner

    getRootSuite: ->
      _mocha.suite

    options: (runner) ->
      runner.options(_mocha.options)
  }

module.exports = {
  restore

  override

  set

  clone

  ui

  create
}
