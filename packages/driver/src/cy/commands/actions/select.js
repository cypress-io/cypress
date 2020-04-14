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
const $elements = require('../../../dom/elements');

const newLineRe = /\n/g;

module.exports = (Commands, Cypress, cy, state, config) => Commands.addAll({ prevSubject: "element" }, {
  select(subject, valueOrText, options = {}) {
    let node, num;
    const userOptions = options;

    options = _.defaults({}, userOptions, {
      $el: subject,
      log: true,
      force: false
    }
    );

    const consoleProps = {};

    if (options.log) {
      //# figure out the options which actually change the behavior of clicks
      const deltaOptions = $utils.filterOutOptions(options);

      options._log = Cypress.log({
        message: deltaOptions,
        $el: options.$el,
        consoleProps() {
          //# merge into consoleProps without mutating it
          return _.extend({}, consoleProps, {
            "Applied To": $dom.getElements(options.$el),
            "Options":    deltaOptions
          }
          );
        }
      });

      options._log.snapshot("before", {next: "after"});
    }

    //# if subject is a <select> el assume we are filtering down its
    //# options to a specific option first by value and then by text
    //# we'll throw if more than one is found AND the select
    //# element is multiple=multiple

    //# if the subject isn't a <select> then we'll check to make sure
    //# this is an option
    //# if this is multiple=multiple then we'll accept an array of values
    //# or texts and clear the previous selections which matches jQuery's
    //# behavior

    if (!options.$el.is("select")) {
      node = $dom.stringify(options.$el);
      $errUtils.throwErrByPath("select.invalid_element", { args: { node } });
    }

    if ((num = options.$el.length) && (num > 1)) {
      $errUtils.throwErrByPath("select.multiple_elements", { args: { num } });
    }

    //# normalize valueOrText if its not an array
    valueOrText = [].concat(valueOrText);
    const multiple    = options.$el.prop("multiple");

    //# throw if we're not a multiple select and we've
    //# passed an array of values
    if (!multiple && (valueOrText.length > 1)) {
      $errUtils.throwErrByPath("select.invalid_multiple");
    }

    const getOptions = function() {
      //# throw if <select> is disabled
      let notAllUniqueValues;
      if (options.$el.prop("disabled")) {
        node = $dom.stringify(options.$el);
        $errUtils.throwErrByPath("select.disabled", { args: { node } });
      }

      const values = [];
      const optionEls = [];
      const optionsObjects = options.$el.find("option").map(function(index, el) {
        //# push the value in values array if its
        //# found within the valueOrText
        const value = $elements.getNativeProp(el, "value");
        const optEl = $dom.wrap(el);

        if (valueOrText.includes(value)) {
          optionEls.push(optEl);
          values.push(value);
        }

        //# replace new line chars, then trim spaces
        const trimmedText = optEl.text().replace(newLineRe, "").trim();

        //# return the elements text + value
        return {
          value,
          originalText: optEl.text(),
          text: trimmedText,
          $el: optEl
        };
      }).get();

      //# if we couldn't find anything by value then attempt
      //# to find it by text and insert its value into values arr
      if (!values.length) {
        //# if any of the values are the same and the user is trying to
        //# select based on the text, setting the value won't work
        //# `notAllUniqueValues` is used later to do the right thing
        const uniqueValues = _.chain(optionsObjects).map("value").uniq().value();
        notAllUniqueValues = uniqueValues.length !== optionsObjects.length;

        _.each(optionsObjects, function(obj, index) {
          if (valueOrText.includes(obj.text)) {
            optionEls.push(obj.$el);
            const objValue = obj.value;
            return values.push(objValue);
          }
        });
      }

      //# if we didnt set multiple to true and
      //# we have more than 1 option to set then blow up
      if (!multiple && (values.length > 1)) {
        $errUtils.throwErrByPath("select.multiple_matches", {
          args: { value: valueOrText.join(", ") }
        });
      }

      if (!values.length) {
        $errUtils.throwErrByPath("select.no_matches", {
          args: { value: valueOrText.join(", ") }
        });
      }

      _.each(optionEls, $el => {
        if ($el.prop("disabled")) {
          node = $dom.stringify($el);
          return $errUtils.throwErrByPath("select.option_disabled", {
            args: { node }
          });
        }
      });

      return {values, optionEls, optionsObjects, notAllUniqueValues};
    };

    var retryOptions = () => Promise
    .try(getOptions)
    .catch(function(err) {
      options.error = err;

      return cy.retry(retryOptions, options);
    });

    return Promise
    .try(retryOptions)
    .then(function(obj = {}) {
      const {values, optionEls, optionsObjects, notAllUniqueValues} = obj;

      //# preserve the selected values
      consoleProps.Selected = values;

      return cy.now("click", options.$el, {
        $el: options.$el,
        log: false,
        verify: false,
        errorOnSelect: false, //# prevent click errors since we want the select to be clicked
        _log: options._log,
        force: options.force,
        timeout: options.timeout,
        interval: options.interval
      }).then( () => //# TODO:
      //# 1. test cancelation
      //# 2. test passing optionEls to each directly
      //# 3. update other tests using this Promise.each pattern
      //# 4. test that force is always true
      //# 5. test that command is not provided (undefined / null)
      //# 6. test that option actually receives click event
      //# 7. test that select still has focus (i think it already does have a test)
      //# 8. test that multiple=true selects receive option event for each selected option
      Promise
      .resolve(optionEls) //# why cant we just pass these directly to .each?
      .each(optEl => cy.now("click", optEl, {
        $el: optEl,
        log: false,
        verify: false,
        force: true, //# always force the click to happen on the <option>
        timeout: options.timeout,
        interval: options.interval
      })).then(function() {
        //# reset the selects value after we've
        //# fired all the proper click events
        //# for the options
        //# TODO: shouldn't we be updating the values
        //# as we click the <option> instead of
        //# all afterwards?
        options.$el.val(values);

        if (notAllUniqueValues) {
          //# if all the values are the same and the user is trying to
          //# select based on the text, setting the val() will just
          //# select the first one
          let selectedIndex = 0;
          _.each(optionEls, function($el) {
            const index = _.findIndex(optionsObjects, optionObject => $el.text() === optionObject.originalText);
            selectedIndex = index;
            return $el.prop("selected", "selected");
          });

          options.$el[0].selectedIndex = selectedIndex;
          options.$el[0].selectedOptions = _.map(optionEls, $el => $el.get());
        }

        const input = new Event("input", {
          bubbles: true,
          cancelable: false
        });

        options.$el.get(0).dispatchEvent(input);

        //# yup manually create this change event
        //# 1.6.5. HTML event types
        //# scroll down to 'change'
        const change = document.createEvent("HTMLEvents");
        change.initEvent("change", true, false);

        return options.$el.get(0).dispatchEvent(change);})).then(function() {
        let verifyAssertions;
        return (verifyAssertions = () => cy.verifyUpcomingAssertions(options.$el, options, {
          onRetry: verifyAssertions
        }))();
      });
    });
  }
});
