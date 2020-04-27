/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");
const $ = require("jquery");
const bytes = require("bytes");
const Promise = require("bluebird");

const $Screenshot = require("../../cypress/screenshot");
const $dom = require("../../dom");
const $errUtils = require("../../cypress/error_utils");

const getViewportHeight = state => //# TODO this doesn't seem correct
Math.min(state("viewportHeight"), window.innerHeight);

const getViewportWidth = state => Math.min(state("viewportWidth"), window.innerWidth);

const automateScreenshot = function(state, options = {}) {
  const { runnable, timeout } = options;

  const titles = [];

  //# if this a hook then push both the current test title
  //# and our own hook title
  if (runnable.type === "hook") {
    let ct;
    if (runnable.ctx && (ct = runnable.ctx.currentTest)) {
      titles.push(ct.title, runnable.title);
    }
  } else {
    titles.push(runnable.title);
  }

  var getParentTitle = function(runnable) {
    let p;
    if (p = runnable.parent) {
      let t;
      if (t = p.title) {
        titles.unshift(t);
      }

      return getParentTitle(p);
    }
  };

  getParentTitle(runnable);

  const props = _.extend({
    titles,
    testId: runnable.id,
    takenPaths: state("screenshotPaths")
  }, _.omit(options, "runnable", "timeout", "log", "subject"));

  const automate = () => Cypress.automation("take:screenshot", props);

  if (!timeout) {
    return automate();
  } else {
    //# need to remove the current timeout
    //# because we're handling timeouts ourselves
    cy.clearTimeout("take:screenshot");

    return automate()
    .timeout(timeout)
    .catch(err => $errUtils.throwErr(err, { onFail: options.log })).catch(Promise.TimeoutError, err => $errUtils.throwErrByPath("screenshot.timed_out", {
      onFail: options.log,
      args: { timeout }
    }));
  }
};

const scrollOverrides = function(win, doc) {
  const originalOverflow = doc.documentElement.style.overflow;
  const originalBodyOverflowY = doc.body.style.overflowY;
  const originalX = win.scrollX;
  const originalY = win.scrollY;

  //# overflow-y: scroll can break `window.scrollTo`
  if (doc.body) {
    doc.body.style.overflowY = "visible";
  }

  //# hide scrollbars
  doc.documentElement.style.overflow = "hidden";

  return function() {
    doc.documentElement.style.overflow = originalOverflow;
    if (doc.body) {
      doc.body.style.overflowY = originalBodyOverflowY;
    }
    return win.scrollTo(originalX, originalY);
  };
};

const validateNumScreenshots = function(numScreenshots, automationOptions) {
  if (numScreenshots < 1) {
    return $errUtils.throwErrByPath("screenshot.invalid_height", {
      log: automationOptions.log
    });
  }
};

const takeScrollingScreenshots = function(scrolls, win, state, automationOptions) {
  const scrollAndTake = function({ y, clip, afterScroll }, index) {
    win.scrollTo(0, y);
    if (afterScroll) {
      clip = afterScroll();
    }
    const options = _.extend({}, automationOptions, {
      current: index + 1,
      total: scrolls.length,
      clip
    });
    return automateScreenshot(state, options);
  };

  return Promise
  .mapSeries(scrolls, scrollAndTake)
  .then(_.last);
};

const takeFullPageScreenshot = function(state, automationOptions) {
  const win = state("window");
  const doc = state("document");

  const resetScrollOverrides = scrollOverrides(win, doc);

  const docHeight = $(doc).height();
  const viewportHeight = getViewportHeight(state);
  const numScreenshots = Math.ceil(docHeight / viewportHeight);

  validateNumScreenshots(numScreenshots, automationOptions);

  const scrolls = _.map(_.times(numScreenshots), function(index) {
    const y = viewportHeight * index;
    const clip = (() => {
      if ((index + 1) === numScreenshots) {
      const heightLeft = docHeight - (viewportHeight * index);
      return {
        x: automationOptions.clip.x,
        y: viewportHeight - heightLeft,
        width: automationOptions.clip.width,
        height: heightLeft
      };
    } else {
      return automationOptions.clip;
    }
    })();

    return { y, clip };
});

  return takeScrollingScreenshots(scrolls, win, state, automationOptions)
  .finally(resetScrollOverrides);
};

