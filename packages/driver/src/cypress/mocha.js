const $utils = require('./utils')

//# in the browser mocha is coming back
//# as window
const mocha = require('mocha')

/** @type {typeof mocha} */
const Mocha = mocha.Mocha != null ? mocha.Mocha : mocha
const { Test } = Mocha
const { Runner } = Mocha
const { Runnable } = Mocha

const SUITE_RUNNABLE_PROPS = ['_beforeAll', '_beforeEach', '_afterEach', '_afterAll', 'tests']

const testClone = Test.prototype.clone
const runnerRun = Runner.prototype.run
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

// const restoreTestClone = () => {
//   return Test.prototype.clone = testClone
// }

const restoreRunnableClearTimeout = () => {
  return Runnable.prototype.clearTimeout = runnableClearTimeout
}

const restoreRunnableResetTimeout = () => {
  return Runnable.prototype.resetTimeout = runnableResetTimeout
}

const restoreRunnerRun = () => {
  return Runner.prototype.run = runnerRun
}

//# matching the current Runner.prototype.fail except
//# changing the logic for determing whether this is a valid err
const overrideRunnerFail = (runner) => {
  // backup the original
  const { fail } = runner

  return runner.fail = function (runnable, err) {
    //# if this isnt a correct error object then just bail
    //# and call the original function
    if (Object.prototype.toString.call(err) !== '[object Error]') {
      return fail.call(this, runnable, err)
    }

    //# else replicate the normal mocha functionality
    ++this.failures

    runnable.state = 'failed'

    return this.emit('fail', runnable, err)
  }
}

const overrideRunnableRun = (runnable, onRunnableRun) => {
  runnable.run = function (...args) {

    // call the original onRunnableRun function
    // with the original runnable.run function,
    // the runnable itself, and the args
    // debugger

    return onRunnableRun(runnableRun, runnable, args)
  }

  // this happens when a test retries
  runnable.clone = function (...args) {
    if (this.trueFn) {
      this.fn = this.trueFn
    }

    const ret = testClone.apply(this, args)

    overrideRunnableRun(ret, onRunnableRun)

    ret.id = this.id

    delete ret.err

    return ret
  }
}

const overrideRunnerRunSuite = (runner, onRunnableRun) => {
  // backup the original
  const { runSuite } = runner

  // override each of the runnables own .run() method
  // and pass in the original so that the outside world
  // can control how these runnables run
  runner.runSuite = function (suite, fn) {
    // use a regular for loop for perf
    for (let i = 0; i < SUITE_RUNNABLE_PROPS.length; i++) {
      let prop = SUITE_RUNNABLE_PROPS[i]

      // find all the runnables for this particular prop
      let runnables = suite[prop]

      for (let j = 0; j < runnables.length; j++) {
        overrideRunnableRun(runnables[j], onRunnableRun)
      }
    }

    return runSuite.call(runner, suite, fn)
  }

}

const overrideRunnerRunTests = (runner) => {

  const _runTests = runner.runTests

  runner.runTests = function (...args) {

    const suite = args[0]

    const _slice = suite.tests.slice

    suite.tests.slice = function () {

      this.slice = _slice

      const ret = _slice.apply(this, arguments)

      suite.testsQueue = ret

      return ret
    }

    const ret = _runTests.apply(this, args)

    return ret
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
  restoreRunnableClearTimeout()

  return restoreRunnableResetTimeout()
}

const patch = function () {
  patchRunnableClearTimeout()

  return patchRunnableResetTimeout()
}

const create = function (specWindow, reporter) {
  restore()

  patch()

  //# generate the mocha + Mocha globals
  //# on the specWindow, and get the new
  //# _mocha instance
  const _mocha = globals(specWindow, reporter)

  const _runner = getRunner(_mocha)

  overrideRunnerFail(_runner)
  overrideRunnerRunTests(_runner)

  return {
    _mocha,

    onRunnableRun (onRunnableRun) {
      return overrideRunnerRunSuite(_runner, onRunnableRun)
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
