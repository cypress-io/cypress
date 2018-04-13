_ = require("lodash")
Promise = require("bluebird")

Screenshot = require("../../cypress/screenshot")
$utils = require("../../cypress/utils")

automateScreenshot = (options = {}) ->
  {
    runnable
    name
    log
    timeout
    appOnly
    viewport
  } = options

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
    name: name
    titles: titles
    testId: runnable.id
    appOnly: appOnly
    viewport: viewport
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
        args: { timeout }
      }

takeScreenshot = (Cypress, state, screenshotConfig, options = {}) ->
  {
    blackout
    capture
    disableTimersAndAnimations
    scaleAppCaptures
    waitForCommandSynchronization
  } = screenshotConfig

  { runnable } = options

  appOnly = capture is "app"

  send = (event, props) ->
    new Promise (resolve) ->
      Cypress.action("cy:#{event}", props, resolve)

  getOptions = (isOpen) ->
    {
      id: runnable.id
      isOpen: isOpen
      appOnly: appOnly
      scale: if appOnly then scaleAppCaptures else true
      waitForCommandSynchronization: if not appOnly then waitForCommandSynchronization else false
      disableTimersAndAnimations: disableTimersAndAnimations
      blackout: blackout
    }

  before = (capture) ->
    if disableTimersAndAnimations
      cy.pauseTimers(true)

    Screenshot.callBeforeScreenshot(state("document"))

    send("before:screenshot", getOptions(true))

  after = (capture) ->
    send("after:screenshot", getOptions(false))

    Screenshot.callAfterScreenshot(state("document"))

    if disableTimersAndAnimations
      cy.pauseTimers(false)

  before(capture)
  .then ->
    automateScreenshot(_.extend({}, options, {
      appOnly: appOnly
      viewport: {
        width: state("viewportWidth")
        height: state("viewportHeight")
      }
    }))
  .finally ->
    after(screenshotConfig)

module.exports = (Commands, Cypress, cy, state, config) ->

  Cypress.on "runnable:after:run:async", (test, runnable) ->
    screenshotConfig = Screenshot.getConfig()
    ## we want to take a screenshot if we have an error, we're
    ## to take a screenshot and we are not interactive
    ## which means we're exiting at the end
    if test.err and screenshotConfig.screenshotOnRunFailure and not config("isInteractive")
      ## always capture runner and don't blackout on failure screenshots
      screenshotConfig.capture = "runner"
      screenshotConfig.blackout = []
      takeScreenshot(Cypress, state, screenshotConfig, { runnable })

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

      takeScreenshot(Cypress, state, screenshotConfig, {
        runnable: runnable
        name: name
        log: options._log
        timeout: options.timeout
      })
      .then ({ path, size }) ->
        _.extend(consoleProps, {
          "Saved": path
          "Size": size
        })
      .return(null)
  })
