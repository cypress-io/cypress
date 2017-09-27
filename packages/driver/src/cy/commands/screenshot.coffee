_ = require("lodash")
Promise = require("bluebird")

$utils = require("../../cypress/utils")

takeScreenshot = (runnable, name, log, timeout) ->
  titles = []

  ## if this a hook then push both the current test title
  ## and our own hook title
  if runnable.type is "hook"
    if runnable.ctx and (ct = runnable.ctx.currentTest)
      titles.push(ct.title, runnable.title)
  else
    titles.push(runnable.title)

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
  Cypress.on "runnable:after:run:async", (test, runnable) ->
    ## we want to take a screenshot if we have an error, we're
    ## to take a screenshot and we are running from a terminal
    ## which means we're exiting at the end
    if test.err and config("screenshotOnHeadlessFailure") and config("isTextTerminal")

      new Promise (resolve) ->
        ## open up our test so we can see it during the screenshot
        test.isOpen = true

        Cypress.action "cy:test:set:state", test, ->
          takeScreenshot(runnable)
          .then(resolve)

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

      testState = (bool) ->
        return {
          id: runnable.id
          isOpen: bool
        }

      setTestState = (bool) ->
        new Promise (resolve) ->
          ## tell this test to open
          Cypress.action("cy:test:set:state", testState(bool), resolve)

      ## open the test for screenshot
      setTestState(true)
      .then ->
        takeScreenshot(runnable, name, options._log, options.timeout)
        .finally ->
          ## now close the test again no mattter what
          setTestState(false)
      .then (resp) ->
        _.extend consoleProps, {
          Saved: resp.path
          Size: resp.size
        }
      .return(null)
  })
