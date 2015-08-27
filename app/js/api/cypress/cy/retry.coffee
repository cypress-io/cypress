do ($Cypress, _, Promise) ->

  $Cypress.Cy.extend
    _retry: (fn, options, command) ->
      ## remove the runnables timeout because we are now in retry
      ## mode and should be handling timing out ourselves and dont
      ## want to accidentally time out via mocha
      if not options._runnableTimeout
        runnableTimeout = options.timeout ? @_timeout()
        @_clearTimeout()

      command ?= options.command

      _.defaults options,
        _runnableTimeout: runnableTimeout
        start: new Date
        interval: 50
        retries: 0
        name: @prop("current")?.name

      ## we calculate the total time we've been retrying
      ## so we dont exceed the runnables timeout
      options.total = total = (new Date - options.start)

      ## increment retries
      options.retries += 1

      ## if our total exceeds the timeout OR the total + the interval
      ## exceed the runnables timeout, then bail
      @log "Retrying after: #{options.interval}ms. Total: #{total}, Timeout At: #{options._runnableTimeout}", "warning"

      if total + options.interval >= options._runnableTimeout
        ## snapshot the DOM since we are bailing
        ## so the user can see the state we're in
        ## when we fail
        command.snapshot() if command

        if assertions = options.assertions
          @finishAssertions(assertions)

        err = "Timed out retrying. " + options.error
        @throwErr err, (options.onFail or command)

      Promise.delay(options.interval).cancellable().then =>
        @trigger "retry", options

        @log {name: "retry(#{options.name})", args: fn}

        ## invoke the passed in retry fn
        fn.call(@)