$Cypress.register "Screenshot", (Cypress, _, $, Promise, moment) ->

  Cypress.on "test:after:hooks", (test) ->
    if test.err and $Cypress.isHeadless and Cypress.config("screenshotOnHeadlessFailure")
      ## give the UI some time to render the error
      ## because we were noticing that errors were not
      ## yet displayed in the UI when running headlessly
      Promise.delay(75)
      .then =>
        @_takeScreenshot(test.title)

  Cypress.Cy.extend
    _takeScreenshot: (name, log, timeout) ->
      automate = ->
        new Promise (resolve, reject) ->
          fn = (resp) =>
            if e = resp.__error
              err = $Cypress.Utils.cypressErr(e)
              err.name = resp.__name
              err.stack = resp.__stack

              try
                $Cypress.Utils.throwErr(err, { onFail: log })
              catch e
                reject(e)
            else
              resolve(resp.response)

          Cypress.trigger("take:screenshot", name, fn)

      if not timeout
        automate()
      else
        ## need to remove the current timeout
        ## because we're handling timeouts ourselves
        @_clearTimeout()

        automate()
        .timeout(timeout)
        .catch Promise.TimeoutError, (err) ->
          $Cypress.Utils.throwErrByPath "screenshot.timed_out", {
            onFail: log
            args: {
              timeout: timeout
            }
          }

  Cypress.addParentCommand
    screenshot: (name, options = {}) ->
      if _.isObject(name)
        options = name
        name = null

      ## default to the runnables title if not set
      name ?= @private("runnable").title

      name = name.toString()

      _.defaults options, {
        log: true
        timeout: Cypress.config("responseTimeout")
      }

      if options.log
        consoleProps = {}

        options._log = Cypress.Log.command({
          message: name
          consoleProps: ->
            consoleProps
        })

      @_takeScreenshot(name, options._log, options.timeout)
      .then (resp) ->
        _.extend consoleProps, {
          Saved: resp.path
          Size: resp.size
        }
      .return(null)
