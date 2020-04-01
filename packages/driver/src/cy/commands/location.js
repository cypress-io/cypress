/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");
const Promise = require("bluebird");

const $errUtils = require("../../cypress/error_utils");
const $Location = require("../../cypress/location");

module.exports = (Commands, Cypress, cy, state, config) => Commands.addAll({
  url(options = {}) {
    let resolveHref;
    _.defaults(options, {log: true});

    if (options.log !== false) {
      options._log = Cypress.log({
        message: ""});
    }

    const getHref = () => {
      return cy.getRemoteLocation("href");
    };

    return (resolveHref = () => {
      return Promise.try(getHref).then(href => {
        return cy.verifyUpcomingAssertions(href, options, {
          onRetry: resolveHref
        });
      });
    })();
  },

  hash(options = {}) {
    let resolveHash;
    _.defaults(options, {log: true});

    if (options.log !== false) {
      options._log = Cypress.log({
        message: ""});
    }

    const getHash = () => {
      return cy.getRemoteLocation("hash");
    };

    return (resolveHash = () => {
      return Promise.try(getHash).then(hash => {
        return cy.verifyUpcomingAssertions(hash, options, {
          onRetry: resolveHash
        });
      });
    })();
  },

  location(key, options) {
    //# normalize arguments allowing key + options to be undefined
    //# key can represent the options
    let resolveLocation;
    if (_.isObject(key) && _.isUndefined(options)) {
      options = key;
    }

    if (options == null) { options = {}; }

    _.defaults(options, {log: true});

    const getLocation = () => {
      let ret;
      const location = cy.getRemoteLocation();

      return ret = _.isString(key) ?
        //# use existential here because we only want to throw
        //# on null or undefined values (and not empty strings)
        location[key] != null ? location[key] : $errUtils.throwErrByPath("location.invalid_key", { args: { key } })
      :
        location;
    };

    if (options.log !== false) {
      options._log = Cypress.log({
        message: key != null ? key : ""});
    }

    return (resolveLocation = () => {
      return Promise.try(getLocation).then(ret => {
        return cy.verifyUpcomingAssertions(ret, options, {
          onRetry: resolveLocation
        });
      });
    })();
  }
});