const applyPaddingToElementPositioning = function(elPosition, automationOptions) {
  if (!automationOptions.padding) {
    return elPosition;
  }

  const [ paddingTop, paddingRight, paddingBottom, paddingLeft ] = automationOptions.padding;

  return {
    width: elPosition.width + paddingLeft + paddingRight,
    height: elPosition.height + paddingTop + paddingBottom,
    fromElViewport: {
      top: elPosition.fromElViewport.top - paddingTop,
      left: elPosition.fromElViewport.left - paddingLeft,
      bottom: elPosition.fromElViewport.bottom + paddingBottom
    },
    fromElWindow: {
      top: elPosition.fromElWindow.top - paddingTop
    }
  };
};

const takeElementScreenshot = function($el, state, automationOptions) {
  const win = state("window");
  const doc = state("document");

  const resetScrollOverrides = scrollOverrides(win, doc);

  let elPosition = applyPaddingToElementPositioning(
    $dom.getElementPositioning($el),
    automationOptions
  );
  const viewportHeight = getViewportHeight(state);
  const viewportWidth = getViewportWidth(state);
  const numScreenshots = Math.ceil(elPosition.height / viewportHeight);

  validateNumScreenshots(numScreenshots, automationOptions);

  const scrolls = _.map(_.times(numScreenshots), function(index) {
    const y = elPosition.fromElWindow.top + (viewportHeight * index);

    const afterScroll = function() {
      elPosition = applyPaddingToElementPositioning(
        $dom.getElementPositioning($el),
        automationOptions
      );
      const x = Math.min(viewportWidth, elPosition.fromElViewport.left);
      const width = Math.min(viewportWidth - x, elPosition.width);

      if (numScreenshots === 1) {
        return {
          x,
          y: elPosition.fromElViewport.top,
          width,
          height: elPosition.height
        };
      }

      if ((index + 1) === numScreenshots) {
        const overlap = ((numScreenshots - 1) * viewportHeight) + elPosition.fromElViewport.top;
        const heightLeft = elPosition.fromElViewport.bottom - overlap;

        return {
          x,
          y: overlap,
          width,
          height: heightLeft
        };
      }

      return {
        x,
        y: Math.max(0, elPosition.fromElViewport.top),
        width,
        //# TODO: try simplifying to just 'viewportHeight'
        height: Math.min(viewportHeight, elPosition.fromElViewport.top + elPosition.height)
      };
    };

    return { y, afterScroll };
});

  return takeScrollingScreenshots(scrolls, win, state, automationOptions)
  .finally(resetScrollOverrides);
};

//# "app only" means we're hiding the runner UI
const isAppOnly = ({ capture }) => (capture === "viewport") || (capture === "fullPage");

const getShouldScale = function({ capture, scale }) {
  if (isAppOnly({ capture })) { return scale; } else { return true; }
};

const getBlackout = function({ capture, blackout }) {
  if (isAppOnly({ capture })) { return blackout; } else { return []; }
};

const takeScreenshot = function(Cypress, state, screenshotConfig, options = {}) {
  const {
    capture,
    padding,
    clip,
    disableTimersAndAnimations,
    onBeforeScreenshot,
    onAfterScreenshot
  } = screenshotConfig;

  const { subject, runnable, name } = options;

  const startTime = new Date();

  const send = (event, props, resolve) => Cypress.action(`cy:${event}`, props, resolve);

  const sendAsync = (event, props) => new Promise(resolve => send(event, props, resolve));

  const getOptions = isOpen => ({
    id: runnable.id,
    isOpen,
    appOnly: isAppOnly(screenshotConfig),
    scale: getShouldScale(screenshotConfig),
    waitForCommandSynchronization: !isAppOnly(screenshotConfig),
    disableTimersAndAnimations,
    blackout: getBlackout(screenshotConfig)
  });

  const before = function() {
    if (disableTimersAndAnimations) {
      cy.pauseTimers(true);
    }

    return sendAsync("before:screenshot", getOptions(true));
  };

  const after = function() {
    send("after:screenshot", getOptions(false));

    if (disableTimersAndAnimations) {
      return cy.pauseTimers(false);
    }
  };

  const automationOptions = _.extend({}, options, {
    capture,
    clip: {
      x: 0,
      y: 0,
      width: getViewportWidth(state),
      height: getViewportHeight(state)
    },
    padding,
    userClip: clip,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    scaled: getShouldScale(screenshotConfig),
    blackout: getBlackout(screenshotConfig),
    startTime: startTime.toISOString()
  });

  //# use the subject as $el or yield the wrapped documentElement
  const $el = $dom.isElement(subject) ?
    subject
  :
    $dom.wrap(state("document").documentElement);

  return before()
  .then(function() {
    onBeforeScreenshot && onBeforeScreenshot.call(state("ctx"), $el);

    $Screenshot.onBeforeScreenshot($el);

    switch (false) {
      case !$dom.isElement(subject):
        return takeElementScreenshot($el, state, automationOptions);
      case capture !== "fullPage":
        return takeFullPageScreenshot(state, automationOptions);
      default:
        return automateScreenshot(state, automationOptions);
    }}).then(function(props) {
    onAfterScreenshot && onAfterScreenshot.call(state("ctx"), $el, props);

    $Screenshot.onAfterScreenshot($el, props);

    return props;}).finally(after);
};

