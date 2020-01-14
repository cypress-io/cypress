const $utils = require('./utils')

// in the browser mocha is coming back
// as window
const mocha = require('mocha')

const Mocha = mocha.Mocha != null ? mocha.Mocha : mocha
const { Test, Runner, Runnable } = Mocha

const runnerRun = Runner.prototype.run
const runnerFail = Runner.prototype.fail
const runnableRun = Runnable.prototype.run
const runnableClearTimeout = Runnable.prototype.clearTimeout
const runnableResetTimeout = Runnable.prototype.resetTimeout

// don't let mocha polute the global namespace
delete window.mocha
delete window.Mocha

const ui = (specWindow, _mocha) => {
  // Override mocha.ui so that the pre-require event is emitted
  // with the iframe's `window` reference, rather than the parent's.
  _mocha.ui = function (name) {
    this._ui = Mocha.interfaces[name]

    if (!this._ui) {
      $utils.throwErrByPath('mocha.invalid_interface', { args: { name } })
    }

    this._ui = this._ui(this.suite)

    // this causes the mocha globals in the spec window to be defined
    // such as describe, it, before, beforeEach, etc
    this.suite.emit('pre-require', specWindow, null, this)

    return this
  }

  return _mocha.ui('bdd')
}

const set = (specWindow, _mocha) => {
  // Mocha is usually defined in the spec when used normally
  // in the browser or node, so we add it as a global
  // for our users too
  const M = (specWindow.Mocha = Mocha)
  const m = (specWindow.mocha = _mocha)

  // also attach the Mocha class
  // to the mocha instance for clarity
  m.Mocha = M

  // this needs to be part of the configuration of cypress.json
  // we can't just forcibly use bdd
  return ui(specWindow, _mocha)
}

const globals = (specWindow, reporter) => {
  if (reporter == null) {
    reporter = () => {}
  }

  const _mocha = new Mocha({
    reporter,
    enableTimeouts: false,
  })

  // set mocha props on the specWindow
  set(specWindow, _mocha)

  // return the newly created mocha instance
  return _mocha
}

const getRunner = function (_mocha) {
  Runner.prototype.run = function () {
    // reset our runner#run function
    // so the next time we call it
    // its normal again!
    restoreRunnerRun()

    // return the runner instance
    return this
  }

  return _mocha.run()
}

const restoreRunnableClearTimeout = () => {
  Runnable.prototype.clearTimeout = runnableClearTimeout
}

const restoreRunnableResetTimeout = () => {
  Runnable.prototype.resetTimeout = runnableResetTimeout
}

const restoreRunnerRun = () => {
  Runner.prototype.run = runnerRun
}

const restoreRunnerFail = () => {
  Runner.prototype.fail = runnerFail
}

const restoreRunnableRun = () => {
  Runnable.prototype.run = runnableRun
}

// matching the current Runner.prototype.fail except
// changing the logic for determing whether this is a valid err
const patchRunnerFail = () => {
  Runner.prototype.fail = function (runnable, err) {
    // if this isnt a correct error object then just bail
    // and call the original function
    if (Object.prototype.toString.call(err) !== '[object Error]') {
      return runnerFail.call(this, runnable, err)
    }

    // else replicate the normal mocha functionality
    ++this.failures

    runnable.state = 'failed'

    this.emit('fail', runnable, err)
  }
}

const patchRunnableRun = (Cypress) => {
  Runnable.prototype.run = function (...args) {
    const runnable = this

    Cypress.action('mocha:runnable:run', runnableRun, runnable, args)
  }
}

const patchRunnableClearTimeout = () => {
  Runnable.prototype.clearTimeout = function (...args) {
    // call the original
    runnableClearTimeout.apply(this, args)

    this.timer = null
  }
}

const patchRunnableResetTimeout = () => {
  Runnable.prototype.resetTimeout = function () {
    const runnable = this

    const ms = this.timeout() || 1e9

    this.clearTimeout()

    const getErrPath = function () {
      // we've yield an explicit done callback
      if (runnable.async) {
        return 'mocha.async_timed_out'
      }

      // TODO: improve this error message. It's not that
      // a command necessarily timed out - in fact this is
      // a mocha timeout, and a command likely *didn't*
      // time out correctly, so we received this message instead.
      return 'mocha.timed_out'
    }

    this.timer = setTimeout(() => {
      const errMessage = $utils.errMessageByPath(getErrPath(), { ms })

      runnable.callback(new Error(errMessage))
      runnable.timedOut = true
    }, ms)
  }
}

const restore = () => {
  restoreRunnerRun()
  restoreRunnerFail()
  restoreRunnableRun()
  restoreRunnableClearTimeout()
  restoreRunnableResetTimeout()
}

const override = (Cypress) => {
  patchRunnerFail()
  patchRunnableRun(Cypress)
  patchRunnableClearTimeout()
  patchRunnableResetTimeout()
}

const create = (specWindow, Cypress, reporter) => {
  restore()

  override(Cypress)

  // generate the mocha + Mocha globals
  // on the specWindow, and get the new
  // _mocha instance
  const _mocha = globals(specWindow, reporter)

  const _runner = getRunner(_mocha)

  _mocha.suite.file = Cypress.spec.relative

  return {
    _mocha,

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
