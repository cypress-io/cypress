_ = require("lodash")
Promise = require("bluebird")
$ = require("jquery")

Screenshot = require("../../cypress/screenshot")
$dom = require("../../dom")
$utils = require("../../cypress/utils")

getViewportHeight = (state) ->
  Math.min(state("viewportHeight"), $(window).height())

getViewportWidth = (state) ->
  Math.min(state("viewportWidth"), $(window).width())

automateScreenshot = (options = {}) ->
  { runnable, timeout } = options

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

  props = _.extend({
    titles: titles
    testId: runnable.id
  }, _.omit(options, "runnable", "timeout", "log", "subject"))

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
      $utils.throwErr(err, { onFail: options.log })
    .catch Promise.TimeoutError, (err) ->
      $utils.throwErrByPath "screenshot.timed_out", {
        onFail: options.log
        args: { timeout }
      }

scrollOverrides = (win, doc) ->
  originalOverflow = doc.documentElement.style.overflow
  originalBodyOverflowY = doc.body.style.overflowY
  originalX = win.scrollX
  originalY = win.scrollY

  ## overflow-y: scroll can break `window.scrollTo`
  if doc.body
    doc.body.style.overflowY = "visible"

  ## hide scrollbars
  doc.documentElement.style.overflow = "hidden"

  ->
    doc.documentElement.style.overflow = originalOverflow
    if doc.body
      doc.body.style.overflowY = originalBodyOverflowY
    win.scrollTo(originalX, originalY)

takeScrollingScreenshots = (scrolls, win, automationOptions) ->
  scrollAndTake = ({ y, clip, afterScroll }, index) ->
    win.scrollTo(0, y)
    if afterScroll
      clip = afterScroll()
    options = _.extend({}, automationOptions, {
      current: index + 1
      total: scrolls.length
      clip: clip
    })
    automateScreenshot(options)

  Promise
  .mapSeries(scrolls, scrollAndTake)
  .then (results) ->
    _.last(results)

takeFullPageScreenshot = (state, automationOptions) ->
  win = state("window")
  doc = state("document")

  resetScrollOverrides = scrollOverrides(win, doc)

  docHeight = $(doc).height()
  viewportHeight = getViewportHeight(state)
  numScreenshots = Math.ceil(docHeight / viewportHeight)

  scrolls = _.map _.times(numScreenshots), (index) ->
    y = viewportHeight * index
    clip = if index + 1 is numScreenshots
      heightLeft = docHeight - (viewportHeight * index)
      {
        x: automationOptions.clip.x
        y: viewportHeight - heightLeft
        width: automationOptions.clip.width
        height: heightLeft
      }
    else
      automationOptions.clip

    { y, clip }

  takeScrollingScreenshots(scrolls, win, automationOptions)
  .finally(resetScrollOverrides)

takeElementScreenshot = ($el, state, automationOptions) ->
  win = state("window")
  doc = state("document")

  resetScrollOverrides = scrollOverrides(win, doc)

  elPosition = $dom.getElementPositioning($el)
  viewportHeight = getViewportHeight(state)
  viewportWidth = getViewportWidth(state)
  numScreenshots = Math.ceil(elPosition.height / viewportHeight)

  scrolls = _.map _.times(numScreenshots), (index) ->
    y = elPosition.fromWindow.top + (viewportHeight * index)
    afterScroll = ->
      elPosition = $dom.getElementPositioning($el)
      x = Math.min(viewportWidth, elPosition.fromViewport.left)
      width = Math.min(viewportWidth - x, elPosition.width)

      if numScreenshots is 1
        return {
          x: x
          y: elPosition.fromViewport.top
          width: width
          height: elPosition.height
        }

      if index + 1 is numScreenshots
        overlap = (numScreenshots - 1) * viewportHeight + elPosition.fromViewport.top
        heightLeft = elPosition.fromViewport.bottom - overlap
        {
          x: x
          y: overlap
          width: width
          height: heightLeft
        }
      else
        {
          x: x
          y: Math.max(0, elPosition.fromViewport.top)
          width: width
          ## TODO: try simplifying to just 'viewportHeight'
          height: Math.min(viewportHeight, elPosition.fromViewport.top + elPosition.height)
        }

    { y, afterScroll }

  takeScrollingScreenshots(scrolls, win, automationOptions)
  .finally(resetScrollOverrides)

## "app only" means we're hiding the runner UI
isAppOnly = ({ capture }) ->
  capture is "viewport" or capture is "fullpage"

