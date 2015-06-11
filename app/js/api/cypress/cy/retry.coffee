do ($Cypress, _) ->

  $Cypress.Cy.extend
    _retry: (fn, options) ->
      ## remove the runnables timeout because we are now in retry
      ## mode and should be handling timing out ourselves and dont
      ## want to accidentally time out via mocha
      if not options.runnableTimeout
        prevTimeout = @_timeout()
        @_timeout(1e9)

      _.defaults options,
        runnableTimeout: prevTimeout
        start: new Date
        interval: 50
        retries: 0
        name: @prop("current")?.name

      ## we always want to make sure we timeout before our runnable does
      ## so take its current timeout, subtract the total time its already
      ## been running
      options.timeout ?= options.runnableTimeout - (new Date - @private("runnable").startedAt)

      ## we calculate the total time we've been retrying
      ## so we dont exceed the runnables timeout
      options.total = total = (new Date - options.start)

      ## increment retries
      options.retries += 1

      ## if our total exceeds the timeout OR the total + the interval
      ## exceed the runnables timeout, then bail
      @log "Retrying after: #{options.interval}ms. Total: #{total}, Timeout At: #{options.timeout}, RunnableTimeout: #{options.runnableTimeout}", "warning"

      if total >= options.timeout or (total + options.interval >= options.runnableTimeout)
        err = "Timed out retrying. " + options.error ? "The last command was: " + options.name
        @throwErr err, (options.onFail or options.command)

      Promise.delay(options.interval).cancellable().then =>
        @trigger "retry", options

        @log {name: "retry(#{options.name})", args: fn}

        ## invoke the passed in retry fn
        fn.call(@)