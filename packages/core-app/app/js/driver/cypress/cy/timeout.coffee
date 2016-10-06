do ($Cypress, _) ->

  $Cypress.Cy.extend
    _timeout: (ms, delta = false) ->
      runnable = @private("runnable")

      if not runnable
        $Cypress.Utils.throwErrByPath("outside_test_with_cmd", { args: { cmd: "timeout" } })

      if ms
        ## if delta is true then we add (or subtract) from the
        ## runnables current timeout instead of blanketingly setting it
        ms = if delta then runnable.timeout() + ms else ms
        runnable.timeout(ms)
        return @
      else
        runnable.timeout()

    _clearTimeout: ->
      runnable = @private("runnable")

      if not runnable
        $Cypress.Utils.throwErrByPath("outside_test_with_cmd", { args: { cmd: "clearTimeout" } })

      runnable.clearTimeout()

      return @