getShouldScale = ({ capture, scale }) ->
  if isAppOnly({ capture }) then scale else true

getBlackout = ({ capture, blackout }) ->
  if isAppOnly({ capture }) then blackout else []

takeScreenshot = (Cypress, state, screenshotConfig, options = {}) ->
  {
    capture
    clip
    disableTimersAndAnimations
  } = screenshotConfig

  { subject, runnable } = options

  send = (event, props) ->
    new Promise (resolve) ->
      Cypress.action("cy:#{event}", props, resolve)

  getOptions = (isOpen) ->
    {
      id: runnable.id
      isOpen: isOpen
      appOnly: isAppOnly(screenshotConfig)
      scale: getShouldScale(screenshotConfig)
      waitForCommandSynchronization: not isAppOnly(screenshotConfig)
      disableTimersAndAnimations: disableTimersAndAnimations
      blackout: getBlackout(screenshotConfig)
    }

  before = ->
    if disableTimersAndAnimations
      cy.pauseTimers(true)

    Screenshot.callBeforeScreenshot(state("document"))

    send("before:screenshot", getOptions(true))

  after = ->
    send("after:screenshot", getOptions(false))

    Screenshot.callAfterScreenshot(state("document"))

    if disableTimersAndAnimations
      cy.pauseTimers(false)

  automationOptions = _.extend({}, options, {
    capture: capture
    clip: {
      x: 0
      y: 0
      width: getViewportWidth(state)
      height: getViewportHeight(state)
    }
    userClip: clip
    viewport: {
      width: $(window).width()
      height: $(window).height()
    }
  })

  before()
  .then ->
    if subject
      takeElementScreenshot(subject, state, automationOptions)
    else if capture is "fullpage"
      takeFullPageScreenshot(state, automationOptions)
    else
      automateScreenshot(automationOptions)
  .finally(after)

module.exports = (Commands, Cypress, cy, state, config) ->

  ## failure screenshot when not interactive
  Cypress.on "runnable:after:run:async", (test, runnable) ->
    screenshotConfig = Screenshot.getConfig()
    if test.err and screenshotConfig.screenshotOnRunFailure and not config("isInteractive")
      automateScreenshot({
        capture: "runner"
        runnable
        simple: true
        timeout: config("responseTimeout")
      })

  Commands.addAll({ prevSubject: "optional" }, {
    screenshot: (subject, name, userOptions = {}) ->
      if _.isObject(name)
        userOptions = name
        name = null

      if not $dom.isElement(subject)
        subject = null

      withinSubject = state("withinSubject")
      if withinSubject and $dom.isElement(withinSubject)
        subject = withinSubject

      ## TODO: handle hook titles
      runnable = state("runnable")

      options = _.defaults {}, userOptions, {
        log: true
        timeout: config("responseTimeout")
      }

      screenshotConfig = _.pick(options, "capture", "scale", "disableTimersAndAnimations", "blackout", "waitForCommandSynchronization", "clip")
      screenshotConfig = Screenshot.validate(screenshotConfig, "cy.screenshot", options._log)
      screenshotConfig = _.extend(Screenshot.getConfig(), screenshotConfig)

      ## set this regardless of options.log b/c its used by the
      ## yielded value below
      consoleProps = _.omit(screenshotConfig, "scale", "screenshotOnRunFailure")
      consoleProps = _.extend(consoleProps, {
        scaled: getShouldScale(screenshotConfig)
        blackout: getBlackout(screenshotConfig)
      })

      if name
        consoleProps.name = name

      if options.log
        options._log = Cypress.log({
          message: name
          consoleProps: ->
            consoleProps
        })

      if subject and subject.length > 1
        $utils.throwErrByPath("screenshot.multiple_elements", {
          log: options._log
          args: { numElements: subject.length }
        })

      if subject
        screenshotConfig.capture = "viewport"

      startTime = Date.now()

      takeScreenshot(Cypress, state, screenshotConfig, {
        subject: subject
        runnable: runnable
        name: name
        log: options._log
        timeout: options.timeout
      })
      .then (props) ->
        duration = Date.now() - startTime

        yieldValue = _.extend({}, consoleProps, props, { duration })
        yieldValue.path = yieldValue.path.replace(/^.*_playground/, '<redacted>')

        { width, height } = props.dimensions

        _.extend(consoleProps, yieldValue, {
          duration: "#{duration}ms"
          dimensions: "#{width}px x #{height}px"
        })

        if subject
          consoleProps.subject = subject
          yieldValue.el = subject

        return yieldValue
  })
