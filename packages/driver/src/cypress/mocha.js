const $utils = require('./utils')

//# in the browser mocha is coming back
//# as window
const mocha = require('mocha')

const Mocha = mocha.Mocha != null ? mocha.Mocha : mocha
const { Test } = Mocha
const { Runner } = Mocha
const { Runnable } = Mocha

const testClone = Test.prototype.clone
const runnerRun = Runner.prototype.run
const runnerFail = Runner.prototype.fail
const runnableRun = Runnable.prototype.run
const runnableClearTimeout = Runnable.prototype.clearTimeout
const runnableResetTimeout = Runnable.prototype.resetTimeout

//# don't let mocha polute the global namespace
delete window.mocha
delete window.Mocha

const ui = function (specWindow, _mocha) {
  //# Override mocha.ui so that the pre-require event is emitted
  //# with the iframe's `window` reference, rather than the parent's.
  _mocha.ui = function (name) {
    this._ui = Mocha.interfaces[name]

    if (!this._ui) {
      $utils.throwErrByPath('mocha.invalid_interface', { args: { name } })
    }

    this._ui = this._ui(this.suite)

    //# this causes the mocha globals in the spec window to be defined
    //# such as describe, it, before, beforeEach, etc
    this.suite.emit('pre-require', specWindow, null, this)

    return this
  }

  return _mocha.ui('bdd')
}

const set = function (specWindow, _mocha) {
  //# Mocha is usually defined in the spec when used normally
  //# in the browser or node, so we add it as a global
  //# for our users too
  const M = (specWindow.Mocha = Mocha)
  const m = (specWindow.mocha = _mocha)

  //# also attach the Mocha class
  //# to the mocha instance for clarity
  m.Mocha = M

  //# this needs to be part of the configuration of cypress.json
  //# we can't just forcibly use bdd
  return ui(specWindow, _mocha)
}

const globals = function (specWindow, reporter) {
  if (reporter == null) {
    reporter = function () {}
  }

  const _mocha = new Mocha({
    reporter,
    enableTimeouts: false,
  })

  //# set mocha props on the specWindow
  set(specWindow, _mocha)

  //# return the newly created mocha instance
  return _mocha
}

const getRunner = function (_mocha) {
  Runner.prototype.run = function () {
    //# reset our runner#run function
    //# so the next time we call it
    //# its normal again!
    restoreRunnerRun()

    //# return the runner instance
    return this
  }

  return _mocha.run()
}

const restoreRunnableClearTimeout = () => {
  return Runnable.prototype.clearTimeout = runnableClearTimeout
}

const restoreRunnableResetTimeout = () => {
  return Runnable.prototype.resetTimeout = runnableResetTimeout
}

const restoreRunnerRun = () => {
  return Runner.prototype.run = runnerRun
}

const restoreRunnerFail = () => {
  return Runner.prototype.fail = runnerFail
}

const restoreRunnableRun = () => {
  return Runnable.prototype.run = runnableRun
}

const patchTestClone = () => {
  return Test.prototype.clone = function (...args) {
    if (this.trueFn) {
      this.fn = this.trueFn
    }

    const ret = testClone.apply(this, args)

    ret.id = this.id
    ret.err = null

    return ret
  }
}

//# matching the current Runner.prototype.fail except
//# changing the logic for determing whether this is a valid err
const patchRunnerFail = () => {
  return Runner.prototype.fail = function (runnable, err) {
    //# if this isnt a correct error object then just bail
    //# and call the original function
    if (Object.prototype.toString.call(err) !== '[object Error]') {
      return runnerFail.call(this, runnable, err)
    }

    //# else replicate the normal mocha functionality
    ++this.failures

    runnable.state = 'failed'

    return this.emit('fail', runnable, err)
  }
}

const patchRunnableRun = (Cypress) => {
  return Runnable.prototype.run = function (...args) {
    const runnable = this

    return Cypress.action('mocha:runnable:run', runnableRun, runnable, args)
  }
}

const patchRunnableClearTimeout = () => {
  return Runnable.prototype.clearTimeout = function (...args) {
  //# call the original
    runnableClearTimeout.apply(this, args)

    this.timer = null
  }
}

const patchRunnableResetTimeout = () => {
  return Runnable.prototype.resetTimeout = function () {
    const runnable = this

    const ms = this.timeout() || 1e9

    this.clearTimeout()

    const getErrPath = function () {
      //# we've yield an explicit done callback
      if (runnable.async) {
        return 'mocha.async_timed_out'
      }

      //# TODO: improve this error message. It's not that
      //# a command necessarily timed out - in fact this is
      //# a mocha timeout, and a command likely *didn't*
      //# time out correctly, so we received this message instead.
      return 'mocha.timed_out'

    }

    this.timer = setTimeout(() => {
      const errMessage = $utils.errMessageByPath(getErrPath(), { ms })

      runnable.callback(new Error(errMessage))
      runnable.timedOut = true
    }
      , ms)
  }
}

const restore = function () {
  restoreRunnerRun()
  restoreRunnerFail()
  restoreRunnableRun()
  restoreRunnableClearTimeout()

  return restoreRunnableResetTimeout()
}

const override = function (Cypress) {
  patchRunnerFail()
  patchRunnableRun(Cypress)
  patchRunnableClearTimeout()
  patchTestClone()

  return patchRunnableResetTimeout()
}

const create = function (specWindow, Cypress, reporter) {
  restore()

  override(Cypress)

  //# generate the mocha + Mocha globals
  //# on the specWindow, and get the new
  //# _mocha instance
  const _mocha = globals(specWindow, reporter)

  const _runner = getRunner(_mocha)

  return {
    _mocha,

    override () {
      return override(Cypress)
    },

    createRootTest (title, fn) {
      const r = new Test(title, fn)

      _runner.suite.addTest(r)

      return r
    },

    getRunner () {
      return _runner
    },

    getRootSuite () {
      return _mocha.suite
    },

    options (runner) {
      return runner.options(_mocha.options)
    },
  }
}

module.exports = {
  restore,

  globals,

  create,
}
