/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");
const uniqueSelector = require("@cypress/unique-selector").default;

const $utils = require("./utils");
const $errUtils = require("./error_utils");

const SELECTOR_PRIORITIES = "data-cy data-test data-testid id class tag attributes nth-child".split(" ");

const reset = () => ({
  onElement: null,
  selectorPriority: SELECTOR_PRIORITIES
});

let defaults = reset();

module.exports = {
  reset() {
    //# for testing purposes
    return defaults = reset();
  },

  getSelectorPriority() {
    return defaults.selectorPriority;
  },

  getOnElement() {
    return defaults.onElement;
  },

  getSelector($el) {
    //# if we have a callback, and it returned truthy
    let selector;
    if (defaults.onElement && (selector = defaults.onElement($el))) {
      //# and it returned a string
      if (_.isString(selector)) {
        //# use this!
        return selector;
      }
    }

    //# else use uniqueSelector with the priorities
    return uniqueSelector($el.get(0), {
      selectorTypes: defaults.selectorPriority
    });
  },

  defaults(props) {
    let onElement, priority;
    if (!_.isPlainObject(props)) {
      $errUtils.throwErrByPath("selector_playground.defaults_invalid_arg", {
        args: { arg: $utils.stringify(props) }
      });
    }

    if (priority = props.selectorPriority) {
      if (!_.isArray(priority)) {
        $errUtils.throwErrByPath("selector_playground.defaults_invalid_priority", {
          args: { arg: $utils.stringify(priority) }
        });
      }

      defaults.selectorPriority = priority;
    }

    if (onElement = props.onElement) {
      if (!_.isFunction(onElement)) {
        $errUtils.throwErrByPath("selector_playground.defaults_invalid_on_element", {
          args: { arg: $utils.stringify(onElement) }
        });
      }

      return defaults.onElement = onElement;
    }
  }
};
