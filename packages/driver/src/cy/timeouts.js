const $errUtils = require('../cypress/error_utils')

const create = function (state) {
  return {
    timeout (ms, delta = false) {
      const runnable = state('runnable')

      if (!runnable) {
        $errUtils.throwErrByPath('miscellaneous.outside_test')
      }

      if (ms) {
        // if delta is true then we add (or subtract) from the
        // runnables current timeout instead of blanketingly setting it
        ms = delta ? runnable.timeout() + ms : ms
        runnable.timeout(ms)

        return this
      }

      return runnable.timeout()
    },

    clearTimeout () {
      const runnable = state('runnable')

      if (!runnable) {
        $errUtils.throwErrByPath('miscellaneous.outside_test')
      }

      runnable.clearTimeout()

      return this
    },
  }
}

module.exports = {
  create,
}
