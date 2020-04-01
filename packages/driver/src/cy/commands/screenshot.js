_ = require("lodash")
$ = require("jquery")
bytes = require("bytes")
Promise = require("bluebird")

$Screenshot = require("../../cypress/screenshot")
$dom = require("../../dom")
$errUtils = require("../../cypress/error_utils")

getViewportHeight = (state) ->
  ## TODO this doesn't seem correct
  Math.min(state("viewportHeight"), window.innerHeight)

getViewportWidth = (state) ->
  Math.min(state("viewportWidth"), window.innerWidth)

automateScreenshot = (state, options = {}) ->
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
    titles
    testId: runnable.id
    takenPaths: state("screenshotPaths")
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
      $errUtils.throwErr(err, { onFail: options.log })
    .catch Promise.TimeoutError, (err) ->
      $errUtils.throwErrByPath "screenshot.timed_out", {
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

  return ->
    doc.documentElement.style.overflow = originalOverflow
    if doc.body
      doc.body.style.overflowY = originalBodyOverflowY
    win.scrollTo(originalX, originalY)

validateNumScreenshots = (numScreenshots, automationOptions) ->
  if numScreenshots < 1
    $errUtils.throwErrByPath("screenshot.invalid_height", {
      log: automationOptions.log
    })

takeScrollingScreenshots = (scrolls, win, state, automationOptions) ->
  scrollAndTake = ({ y, clip, afterScroll }, index) ->
    win.scrollTo(0, y)
    if afterScroll
      clip = afterScroll()
    options = _.extend({}, automationOptions, {
      current: index + 1
      total: scrolls.length
      clip: clip
    })
    automateScreenshot(state, options)

  Promise
  .mapSeries(scrolls, scrollAndTake)
  .then(_.last)

takeFullPageScreenshot = (state, automationOptions) ->
  win = state("window")
  doc = state("document")

  resetScrollOverrides = scrollOverrides(win, doc)

  docHeight = $(doc).height()
  viewportHeight = getViewportHeight(state)
  numScreenshots = Math.ceil(docHeight / viewportHeight)

  validateNumScreenshots(numScreenshots, automationOptions)

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

  takeScrollingScreenshots(scrolls, win, state, automationOptions)
  .finally(resetScrollOverrides)

applyPaddingToElementPositioning = (elPosition, automationOptions) ->
  if not automationOptions.padding
    return elPosition

  [ paddingTop, paddingRight, paddingBottom, paddingLeft ] = automationOptions.padding

  return {
    width: elPosition.width + paddingLeft + paddingRight
    height: elPosition.height + paddingTop + paddingBottom
    fromElViewport: {
      top: elPosition.fromElViewport.top - paddingTop
      left: elPosition.fromElViewport.left - paddingLeft
      bottom: elPosition.fromElViewport.bottom + paddingBottom
    }
    fromElWindow: {
      top: elPosition.fromElWindow.top - paddingTop
    }
  }

takeElementScreenshot = ($el, state, automationOptions) ->
  win = state("window")
  doc = state("document")

  resetScrollOverrides = scrollOverrides(win, doc)

  elPosition = applyPaddingToElementPositioning(
    $dom.getElementPositioning($el),
    automationOptions
  )
  viewportHeight = getViewportHeight(state)
  viewportWidth = getViewportWidth(state)
  numScreenshots = Math.ceil(elPosition.height / viewportHeight)

  validateNumScreenshots(numScreenshots, automationOptions)

  scrolls = _.map _.times(numScreenshots), (index) ->
    y = elPosition.fromElWindow.top + (viewportHeight * index)

    afterScroll = ->
      elPosition = applyPaddingToElementPositioning(
        $dom.getElementPositioning($el),
        automationOptions
      )
      x = Math.min(viewportWidth, elPosition.fromElViewport.left)
      width = Math.min(viewportWidth - x, elPosition.width)

      if numScreenshots is 1
        return {
          x: x
          y: elPosition.fromElViewport.top
          width: width
          height: elPosition.height
        }

      if index + 1 is numScreenshots
        overlap = (numScreenshots - 1) * viewportHeight + elPosition.fromElViewport.top
        heightLeft = elPosition.fromElViewport.bottom - overlap

        return {
          x: x
          y: overlap
          width: width
          height: heightLeft
        }

      return {
        x: x
        y: Math.max(0, elPosition.fromElViewport.top)
        width: width
        ## TODO: try simplifying to just 'viewportHeight'
        height: Math.min(viewportHeight, elPosition.fromElViewport.top + elPosition.height)
      }

    { y, afterScroll }

  takeScrollingScreenshots(scrolls, win, state, automationOptions)
  .finally(resetScrollOverrides)

## "app only" means we're hiding the runner UI
isAppOnly = ({ capture }) ->
  capture is "viewport" or capture is "fullPage"

getShouldScale = ({ capture, scale }) ->
  if isAppOnly({ capture }) then scale else true

getBlackout = ({ capture, blackout }) ->
  if isAppOnly({ capture }) then blackout else []

takeScreenshot = (Cypress, state, screenshotConfig, options = {}) ->
  {
    capture
    padding
    clip
    disableTimersAndAnimations
    onBeforeScreenshot
    onAfterScreenshot
  } = screenshotConfig

  { subject, runnable, name } = options

  startTime = new Date()

  send = (event, props, resolve) ->
    Cypress.action("cy:#{event}", props, resolve)

  sendAsync = (event, props) ->
    new Promise (resolve) ->
      send(event, props, resolve)

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

    sendAsync("before:screenshot", getOptions(true))

  after = ->
    send("after:screenshot", getOptions(false))

    if disableTimersAndAnimations
      cy.pauseTimers(false)

  automationOptions = _.extend({}, options, {
    capture
    clip: {
      x: 0
      y: 0
      width: getViewportWidth(state)
      height: getViewportHeight(state)
    }
    padding
    userClip: clip
    viewport: {
      width: window.innerWidth
      height: window.innerHeight
    }
    scaled: getShouldScale(screenshotConfig)
    blackout: getBlackout(screenshotConfig)
    startTime: startTime.toISOString()
  })

  ## use the subject as $el or yield the wrapped documentElement
  $el = if $dom.isElement(subject)
    subject
  else
    $dom.wrap(state("document").documentElement)

  before()
  .then ->
    onBeforeScreenshot and onBeforeScreenshot.call(state("ctx"), $el)

    $Screenshot.onBeforeScreenshot($el)

    switch
      when $dom.isElement(subject)
        takeElementScreenshot($el, state, automationOptions)
      when capture is "fullPage"
        takeFullPageScreenshot(state, automationOptions)
      else
        automateScreenshot(state, automationOptions)
  .then (props) ->
    onAfterScreenshot and onAfterScreenshot.call(state("ctx"), $el, props)

    $Screenshot.onAfterScreenshot($el, props)

    return props
  .finally(after)

module.exports = (Commands, Cypress, cy, state, config) ->

  ## failure screenshot when not interactive
  Cypress.on "runnable:after:run:async", (test, runnable) ->
    screenshotConfig = $Screenshot.getConfig()

    return if not test.err or not screenshotConfig.screenshotOnRunFailure or config("isInteractive") or test.err.isPending

    ## if a screenshot has not been taken (by cy.screenshot()) in the test
    ## that failed, we can bypass UI-changing and pixel-checking (simple: true)
    ## otheriwse, we need to do all the standard checks
    ## to make sure the UI is in the right place (simple: false)
    screenshotConfig.capture = "runner"
    takeScreenshot(Cypress, state, screenshotConfig, {
      runnable
      simple: !state("screenshotTaken")
      testFailure: true
      timeout: config("responseTimeout")
    })

  Commands.addAll({ prevSubject: ["optional", "element", "window", "document"] }, {
    screenshot: (subject, name, userOptions = {}) ->
      if _.isObject(name)
        userOptions = name
        name = null

      withinSubject = state("withinSubject")
      if withinSubject and $dom.isElement(withinSubject)
        subject = withinSubject

      ## TODO: handle hook titles
      runnable = state("runnable")

      options = _.defaults {}, userOptions, {
        log: true
        timeout: config("responseTimeout")
      }

      isWin = $dom.isWindow(subject)

      screenshotConfig = _.pick(options, "capture", "scale", "disableTimersAndAnimations", "blackout", "waitForCommandSynchronization", "padding", "clip", "onBeforeScreenshot", "onAfterScreenshot")
      screenshotConfig = $Screenshot.validate(screenshotConfig, "screenshot", options._log)
      screenshotConfig = _.extend($Screenshot.getConfig(), screenshotConfig)

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

      if not isWin and subject and subject.length > 1
        $errUtils.throwErrByPath("screenshot.multiple_elements", {
          log: options._log
          args: { numElements: subject.length }
        })

      if $dom.isElement(subject)
        screenshotConfig.capture = "viewport"

      state("screenshotTaken", true)

      takeScreenshot(Cypress, state, screenshotConfig, {
        name
        subject
        runnable
        log: options._log
        timeout: options.timeout
      })
      .then (props) ->
        { duration, path, size } = props
        { width, height } = props.dimensions

        takenPaths = state("screenshotPaths") or []
        state("screenshotPaths", takenPaths.concat([path]))

        _.extend(consoleProps, props, {
          size: bytes(size, { unitSeparator: " " })
          duration: "#{duration}ms"
          dimensions: "#{width}px x #{height}px"
        })

        if subject
          consoleProps.subject = subject

        return subject
  })
