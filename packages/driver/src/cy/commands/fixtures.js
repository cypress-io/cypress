/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");
const Promise = require("bluebird");

const $errUtils = require("../../cypress/error_utils");

const fixturesRe = /^(fx:|fixture:)/;

const clone = obj => JSON.parse(JSON.stringify(obj));

module.exports = function(Commands, Cypress, cy, state, config) {
  //# this is called at the beginning of run, so clear the cache
  let cache = {};

  const reset = () => cache = {};

  Cypress.on("clear:fixtures:cache", reset);

  return Commands.addAll({
    fixture(fixture, ...args) {
      let resp;
      if (config("fixturesFolder") === false) {
        $errUtils.throwErrByPath("fixture.set_to_false");
      }

      //# if we already have cached
      //# this fixture then just return it

      //# always return a promise here
      //# to make our interface consistent
      //# for use by other code
      if (resp = cache[fixture]) {
        //# clone the object first to prevent
        //# accidentally mutating the one in the cache
        return Promise.resolve(clone(resp));
      }

      let options = {};

      switch (false) {
        case !_.isObject(args[0]):
          options = args[0];
          break;

        case !_.isObject(args[1]):
          options = args[1];
          break;
      }

      if (_.isString(args[0])) {
        options.encoding = args[0];
      }

      const timeout = options.timeout != null ? options.timeout : Cypress.config("responseTimeout");

      //# need to remove the current timeout
      //# because we're handling timeouts ourselves
      cy.clearTimeout("get:fixture");

      return Cypress.backend("get:fixture", fixture, _.pick(options, "encoding"))
      .timeout(timeout)
      .then(response => {
        let err;
        if (err = response.__error) {
          return $errUtils.throwErr(err);
        } else {
          //# add the fixture to the cache
          //# so it can just be returned next time
          cache[fixture] = response;

          //# return the cloned response
          return clone(response);
        }
    }).catch(Promise.TimeoutError, err => $errUtils.throwErrByPath("fixture.timed_out", {
        args: { timeout }
      }));
    }
  });
};
