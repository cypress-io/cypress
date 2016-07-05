/* global Mocha */

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

  overloadMochaRunnerUncaught () {
    return Mocha.Runner.prototype.uncaught = _.wrap(uncaught, function (orig, err) {
      if (!/(AssertionError|CypressError)/.test(err.name) && !err.__isMessage && !/SilenceError/.test(err.message)) {
        console.error(err.stack) // eslint-disable-line no-console
        debugger // eslint-disable-line no-debugger
      }
      return orig.call(this, err)
    })
  },
}
