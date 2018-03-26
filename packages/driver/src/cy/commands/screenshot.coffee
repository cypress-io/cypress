_ = require("lodash")
Promise = require("bluebird")

Screenshot = require("../../cypress/screenshot")
$utils = require("../../cypress/utils")

takeScreenshot = (runnable, name, log, timeout, type) ->
  titles = []

  ## if this a hook then push both the current test title
  ## and our own hook title
  if runnable.type is "hook"
    if runnable.ctx and (ct = runnable.ctx.currentTest)
      titles.push(ct.title, runnable.title)
  else
    titles.push(runnable.title)

  if type
    if name
      name += " -- #{type}"
    else
      titles.push(type)

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
  send = (event, props) ->
    new Promise (resolve) ->
      Cypress.action("cy:#{event}", props, resolve)

  beforeAll = (runnable) ->
    screenshotConfig = Screenshot.getConfig()

    if screenshotConfig.disableTimersAndAnimations
      Cypress.action("cy:pause:timers", true)

    send("before:all:screenshots", {
      id: runnable.id
      isOpen: true
      disableTimersAndAnimations: screenshotConfig.disableTimersAndAnimations
      blackout: screenshotConfig.blackout
      waitForCommandSynchronization: screenshotConfig.waitForCommandSynchronization
    })

  afterAll = (runnable) ->
    screenshotConfig = Screenshot.getConfig()

    if screenshotConfig.disableTimersAndAnimations
      Cypress.action("cy:pause:timers", false)

    send("after:all:screenshots", {
      id: runnable.id
      isOpen: false
      disableTimersAndAnimations: screenshotConfig.disableTimersAndAnimations
      blackout: screenshotConfig.blackout
    })

  prepAndTakeScreenshots = (runnable, name, log, timeout) ->
    screenshotConfig = Screenshot.getConfig()

    before = (capture) ->
      send("before:screenshot", {
        appOnly: capture is "app"
        scale: if capture is "app" then screenshotConfig.scaleAppCaptures else true
      })

    after = (capture) ->
      send("after:screenshot", {
        appOnly: capture is "app"
        scale: if capture is "app" then screenshotConfig.scaleAppCaptures else true
      })

    captures = _.map screenshotConfig.capture, (capture) ->
      -> ## intentionally returning a function
        type = if screenshotConfig.capture.length > 1 then capture else null

        before(capture)
        .then ->
          takeScreenshot(runnable, name, log, timeout, type)
        .finally ->
          after(capture)

    $utils.runSerially(captures)

  Cypress.on "runnable:after:run:async", (test, runnable) ->
    screenshotConfig = Screenshot.getConfig()
    ## we want to take a screenshot if we have an error, we're
    ## to take a screenshot and we are not interactive
    ## which means we're exiting at the end
    if test.err and screenshotConfig.screenshotOnRunFailure and not config("isInteractive")
      beforeAll(test)
      .then ->
        prepAndTakeScreenshots(runnable)

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

      screenshotConfig = _.pick(options, "capture", "scaleAppCaptures", "disableTimersAndAnimations", "blackout", "waitForCommandSynchronization")
      screenshotConfig = Screenshot.validate(screenshotConfig, "cy.screenshot", options._log)
      screenshotConfig = _.extend(Screenshot.getConfig(), screenshotConfig)

      beforeAll(runnable)
      .then ->
        prepAndTakeScreenshots(runnable, name, options._log, options.timeout)
        .finally ->
          afterAll(runnable)
      .then (results) ->
        _.each results, ({ path, size }, i) ->
          capture = screenshotConfig.capture[i]
          _.extend(consoleProps, {
            "#{capture} Saved": path
            "#{capture} Size": size
          })
      .return(null)
  })
