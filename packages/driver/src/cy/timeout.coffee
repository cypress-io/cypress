utils = require("../cypress/utils")

module.exports = ($Cy) ->
  $Cy.extend
    _timeout: (ms, delta = false) ->
      runnable = @privateState("runnable")

      if not runnable
        utils.throwErrByPath("outside_test_with_cmd", { args: { cmd: "timeout" } })

      if ms
        ## if delta is true then we add (or subtract) from the
        ## runnables current timeout instead of blanketingly setting it
        ms = if delta then runnable.timeout() + ms else ms
        runnable.timeout(ms)
        return @
      else
        runnable.timeout()

    _clearTimeout: ->
      runnable = @privateState("runnable")

      if not runnable
        utils.throwErrByPath("outside_test_with_cmd", { args: { cmd: "clearTimeout" } })

      runnable.clearTimeout()

      return @
