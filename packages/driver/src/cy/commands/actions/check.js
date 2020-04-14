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

const checkOrUncheck = function(type, subject, values = [], userOptions = {}) {
  //# we're not handling conversion of values to strings
  //# in case we've received numbers

  //# if we're not an array but we are an object
  //# reassign userOptions to values
  if (!_.isArray(values) && _.isObject(values)) {
    userOptions = values;
    values = [];
  } else {
    //# make sure we're an array of values
    values = [].concat(values);
  }

  //# keep an array of subjects which
  //# are potentially reduced down
  //# to new filtered subjects
  const matchingElements = [];

  const options = _.defaults({}, userOptions, {
    $el: subject,
    log: true,
    force: false
  });

  const isNoop = function($el) {
    switch (type) {
      case "check":
        return $el.prop("checked");
      case "uncheck":
        return !$el.prop("checked");
    }
  };

  const isAcceptableElement = function($el) {
    switch (type) {
      case "check":
        return $el.is(":checkbox,:radio");
      case "uncheck":
        return $el.is(":checkbox");
    }
  };

  //# does our el have a value
  //# in the values array?
  //# or values array is empty
  const elHasMatchingValue = function($el) {
    const value = $elements.getNativeProp($el.get(0), "value");
    return (values.length === 0) || values.includes(value);
  };

  //# blow up if any member of the subject
  //# isnt a checkbox or radio
  const checkOrUncheckEl = (el, index) => {
    const $el = $dom.wrap(el);

    if (!isAcceptableElement($el)) {
      const node   = $dom.stringify($el);
      const word   = $utils.plural(options.$el, "contains", "is");
      const phrase = type === "check" ? " and `:radio`" : "";
      $errUtils.throwErrByPath("check_uncheck.invalid_element", {
        onFail: options._log,
        args: { node, word, phrase, cmd: type }
      });
    }

    const isElActionable = elHasMatchingValue($el);

    if (isElActionable) {
      matchingElements.push(el);
    }

    const consoleProps = {
      "Applied To":   $dom.getElements($el),
      "Elements":     $el.length
    };

    if (options.log && isElActionable) {
      //# figure out the userOptions which actually change the behavior of clicks
      const deltaOptions = $utils.filterOutOptions(options);

      options._log = Cypress.log({
        message: deltaOptions,
        $el,
        consoleProps() {
          return _.extend(consoleProps, {
            Options: deltaOptions
          });
        }
      });

      options._log.snapshot("before", {next: "after"});


      //# if the checkbox was already checked
      //# then notify the user of this note
      //# and bail
      if (isNoop($el)) {
        if (!options.force) {
          //# still ensure visibility even if the command is noop
          cy.ensureVisibility($el, options._log);
        }
        if (options._log) {
          const inputType = $el.is(":radio") ? "radio" : "checkbox";
          consoleProps.Note = `This ${inputType} was already ${type}ed. No operation took place.`;
          options._log.snapshot().end();
        }

        return null;
      }
    }

    //# if we didnt pass in any values or our
    //# el's value is in the array then check it
    if (isElActionable) {
      return cy.now("click", $el, {
        $el,
        log: false,
        verify: false,
        _log: options._log,
        force: options.force,
        timeout: options.timeout,
        interval: options.interval
      }).then(function() {
        if (options._log) { options._log.snapshot().end(); }

        return null;
      });
    }
  };

  //# return our original subject when our promise resolves
  return Promise
  .resolve(options.$el.toArray())
  .each(checkOrUncheckEl)
  .then(function() {
    //# filter down our $el to the
    //# matching elements
    let verifyAssertions;
    options.$el = options.$el.filter(matchingElements);

    return (verifyAssertions = () => {
      return cy.verifyUpcomingAssertions(options.$el, options, {
        onRetry: verifyAssertions
      });
    })();
  });
};

module.exports = function(Commands, Cypress, cy, state, config) {
  return Commands.addAll({ prevSubject: "element" }, {
    check(subject, values, options) {
      return checkOrUncheck.call(this, "check", subject, values, options);
    },

    uncheck(subject, values, options) {
      return checkOrUncheck.call(this, "uncheck", subject, values, options);
    }
  });
};
