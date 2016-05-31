import _ from 'lodash'

const runnableEmit = Mocha.Runnable.prototype.emit
const runnerEmit = Mocha.Runner.prototype.emit
const uncaught = Mocha.Runner.prototype.uncaught

export default {
  restore () {
    Mocha.Runnable.prototype.emit = runnableEmit
    Mocha.Runner.prototype.emit = runnerEmit
    return Mocha.Runner.prototype.uncaught = uncaught
  },

  overloadMochaRunnableEmit () {
    return Mocha.Runnable.prototype.emit = _.wrap(runnableEmit, function (orig, event, err) {
      switch (event) {
        case "error":
          throw err
        default:
      }
      return orig.call(this, event, err)
    })
  },

  overloadMochaRunnerUncaught () {
    return Mocha.Runner.prototype.uncaught = _.wrap(uncaught, function (orig, err) {
      if (!/(AssertionError|CypressError)/.test(err.name) && !err.__isMessage && !/SilenceError/.test(err.message)) {
        console.error(err.stack)
        debugger
      }
      return orig.call(this, err)
    })
  },
}