module.exports = function(Commands, Cypress, cy, state, config) {

  //# failure screenshot when not interactive
  Cypress.on("runnable:after:run:async", function(test, runnable) {
    const screenshotConfig = $Screenshot.getConfig();

    if (!test.err || !screenshotConfig.screenshotOnRunFailure || config("isInteractive") || test.err.isPending) { return; }

    //# if a screenshot has not been taken (by cy.screenshot()) in the test
    //# that failed, we can bypass UI-changing and pixel-checking (simple: true)
    //# otheriwse, we need to do all the standard checks
    //# to make sure the UI is in the right place (simple: false)
    screenshotConfig.capture = "runner";
    return takeScreenshot(Cypress, state, screenshotConfig, {
      runnable,
      simple: !state("screenshotTaken"),
      testFailure: true,
      timeout: config("responseTimeout")
    });
  });

  return Commands.addAll({ prevSubject: ["optional", "element", "window", "document"] }, {
    screenshot(subject, name, options = {}) {
      let userOptions = options;

      if (_.isObject(name)) {
        userOptions = name;
        name = null;
      }

      const withinSubject = state("withinSubject");
      if (withinSubject && $dom.isElement(withinSubject)) {
        subject = withinSubject;
      }

      //# TODO: handle hook titles
      const runnable = state("runnable");

      options = _.defaults({}, userOptions, {
        log: true,
        timeout: config("responseTimeout")
      });

      const isWin = $dom.isWindow(subject);

      let screenshotConfig = _.pick(options, "capture", "scale", "disableTimersAndAnimations", "blackout", "waitForCommandSynchronization", "padding", "clip", "onBeforeScreenshot", "onAfterScreenshot");
      screenshotConfig = $Screenshot.validate(screenshotConfig, "screenshot", options._log);
      screenshotConfig = _.extend($Screenshot.getConfig(), screenshotConfig);

      //# set this regardless of options.log b/c its used by the
      //# yielded value below
      let consoleProps = _.omit(screenshotConfig, "scale", "screenshotOnRunFailure");
      consoleProps = _.extend(consoleProps, {
        scaled: getShouldScale(screenshotConfig),
        blackout: getBlackout(screenshotConfig)
      });

      if (name) {
        consoleProps.name = name;
      }

      if (options.log) {
        options._log = Cypress.log({
          message: name,
          consoleProps() {
            return consoleProps;
          }
        });
      }

      if (!isWin && subject && (subject.length > 1)) {
        $errUtils.throwErrByPath("screenshot.multiple_elements", {
          log: options._log,
          args: { numElements: subject.length }
        });
      }

      if ($dom.isElement(subject)) {
        screenshotConfig.capture = "viewport";
      }

      state("screenshotTaken", true);

      return takeScreenshot(Cypress, state, screenshotConfig, {
        name,
        subject,
        runnable,
        log: options._log,
        timeout: options.timeout
      })
      .then(function(props) {
        const { duration, path, size } = props;
        const { width, height } = props.dimensions;

        const takenPaths = state("screenshotPaths") || [];
        state("screenshotPaths", takenPaths.concat([path]));

        _.extend(consoleProps, props, {
          size: bytes(size, { unitSeparator: " " }),
          duration: `${duration}ms`,
          dimensions: `${width}px x ${height}px`
        });

        if (subject) {
          consoleProps.subject = subject;
        }

        return subject;
      });
    }
  });
};
