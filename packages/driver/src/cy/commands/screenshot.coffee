_ = require("lodash")
Promise = require("bluebird")

$Log = require("../../cypress/log")
$utils = require("../../cypress/utils")

takeScreenshot = (runnable, name, log, timeout) ->
  titles = [runnable.title]

  getParentTitle = (runnable) ->
    if p = runnable.parent
      if t = p.title
        titles.unshift(t)

      getParentTitle(p)

  getParentTitle(runnable)

  props = {
    name:   name
    titles: titles
    testId: runnable.id
  }

  automate = ->
    Cypress.automation("take:screenshot", props)

  if not timeout
    automate()
  else
    ## need to remove the current timeout
    ## because we're handling timeouts ourselves
    cy.clearTimeout("take:screenshot")

    automate()
    .timeout(timeout)
    .catch (err) ->
      $utils.throwErr(err, { onFail: log })
    .catch Promise.TimeoutError, (err) ->
      $utils.throwErrByPath "screenshot.timed_out", {
        onFail: log
        args: {
          timeout: timeout
        }
      }

module.exports = (Commands, Cypress, cy, state, config) ->
  Cypress.on "test:after:hooks", (test, runnable) ->
    if test.err and config("screenshotOnHeadlessFailure") and not config("isInteractive")
      ## give the UI some time to render the error
      ## because we were noticing that errors were not
      ## yet displayed in the UI when running headlessly
      Promise.delay(75)
      .then =>
        takeScreenshot(runnable)

  Commands.addAll({
    screenshot: (name, options = {}) ->
      if _.isObject(name)
        options = name
        name = null

      ## TODO: handle hook titles
      runnable = state("runnable")

      _.defaults options, {
        log: true
        timeout: config("responseTimeout")
      }

      if options.log
        consoleProps = {}

        options._log = Cypress.log({
          message: name
          consoleProps: ->
            consoleProps
        })

      takeScreenshot(runnable, name, options._log, options.timeout)
      .then (resp) ->
        _.extend consoleProps, {
          Saved: resp.path
          Size: resp.size
        }
      .return(null)
  })
