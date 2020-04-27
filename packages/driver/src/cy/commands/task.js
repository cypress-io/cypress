/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");
const Promise = require("bluebird");

const $utils = require("../../cypress/utils");
const $errUtils = require("../../cypress/error_utils");

module.exports = (Commands, Cypress, cy, state, config) => Commands.addAll({
  task(task, arg, options = {}) {
    let consoleOutput, message;
    const userOptions = options;
    options = _.defaults({}, userOptions, {
      log: true,
      timeout: Cypress.config("taskTimeout")
    });

    if (options.log) {
      consoleOutput = {
        task,
        arg
      };

      message = task;
      if (arg) {
        message += `, ${$utils.stringify(arg)}`;
      }

      options._log = Cypress.log({
        message,
        consoleProps() {
          return consoleOutput;
        }
      });
    }

    if (!task || !_.isString(task)) {
      $errUtils.throwErrByPath("task.invalid_argument", {
        onFail: options._log,
        args: { task: task != null ? task : "" }
      });
    }

    //# need to remove the current timeout
    //# because we're handling timeouts ourselves
    cy.clearTimeout();

    return Cypress.backend("task", {
      task,
      arg,
      timeout: options.timeout
    })
    .timeout(options.timeout)
    .then(function(result) {
      if (options._log) {
        _.extend(consoleOutput, { Yielded: result });
      }
      return result;}).catch(Promise.TimeoutError, () => $errUtils.throwErrByPath("task.timed_out", {
      onFail: options._log,
      args: { task, timeout: options.timeout }
    }))

    .catch({ timedOut: true }, error => $errUtils.throwErrByPath("task.server_timed_out", {
      onFail: options._log,
      args: { task, timeout: options.timeout, error: error.message }
    }))

    .catch(function(error) {
      //# re-throw if timedOut error from above
      if (error.name === "CypressError") { throw error; }

      $errUtils.normalizeErrorStack(error);

      if (error != null ? error.isKnownError : undefined) {
        $errUtils.throwErrByPath("task.known_error", {
          onFail: options._log,
          args: { task, error: error.message }
        });
      }

      return $errUtils.throwErrByPath("task.failed", {
        onFail: options._log,
        args: { task, error: (error != null ? error.stack : undefined) || (error != null ? error.message : undefined) || error }
      });
    });
  }
});
