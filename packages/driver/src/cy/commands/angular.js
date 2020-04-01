/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");
const $ = require("jquery");
const Promise = require("bluebird");

const $errUtils = require("../../cypress/error_utils");

const ngPrefixes = ['ng-', 'ng_', 'data-ng-', 'x-ng-'];

module.exports = function(Commands, Cypress, cy, state, config) {
  const findByNgBinding = function(binding, options) {
    let resolveElements;
    const selector = ".ng-binding";

    const {
      angular
    } = state("window");

    _.extend(options, {verify: false, log: false});

    const getEl = function($elements) {
      const filtered = $elements.filter(function(index, el) {
        const dataBinding = angular.element(el).data("$binding");

        if (dataBinding) {
          const bindingName = dataBinding.exp || dataBinding[0].exp || dataBinding;
          return bindingName.includes(binding);
        }
      });

      //# if we have items return
      //# those filtered items
      if (filtered.length) {
        return filtered;
      }

      //# else return null element
      return $(null);
    };

    return (resolveElements = () => {
      return cy.now("get", selector, options).then($elements => {
        return cy.verifyUpcomingAssertions(getEl($elements), options, {
          onRetry: resolveElements,
          onFail(err) {
            return err.message = `Could not find element for binding: '${binding}'.`;
          }
        });
      });
    })();
  };

  const findByNgAttr = function(name, attr, el, options) {

    const selectors = [];
    let error = `Could not find element for ${name}: '${el}'.  Searched `;

    _.extend(options, {verify: false, log: false});

    const finds = _.map(ngPrefixes, prefix => {
      let resolveElements;
      const selector = `[${prefix}${attr}'${el}']`;
      selectors.push(selector);

      return (resolveElements = () => {
        return cy.now("get", selector, options).then($elements => {
          return cy.verifyUpcomingAssertions($elements, options, {
            onRetry: resolveElements
          });
        });
      })();
    });

    error += selectors.join(", ") + ".";

    const cancelAll = () => _.invokeMap(finds, "cancel");

    return Promise
    .any(finds)
    .then(function(subject) {
      cancelAll();
      return subject;}).catch(Promise.AggregateError, err => $errUtils.throwErr(error));
  };

  return Commands.addAll({
    ng(type, selector, options = {}) {
      //# what about requirejs / browserify?
      //# we need to intelligently check to see if we're using those
      //# and if angular is available through them.  throw a very specific
      //# error message here that's different depending on what module
      //# system you're using
      if (!state("window").angular) { $errUtils.throwErrByPath("ng.no_global"); }

      _.defaults(options, {log: true});

      if (options.log) {
        options._log = Cypress.log();
      }

      switch (type) {
        case "model":
          return findByNgAttr("model", "model=", selector, options);
        case "repeater":
          return findByNgAttr("repeater", "repeat*=", selector, options);
        case "binding":
          return findByNgBinding(selector, options);
      }
    }
  });
};
