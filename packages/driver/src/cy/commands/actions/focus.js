/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");
const Promise = require("bluebird");

const $dom = require("../../../dom");
const $utils = require("../../../cypress/utils");
const $errUtils = require("../../../cypress/error_utils");
const $elements = require("../../../dom/elements");
const $actionability = require("../../actionability");

module.exports = (Commands, Cypress, cy, state, config) => Commands.addAll({ prevSubject: ["element", "window"] }, {
  focus(subject, options = {}) {
    let isWin, num, verifyAssertions;
    const userOptions = options;
    //# we should throw errors by default!
    //# but allow them to be silenced
    options = _.defaults({}, userOptions, {
      $el: subject,
      error: true,
      log: true,
      verify: true
    });

    if (isWin = $dom.isWindow(options.$el)) {
      //# get this into a jquery object
      options.$el = $dom.wrap(options.$el);
    }

    if (options.log) {
      options._log = Cypress.log({
        $el: options.$el,
        consoleProps() {
          return {"Applied To": $dom.getElements(options.$el)};
        }
      });
    }

    const el = options.$el.get(0);

    //# the body is not really focusable, but it
    //# can have focus on initial page load.
    //# this is instead a noop.
    //# TODO: throw on body instead (breaking change)
    const isBody = $dom.isJquery(options.$el) &&
      $elements.isElement(options.$el.get(0)) &&
      $elements.isBody(options.$el.get(0));

    //# http://www.w3.org/$R/html5/editing.html#specially-focusable
    //# ensure there is only 1 dom element in the subject
    //# make sure its allowed to be focusable
    if (!(isWin || isBody || $dom.isFocusable(options.$el))) {
      if (options.error === false) { return; }

      const node = $dom.stringify(options.$el);
      $errUtils.throwErrByPath("focus.invalid_element", {
        onFail: options._log,
        args: { node }
      });
    }

    if ((num = options.$el.length) && (num > 1)) {
      if (options.error === false) { return; }

      $errUtils.throwErrByPath("focus.multiple_elements", {
        onFail: options._log,
        args: { num }
      });
    }


    cy.fireFocus(el);

    return (verifyAssertions = () => cy.verifyUpcomingAssertions(options.$el, options, {
      onRetry: verifyAssertions
    }))();
  },

  blur(subject, options = {}) {
    let isWin, num, verifyAssertions;
    const userOptions = options;
    //# we should throw errors by default!
    //# but allow them to be silenced
    options = _.defaults({}, userOptions, {
      $el: subject,
      $focused: cy.getFocused(),
      error: true,
      log: true,
      verify: true,
      force: false
    });

    const { $el, $focused } = options;

    if (isWin = $dom.isWindow(options.$el)) {
      //# get this into a jquery object
      options.$el = $dom.wrap(options.$el);
    }

    const isBody = options.$el.is("body");

    if (options.log) {
      //# figure out the options which actually change the behavior of clicks
      const deltaOptions = $utils.filterOutOptions(options);

      options._log = Cypress.log({
        $el: options.$el,
        message: deltaOptions,
        consoleProps() {
          return {"Applied To": $dom.getElements(options.$el)};
        }
      });
    }

    if ((num = options.$el.length) && (num > 1)) {
      if (options.error === false) { return; }

      $errUtils.throwErrByPath("blur.multiple_elements", {
        onFail: options._log,
        args: { num }
      });
    }

    //# if we haven't forced the blur, and we don't currently
    //# have a focused element OR we aren't the window or body then error
    if ((options.force !== true) && (!$focused) && (!isWin) && (!isBody)) {
      if (options.error === false) { return; }

      $errUtils.throwErrByPath("blur.no_focused_element", { onFail: options._log });
    }

    //# if we're currently window dont check for the wrong
    //# focused element because window will not show up
    //# as $focused
    if ((options.force !== true) && (!isWin) && (!isBody) && (
      options.$el.get(0) !== $focused.get(0)
    )) {
      if (options.error === false) { return; }

      const node = $dom.stringify($focused);
      $errUtils.throwErrByPath("blur.wrong_focused_element", {
        onFail: options._log,
        args: { node }
      });
    }

    const el = options.$el.get(0);

    cy.fireBlur(el);

    return (verifyAssertions = () => cy.verifyUpcomingAssertions(options.$el, options, {
      onRetry: verifyAssertions
    }))();
  }
});
