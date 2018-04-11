_ = require("lodash")
Promise = require("bluebird")

Screenshot = require("../../cypress/screenshot")
$utils = require("../../cypress/utils")

takeScreenshot = (runnable, name, options = {}) ->
  titles = []

  ## if this a hook then push both the current test title
  ## and our own hook title
  if runnable.type is "hook"
    if runnable.ctx and (ct = runnable.ctx.currentTest)
      titles.push(ct.title, runnable.title)
  else
    titles.push(runnable.title)

  if options.type
    if name
      name += " -- #{options.type}"
    else
      titles.push(options.type)

  getParentTitle = (runnable) ->
    if p = runnable.parent
      if t = p.title
        titles.unshift(t)

      getParentTitle(p)

  getParentTitle(runnable)

  props = {
    name: name
    titles: titles
    testId: runnable.id
    appOnly: options.appOnly
  }

  automate = ->
    Cypress.automation("take:screenshot", props)

  if not options.timeout
    automate()
  else
    ## need to remove the current timeout
    ## because we're handling timeouts ourselves
    cy.clearTimeout("take:screenshot")

    automate()
    .timeout(options.timeout)
    .catch (err) ->
      $utils.throwErr(err, { onFail: options.log })
    .catch Promise.TimeoutError, (err) ->
      $utils.throwErrByPath "screenshot.timed_out", {
        onFail: options.log
        args: {
          timeout: options.timeout
        }
      }

module.exports = (Commands, Cypress, cy, state, config) ->
  send = (event, props) ->
    new Promise (resolve) ->
      Cypress.action("cy:#{event}", props, resolve)

  beforeAll = (screenshotConfig) ->
    if screenshotConfig.disableTimersAndAnimations
      cy.pauseTimers(true)

    Screenshot.callBeforeScreenshot(state("document"))

    send("before:all:screenshots", {
      disableTimersAndAnimations: screenshotConfig.disableTimersAndAnimations
      blackout: screenshotConfig.blackout
    })

  afterAll = (screenshotConfig) ->
    Screenshot.callAfterScreenshot(state("document"))

    send("after:all:screenshots", {
      disableTimersAndAnimations: screenshotConfig.disableTimersAndAnimations
      blackout: screenshotConfig.blackout
    })

    if screenshotConfig.disableTimersAndAnimations
      cy.pauseTimers(false)

  prepAndTakeScreenshots = (screenshotConfig, runnable, name, options = {}) ->
    before = (capture) ->
      send("before:screenshot", {
        id: runnable.id
        isOpen: true
        appOnly: capture is "app"
        scale: if capture is "app" then screenshotConfig.scaleAppCaptures else true
        waitForCommandSynchronization: if capture is "runner" then screenshotConfig.waitForCommandSynchronization else false
      })

    after = (capture) ->
      send("after:screenshot", {
        id: runnable.id
        isOpen: false
        appOnly: capture is "app"
        scale: if capture is "app" then screenshotConfig.scaleAppCaptures else true
      })

    captures = _.map screenshotConfig.capture, (capture) ->
      -> ## intentionally returning a function
        type = if screenshotConfig.capture.length > 1 then capture else null

        before(capture)
        .then ->
          takeScreenshot(runnable, name, _.extend({}, options, {
            appOnly: capture is "app"
            type: type
          }))
        .finally ->
          after(capture)

    $utils.runSerially(captures)

  Cypress.on "runnable:after:run:async", (test, runnable) ->
    screenshotConfig = Screenshot.getConfig()
    ## we want to take a screenshot if we have an error, we're
    ## to take a screenshot and we are not interactive
    ## which means we're exiting at the end
    if test.err and screenshotConfig.screenshotOnRunFailure and not config("isInteractive")
      beforeAll(screenshotConfig)
      .then ->
        prepAndTakeScreenshots(screenshotConfig, runnable)

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

      screenshotConfig = _.pick(options, "capture", "scaleAppCaptures", "disableTimersAndAnimations", "blackout", "waitForCommandSynchronization")
      screenshotConfig = Screenshot.validate(screenshotConfig, "cy.screenshot", options._log)
      screenshotConfig = _.extend(Screenshot.getConfig(), screenshotConfig)

      if options.log
        consoleProps = {
          options: screenshotConfig
        }

        options._log = Cypress.log({
          message: name
          consoleProps: ->
            consoleProps
        })

      beforeAll(screenshotConfig)
      .then ->
        prepAndTakeScreenshots(screenshotConfig, runnable, name, {
          log: options._log
          timeout: options.timeout
        })
        .finally ->
          afterAll(screenshotConfig)
      .then (results) ->
        _.each results, ({ path, size }, i) ->
          capture = screenshotConfig.capture[i]
          _.extend(consoleProps, {
            "#{capture} Saved": path
            "#{capture} Size": size
          })
      .return(null)
  })
