/* global Cypress, cy */
const _ = require('lodash')
const $ = require('jquery')
const bytes = require('bytes')
const Promise = require('bluebird')

const $Screenshot = require('../../cypress/screenshot')
const $dom = require('../../dom')
const $errUtils = require('../../cypress/error_utils')
const $utils = require('../../cypress/utils')

const getViewportHeight = (state) => {
  // TODO this doesn't seem correct
  return Math.min(state('viewportHeight'), window.innerHeight)
}

const getViewportWidth = (state) => {
  return Math.min(state('viewportWidth'), window.innerWidth)
}

const automateScreenshot = (state, options = {}) => {
  const { runnable, timeout } = options

  const titles = []

  // if this a hook then push both the current test title
  // and our own hook title
  if (runnable.type === 'hook') {
    let ct = runnable.ctx.currentTest

    if (runnable.ctx && ct) {
      titles.push(ct.title, runnable.title)
    }
  } else {
    titles.push(runnable.title)
  }

  const getParentTitle = (runnable) => {
    const p = runnable.parent

    if (p) {
      const t = p.title

      if (t) {
        titles.unshift(t)
      }

      return getParentTitle(p)
    }
  }

  getParentTitle(runnable)

  const props = _.extend({
    titles,
    testId: runnable.id,
    takenPaths: state('screenshotPaths'),
    testAttemptIndex: $utils.getTestFromRunnable(runnable)._currentRetry,
  }, _.omit(options, 'runnable', 'timeout', 'log', 'subject'))

  const automate = () => {
    return Cypress.automation('take:screenshot', props)
  }

  if (!timeout) {
    return automate()
  }

  // need to remove the current timeout
  // because we're handling timeouts ourselves
  cy.clearTimeout('take:screenshot')

  return automate()
  .timeout(timeout)
  .catch((err) => {
    return $errUtils.throwErr(err, { onFail: options.log })
  })
  .catch(Promise.TimeoutError, () => {
    return $errUtils.throwErrByPath('screenshot.timed_out', {
      onFail: options.log,
      args: { timeout },
    })
  })
}

const scrollOverrides = (win, doc) => {
  const originalOverflow = doc.documentElement.style.overflow
  const originalBodyOverflowY = doc.body.style.overflowY
  const originalX = win.scrollX
  const originalY = win.scrollY

  // overflow-y: scroll can break `window.scrollTo`
  if (doc.body) {
    doc.body.style.overflowY = 'visible'
  }

  // hide scrollbars
  doc.documentElement.style.overflow = 'hidden'

  // in the case that an element might change size on scroll
  // we trigger a scroll event to ensure that all elements are
  // at their final size before we calculate the total height
  // since we scroll down the page in takeScrollingScreenshots
  // and don't want the page size to change once we start
  // https://github.com/cypress-io/cypress/issues/6099
  win.dispatchEvent(new win.Event('scroll'))

  return () => {
    doc.documentElement.style.overflow = originalOverflow
    if (doc.body) {
      doc.body.style.overflowY = originalBodyOverflowY
    }

    return win.scrollTo(originalX, originalY)
  }
}

const validateNumScreenshots = (numScreenshots, automationOptions) => {
  if (numScreenshots < 1) {
    $errUtils.throwErrByPath('screenshot.invalid_height', {
      log: automationOptions.log,
    })
  }
}

const takeScrollingScreenshots = (scrolls, win, state, automationOptions) => {
  const scrollAndTake = ({ y, clip, afterScroll }, index) => {
    win.scrollTo(0, y)
    if (afterScroll) {
      clip = afterScroll()
    }

    const options = _.extend({}, automationOptions, {
      current: index + 1,
      total: scrolls.length,
      clip,
    })

    return automateScreenshot(state, options)
  }

  return Promise
  .mapSeries(scrolls, scrollAndTake)
  .then(_.last)
}

const takeFullPageScreenshot = (state, automationOptions) => {
  const win = state('window')
  const doc = state('document')

  const resetScrollOverrides = scrollOverrides(win, doc)

  const docHeight = $(doc).height()
  const viewportHeight = getViewportHeight(state)
  const numScreenshots = Math.ceil(docHeight / viewportHeight)

  validateNumScreenshots(numScreenshots, automationOptions)

  const scrolls = _.map(_.times(numScreenshots), (index) => {
    const y = viewportHeight * index
    let clip

    if ((index + 1) === numScreenshots) {
      const heightLeft = docHeight - (viewportHeight * index)

      clip = {
        x: automationOptions.clip.x,
        y: viewportHeight - heightLeft,
        width: automationOptions.clip.width,
        height: heightLeft,
      }
    } else {
      clip = automationOptions.clip
    }

    return { y, clip }
  })

  return takeScrollingScreenshots(scrolls, win, state, automationOptions)
  .finally(resetScrollOverrides)
}

