$errUtils = require("../cypress/error_utils")

create = (state) ->
  return {
    timeout: (ms, delta = false) ->
      runnable = state("runnable")

      if not runnable
        $errUtils.throwErrByPath("miscellaneous.outside_test")

      if ms
        ## if delta is true then we add (or subtract) from the
        ## runnables current timeout instead of blanketingly setting it
        ms = if delta then runnable.timeout() + ms else ms
        runnable.timeout(ms)
        return @
      else
        runnable.timeout()

    clearTimeout: ->
      runnable = state("runnable")

      if not runnable
        $errUtils.throwErrByPath("miscellaneous.outside_test")

      runnable.clearTimeout()

      return @
  }

module.exports = {
  create
}
