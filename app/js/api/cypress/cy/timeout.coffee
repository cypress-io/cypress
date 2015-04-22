do ($Cypress, _) ->

  $Cypress.Cy.extend
    _timeout: (ms, delta = false) ->
      runnable = @prop("runnable")

      if not runnable
        @throwErr("Cannot call .timeout() without a currently running test!")

      if ms
        ## if delta is true then we add (or subtract) from the
        ## runnables current timeout instead of blanketingly setting it
        ms = if delta then runnable.timeout() + ms else ms
        runnable.timeout(ms)
        return @
      else
        runnable.timeout()

    _clearTimeout: ->
      runnable = @prop("runnable")

      if not runnable
        @throwErr("Cannot call .clearTimeout() without a currently running test!")

      runnable.clearTimeout()

      return @