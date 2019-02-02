_ = require("lodash")
Promise = require("bluebird")

$utils = require("../cypress/utils")

create = (Cypress, state, timeout, clearTimeout, whenStable, finishAssertions) ->
  return {
    retry: (fn, options, log) ->
      if options.error
        console.log(options.error)  
      ## remove the runnables timeout because we are now in retry
      ## mode and should be handling timing out ourselves and dont
      ## want to accidentally time out via mocha
      if not options._runnableTimeout
        runnableTimeout = options.timeout ? timeout()
        clearTimeout()

      current = state("current")

      ## use the log if passed in, else fallback to options._log
      ## else fall back to just grabbing the last log per our current command
      log ?= options._log ? current?.getLastLog()

      _.defaults(options, {
        _runnable: state("runnable")
        _runnableTimeout: runnableTimeout
        _interval: 16
        _retries: 0
        _start: new Date
        _name: current?.get("name")
      })

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
          finishAssertions(assertions)

        getErrMessage = (err) ->
          ## TODO: remove this debugging code
          if err.stack then console.log(err.stack.split('\n').slice(0,5).join('\n'))
          switch
            when err and err.displayMessage
              err.displayMessage
            when err and err.message
              err.message
            else
              err

        $utils.throwErrByPath "miscellaneous.retry_timed_out", {
          onFail: (options.onFail or log)
          args: { error: getErrMessage(options.error) }
        }

      runnableHasChanged = ->
        ## if we've changed runnables don't retry!
        options._runnable isnt state("runnable")

      ended = ->
        ## we should NOT retry if
        ## 1. our promise has been canceled
        ## 2. or we have an error
        ## 3. or if the runnables has changed

        ## although bluebird SHOULD cancel these retries
        ## since they're all connected - apparently they
        ## are not and the retry code is happening between
        ## runnables which is bad likely due to the issue below
        ##
        ## bug in bluebird with not propagating cancelations
        ## fast enough in a series of promises
        ## https://github.com/petkaantonov/bluebird/issues/1424
        state("canceled") or state("error") or runnableHasChanged()

      Promise
      .delay(interval)
      .then ->
        return if ended()

        Cypress.action("cy:command:retry", options)

        return if ended()

        ## if we are unstable then remove
        ## the start since we need to retry
        ## fresh once we become stable again!
        if state("isStable") is false
          options._start = undefined

        ## invoke the passed in retry fn
        ## once we reach stability
        whenStable(fn)
  }

module.exports = {
  create
}