const applyPaddingToElementPositioning = (elPosition, automationOptions) => {
  if (!automationOptions.padding) {
    return elPosition
  }

  const [paddingTop, paddingRight, paddingBottom, paddingLeft] = automationOptions.padding

  return {
    width: elPosition.width + paddingLeft + paddingRight,
    height: elPosition.height + paddingTop + paddingBottom,
    fromElViewport: {
      top: elPosition.fromElViewport.top - paddingTop,
      left: elPosition.fromElViewport.left - paddingLeft,
      bottom: elPosition.fromElViewport.bottom + paddingBottom,
    },
    fromElWindow: {
      top: elPosition.fromElWindow.top - paddingTop,
    },
  }
}

const takeElementScreenshot = ($el, state, automationOptions) => {
  const win = state('window')
  const doc = state('document')

  const resetScrollOverrides = scrollOverrides(win, doc)

  let elPosition = applyPaddingToElementPositioning(
    $dom.getElementPositioning($el),
    automationOptions,
  )
  const viewportHeight = getViewportHeight(state)
  const viewportWidth = getViewportWidth(state)
  const numScreenshots = Math.ceil(elPosition.height / viewportHeight)

  validateNumScreenshots(numScreenshots, automationOptions)

  const scrolls = _.map(_.times(numScreenshots), (index) => {
    const y = elPosition.fromElWindow.top + (viewportHeight * index)

    const afterScroll = () => {
      elPosition = applyPaddingToElementPositioning(
        $dom.getElementPositioning($el),
        automationOptions,
      )

      const x = Math.min(viewportWidth, elPosition.fromElViewport.left)
      const width = Math.min(viewportWidth - x, elPosition.width)

      if (numScreenshots === 1) {
        return {
          x,
          y: elPosition.fromElViewport.top,
          width,
          height: elPosition.height,
        }
      }

      if ((index + 1) === numScreenshots) {
        const overlap = ((numScreenshots - 1) * viewportHeight) + elPosition.fromElViewport.top
        const heightLeft = elPosition.fromElViewport.bottom - overlap

        return {
          x,
          y: overlap,
          width,
          height: heightLeft,
        }
      }

      return {
        x,
        y: Math.max(0, elPosition.fromElViewport.top),
        width,
        // TODO: try simplifying to just 'viewportHeight'
        height: Math.min(viewportHeight, elPosition.fromElViewport.top + elPosition.height),
      }
    }

    return { y, afterScroll }
  })

  return takeScrollingScreenshots(scrolls, win, state, automationOptions)
  .finally(resetScrollOverrides)
}

// "app only" means we're hiding the runner UI
const isAppOnly = ({ capture }) => {
  return (capture === 'viewport') || (capture === 'fullPage')
}

const getShouldScale = ({ capture, scale }) => {
  return isAppOnly({ capture }) ? scale : true
}

const getBlackout = ({ capture, blackout }) => {
  return isAppOnly({ capture }) ? blackout : []
}

const takeScreenshot = (Cypress, state, screenshotConfig, options = {}) => {
  const {
    capture,
    padding,
    clip,
    disableTimersAndAnimations,
    onBeforeScreenshot,
    onAfterScreenshot,
  } = screenshotConfig

  const { subject, runnable } = options

  const startTime = new Date()

  const send = (event, props, resolve) => {
    Cypress.action(`cy:${event}`, props, resolve)
  }

  const sendAsync = (event, props) => {
    return new Promise((resolve) => {
      return send(event, props, resolve)
    })
  }

  const getOptions = (isOpen) => {
    return {
      id: runnable.id,
      testAttemptIndex: $utils.getTestFromRunnable(runnable)._currentRetry,
      isOpen,
      appOnly: isAppOnly(screenshotConfig),
      scale: getShouldScale(screenshotConfig),
      waitForCommandSynchronization: !isAppOnly(screenshotConfig),
      disableTimersAndAnimations,
      blackout: getBlackout(screenshotConfig),
    }
  }

  const before = () => {
    if (disableTimersAndAnimations) {
      cy.pauseTimers(true)
    }

    return sendAsync('before:screenshot', getOptions(true))
  }

  const after = () => {
    send('after:screenshot', getOptions(false))

    if (disableTimersAndAnimations) {
      return cy.pauseTimers(false)
    }
  }

  const automationOptions = _.extend({}, options, {
    capture,
    clip: {
      x: 0,
      y: 0,
      width: getViewportWidth(state),
      height: getViewportHeight(state),
    },
    padding,
    userClip: clip,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    scaled: getShouldScale(screenshotConfig),
    blackout: getBlackout(screenshotConfig),
    startTime: startTime.toISOString(),
  })

  // use the subject as $el or yield the wrapped documentElement
  const $el = $dom.isElement(subject)
    ? subject
    : $dom.wrap(state('document').documentElement)

  return before()
  .then(() => {
    if (onBeforeScreenshot) {
      onBeforeScreenshot.call(state('ctx'), $el)
    }

    $Screenshot.onBeforeScreenshot($el)

    if ($dom.isElement(subject)) {
      return takeElementScreenshot($el, state, automationOptions)
    }

    if (capture === 'fullPage') {
      return takeFullPageScreenshot(state, automationOptions)
    }

    return automateScreenshot(state, automationOptions)
  })
  .then((props) => {
    if (onAfterScreenshot) {
      onAfterScreenshot.call(state('ctx'), $el, props)
    }

    $Screenshot.onAfterScreenshot($el, props)

    return props
  })
  .finally(after)
}

