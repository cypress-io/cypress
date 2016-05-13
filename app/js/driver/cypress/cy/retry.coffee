do ($Cypress, _, Promise) ->

  $Cypress.Cy.extend
    _retry: (fn, options, log) ->
      ## remove the runnables timeout because we are now in retry
      ## mode and should be handling timing out ourselves and dont
      ## want to accidentally time out via mocha
      if not options._runnableTimeout
        runnableTimeout = options.timeout ? @_timeout()
        @_clearTimeout()

      current = @prop("current")

      ## use the log if passed in, else fallback to options._log
      ## else fall back to just grabbing the last log per our current command
      log ?= options._log ? current?.getLastLog()

      _.defaults options,
        _runnableTimeout: runnableTimeout
        _interval: 16
        _retries: 0
        _start: new Date
        _name: current?.get("name")

      interval = options.interval ? options._interval

      ## we calculate the total time we've been retrying
      ## so we dont exceed the runnables timeout
      options.total = total = (new Date - options._start)

      ## increment retries
      options._retries += 1

      ## if our total exceeds the timeout OR the total + the interval
      ## exceed the runnables timeout, then bail
      if total + interval >= options._runnableTimeout
        ## snapshot the DOM since we are bailing
        ## so the user can see the state we're in
        ## when we fail
        log.snapshot() if log

        if assertions = options.assertions
          @finishAssertions(assertions)

        getErrMessage = (err) ->
          switch
            when err and err.longMessage
              err.longMessage
            when err and err.message
              err.message
            else
              err

        @throwErr "miscellaneous.retry_timed_out", {
          onFail: (options.onFail or log)
          args: { error: getErrMessage(options.error) }
        }

      Promise.delay(interval).cancellable().then =>
        @trigger("retry", options) unless options.silent is true

        ## invoke the passed in retry fn
        fn.call(@)
