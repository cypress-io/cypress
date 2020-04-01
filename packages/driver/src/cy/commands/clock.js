/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");

const $Clock = require("../../cypress/clock");
const $errUtils = require("../../cypress/error_utils");

//# create a global clock
let clock = null;

module.exports = function(Commands, Cypress, cy, state, config) {
  const reset = function() {
    if (clock) {
      clock.restore({ log: false });
    }

    return clock = null;
  };

  //# reset before a run
  reset();

  //# remove clock before each test run, so a new one is created
  //# when user calls cy.clock()
  //#
  //# this MUST be prepended else if we are stubbing or spying on
  //# global timers they will be reset in agents before this runs
  //# its reset function
  Cypress.prependListener("test:before:run", reset);

  Cypress.on("window:before:load", function(contentWindow) {
    //# if a clock has been created before this event (likely before
    //# a cy.visit(), then bind that clock to the new window
    if (clock) {
      return clock.bind(contentWindow);
    }
  });

  return Commands.addAll({ type: "utility" }, {
    clock(subject, now, methods, options = {}) {
      const ctx = this;

      if (clock) {
        return clock;
      }

      if (_.isObject(now)) {
        options = now;
        now = undefined;
      }

      if (_.isObject(methods) && !_.isArray(methods)) {
        options = methods;
        methods = undefined;
      }

      if ((now != null) && !_.isNumber(now)) {
        $errUtils.throwErrByPath("clock.invalid_1st_arg", {args: {arg: JSON.stringify(now)}});
      }

      if ((methods != null) && !(_.isArray(methods) && _.every(methods, _.isString))) {
        $errUtils.throwErrByPath("clock.invalid_2nd_arg", {args: {arg: JSON.stringify(methods)}});
      }

      _.defaults(options, {
        log: true
      });

      const log = function(name, message, snapshot = true, consoleProps = {}) {
        if (!options.log) {
          return;
        }

        const details = clock.details();
        const logNow = details.now;
        const logMethods = details.methods.slice();

        return Cypress.log({
          name,
          message: message != null ? message : "",
          type: "parent",
          end: true,
          snapshot,
          consoleProps() {
            return _.extend({
              "Now": logNow,
              "Methods replaced": logMethods
            }, consoleProps);
          }
        });
      };

      clock = $Clock.create(state("window"), now, methods);

      const {
        tick
      } = clock;

      clock.tick = function(ms) {
        if ((ms != null) && !_.isNumber(ms)) {
          $errUtils.throwErrByPath("tick.invalid_argument", {args: {arg: JSON.stringify(ms)}});
        }

        if (ms == null) { ms = 0; }

        const theLog = log("tick", `${ms}ms`, false, {
          "Now": clock.details().now + ms,
          "Ticked": `${ms} milliseconds`
        });

        if (theLog) {
          theLog.snapshot("before", {next: "after"});
        }

        const ret = tick.apply(this, arguments);

        if (theLog) {
          theLog.snapshot().end();
        }

        return ret;
      };

      const {
        restore
      } = clock;

      clock.restore = function(options = {}) {
        const ret = restore.apply(this, arguments);

        if (options.log !== false) {
          log("restore");
        }

        ctx.clock = null;

        clock = null;

        state("clock", clock);

        return ret;
      };

      log("clock");

      state("clock", clock);

      return ctx.clock = clock;
    },

    tick(subject, ms) {
      if (!clock) {
        $errUtils.throwErrByPath("tick.no_clock");
      }

      clock.tick(ms);

      return clock;
    }
  });
};