module.exports = function (Commands, Cypress, cy, state, config) {
  // failure screenshot when not interactive
  Cypress.on('runnable:after:run:async', (test, runnable) => {
    const screenshotConfig = $Screenshot.getConfig()

    if (!test.err || !screenshotConfig.screenshotOnRunFailure || config('isInteractive') || test.err.isPending || !config('screenshotOnRunFailure')) {
      return
    }

    // if a screenshot has not been taken (by cy.screenshot()) in the test
    // that failed, we can bypass UI-changing and pixel-checking (simple: true)
    // otheriwse, we need to do all the standard checks
    // to make sure the UI is in the right place (simple: false)
    screenshotConfig.capture = 'runner'

    return takeScreenshot(Cypress, state, screenshotConfig, {
      runnable,
      simple: !state('screenshotTaken'),
      testFailure: true,
      timeout: config('responseTimeout'),
    })
  })

  Commands.addAll({ prevSubject: ['optional', 'element', 'window', 'document'] }, {
    screenshot (subject, name, options = {}) {
      let userOptions = options

      if (_.isObject(name)) {
        userOptions = name
        name = null
      }

      const withinSubject = state('withinSubject')

      if (withinSubject && $dom.isElement(withinSubject)) {
        subject = withinSubject
      }

      // TODO: handle hook titles
      const runnable = state('runnable')

      options = _.defaults({}, userOptions, {
        log: true,
        timeout: config('responseTimeout'),
      })

      const isWin = $dom.isWindow(subject)

      let screenshotConfig = _.pick(options, 'capture', 'scale', 'disableTimersAndAnimations', 'blackout', 'waitForCommandSynchronization', 'padding', 'clip', 'onBeforeScreenshot', 'onAfterScreenshot')

      screenshotConfig = $Screenshot.validate(screenshotConfig, 'screenshot', options._log)
      screenshotConfig = _.extend($Screenshot.getConfig(), screenshotConfig)

      // set this regardless of options.log b/c its used by the
      // yielded value below
      let consoleProps = _.omit(screenshotConfig, 'scale', 'screenshotOnRunFailure')

      consoleProps = _.extend(consoleProps, {
        scaled: getShouldScale(screenshotConfig),
        blackout: getBlackout(screenshotConfig),
      })

      if (name) {
        consoleProps.name = name
      }

      if (options.log) {
        options._log = Cypress.log({
          message: name,
          timeout: options.timeout,
          consoleProps () {
            return consoleProps
          },
        })
      }

      if (!isWin && subject && subject.length > 1) {
        $errUtils.throwErrByPath('screenshot.multiple_elements', {
          log: options._log,
          args: { numElements: subject.length },
        })
      }

      if ($dom.isElement(subject)) {
        screenshotConfig.capture = 'viewport'
      }

      state('screenshotTaken', true)

      return takeScreenshot(Cypress, state, screenshotConfig, {
        name,
        subject,
        runnable,
        log: options._log,
        timeout: options.timeout,
      })
      .then((props) => {
        const { duration, path, size } = props
        const { width, height } = props.dimensions

        const takenPaths = state('screenshotPaths') || []

        state('screenshotPaths', takenPaths.concat([path]))

        _.extend(consoleProps, props, {
          size: bytes(size, { unitSeparator: ' ' }),
          duration: `${duration}ms`,
          dimensions: `${width}px x ${height}px`,
        })

        if (subject) {
          consoleProps.subject = subject
        }

        return subject
      })
    },
  })
}
