_ = require("lodash")
$utils = require("./utils")

## in the browser mocha is coming back
## as window
mocha = require("mocha")

Mocha = mocha.Mocha ? mocha
Test = Mocha.Test
Runner = Mocha.Runner
Runnable = Mocha.Runnable

runnerRun            = Runner::run
runnerFail           = Runner::fail
runnableRun          = Runnable::run
runnableClearTimeout = Runnable::clearTimeout
runnableResetTimeout = Runnable::resetTimeout

## don't let mocha polute the global namespace
delete window.mocha
delete window.Mocha

ui = (specWindow, _mocha) ->
  ## Override mocha.ui so that the pre-require event is emitted
  ## with the iframe's `window` reference, rather than the parent's.
  _mocha.ui = (name) ->
    @_ui = Mocha.interfaces[name]

    if not @_ui
      $utils.throwErrByPath("mocha.invalid_interface", { args: { name } })

    @_ui = @_ui(@suite)

    ## this causes the mocha globals in the spec window to be defined
    ## such as describe, it, before, beforeEach, etc
    @suite.emit("pre-require", specWindow, null, @)

    return @

  _mocha.ui("bdd")

set = (specWindow, _mocha) ->
  ## Mocha is usually defined in the spec when used normally
  ## in the browser or node, so we add it as a global
  ## for our users too
  M = specWindow.Mocha = Mocha
  m = specWindow.mocha = _mocha

  ## also attach the Mocha class
  ## to the mocha instance for clarity
  m.Mocha = M

  ## this needs to be part of the configuration of cypress.json
  ## we can't just forcibly use bdd
  ui(specWindow, _mocha)

globals = (specWindow, reporter) ->
  reporter ?= ->

  _mocha = new Mocha({
    reporter: reporter
    enableTimeouts: false
  })

  ## set mocha props on the specWindow
  set(specWindow, _mocha)

  ## return the newly created mocha instance
  return _mocha

getRunner = (_mocha) ->
  Runner::run = ->
    ## reset our runner#run function
    ## so the next time we call it
    ## its normal again!
    restoreRunnerRun()

    ## return the runner instance
    return @

  _mocha.run()

restoreRunnableClearTimeout = ->
  Runnable::clearTimeout = runnableClearTimeout

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
  Runner::fail = (runnable, err) ->
    ## if this isnt a correct error object then just bail
    ## and call the original function
    if Object.prototype.toString.call(err) isnt "[object Error]"
      return runnerFail.call(@, runnable, err)

    ## else replicate the normal mocha functionality
    ++@failures

    runnable.state = "failed"

    @emit("fail", runnable, err)

patchRunnableRun = (Cypress) ->
  Runnable::run = (args...) ->
    runnable = @

    Cypress.action("mocha:runnable:run", runnableRun, runnable, args)

patchRunnableClearTimeout = ->
  Runnable::clearTimeout = ->
    ## call the original
    runnableClearTimeout.apply(@, arguments)

    ## nuke the timer property
    ## for testing purposes
    @timer = null

patchRunnableResetTimeout = ->
  Runnable::resetTimeout = ->
    runnable = @

    ms = @timeout() or 1e9

    @clearTimeout()

    getErrPath = ->
      ## we've yield an explicit done callback
      if runnable.async
        "mocha.async_timed_out"
      else
        ## TODO: improve this error message. It's not that
        ## a command necessarily timed out - in fact this is
        ## a mocha timeout, and a command likely *didn't*
        ## time out correctly, so we received this message instead.
        "mocha.timed_out"

    @timer = setTimeout ->
      errMessage = $utils.errMessageByPath(getErrPath(), { ms })
      runnable.callback new Error(errMessage)
      runnable.timedOut = true
    , ms

restore = ->
  restoreRunnerRun()
  restoreRunnerFail()
  restoreRunnableRun()
  restoreRunnableClearTimeout()
  restoreRunnableResetTimeout()

override = (Cypress) ->
  patchRunnerFail()
  patchRunnableRun(Cypress)
  patchRunnableClearTimeout()
  patchRunnableResetTimeout()

create = (specWindow, Cypress, reporter) ->
  restore()

  override(Cypress)

  ## generate the mocha + Mocha globals
  ## on the specWindow, and get the new
  ## _mocha instance
  _mocha = globals(specWindow, reporter)

  _runner = getRunner(_mocha)

  _mocha.suite.file = Cypress.spec.relative

  return {
    _mocha

    createRootTest: (title, fn) ->
      r = new Test(title, fn)
      _runner.suite.addTest(r)
      r

    getRunner: ->
      _runner

    getRootSuite: ->
      _mocha.suite

    options: (runner) ->
      runner.options(_mocha.options)
  }

module.exports = {
  restore

  globals

  create
}
